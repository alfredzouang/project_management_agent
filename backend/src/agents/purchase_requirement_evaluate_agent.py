from ast import In
import asyncio
import logging
import os

from collections.abc import AsyncIterable
from enum import Enum
from typing import TYPE_CHECKING, Annotated, Any, Literal

import httpx
import json
from dotenv import load_dotenv
from pydantic import BaseModel
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai.open_ai import (
    AzureChatCompletion,
    OpenAIChatCompletion,
    OpenAIChatPromptExecutionSettings,
)
from semantic_kernel.contents import (
    FunctionCallContent,
    FunctionResultContent,
    StreamingChatMessageContent,
    StreamingTextContent,
)
from semantic_kernel.functions import KernelArguments, kernel_function
from rich.logging import RichHandler
import sqlite3
from semantic_kernel.agents import ConcurrentOrchestration
from pydantic import BaseModel
from model.purchase_requirements_types import (
    PurchaseRequirementEvaluationResponse, ResumeEvaluationResult, PurchaseRequirementEvaluationRequest
)


from a2a.client import A2AClient, A2ACardResolver
from a2a.types import MessageSendParams, SendMessageRequest, SendStreamingMessageRequest
import httpx
from uuid import uuid4
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from semantic_kernel.agents import ConcurrentOrchestration
from sympy import Li
from semantic_kernel.agents.runtime import InProcessRuntime
from semantic_kernel.agents import Agent, AgentResponseItem

load_dotenv(override=True)

logging.basicConfig(
    format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
    handlers=[RichHandler()],
)

if TYPE_CHECKING:
    from semantic_kernel.connectors.ai.chat_completion_client_base import (
        ChatCompletionClientBase,
    )
    from semantic_kernel.contents import ChatMessageContent

logger = logging.getLogger(__name__)

AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")
AZURE_OPENAI_API_BASE = os.getenv("AZURE_OPENAI_API_BASE", AZURE_OPENAI_ENDPOINT)

A2A_SERVER_URL = os.getenv("A2A_SERVER_URL", "http://localhost:9002")

def get_response_text(chunk):
        data = chunk.model_dump(mode='json', exclude_none=True)
        if 'result' in data and 'artifacts' in data['result']:
            return data['result']['artifacts'][0]['parts'][0]['text']
        if 'result' in data and 'parts' in data['result']:
            return data['result']['parts'][0]['text']

class ResumeSingleEvaluateTool:
    
    
    @kernel_function(
        description="Evaluate a single resume based on the provided purchase requirement and consultant resumes.",
        name="evaluate_single_resume"
    )
    async def evaluate_resume(self, user_input: str) -> str:
        async with httpx.AsyncClient(timeout=60) as httpx_client:
            resolver = A2ACardResolver(httpx_client=httpx_client, base_url=A2A_SERVER_URL)
            agent_card = await resolver.get_agent_card()

            client = A2AClient(httpx_client=httpx_client, agent_card=agent_card)

            request = SendMessageRequest(
                id=str(uuid4()),
                params=MessageSendParams(
                    message={
                        "messageId": uuid4().hex,
                        "role": "user",
                        "parts": [{"text": user_input}],
                        # Generate a unique random context ID for each request
                        "contextId": str(uuid4()),
                    }
                )
            )
            response = await client.send_message(request)
            result = response.model_dump(mode='json', exclude_none=True)
            logger.info(f"Resume evaluation tool response: {result}")

            return get_response_text(response)

class PurchaseRequirementEvaluationTool:
    @kernel_function(
        description="Evaluate purchase requirements based on provided resumes.",
        name="evaluate_purchase_requirement"
    )
    async def evaluate_purchase_requirement(self, user_input: PurchaseRequirementEvaluationRequest) -> PurchaseRequirementEvaluationResponse:
        agents = []
        for resume in user_input.resumeNos:
            agent = ChatCompletionAgent(
                service=AzureChatCompletion(
                    deployment_name=AZURE_OPENAI_API_MODEL,
                    api_key=AZURE_OPENAI_API_KEY,
                    base_url=AZURE_OPENAI_ENDPOINT,
                    endpoint=AZURE_OPENAI_ENDPOINT,
                    api_version=AZURE_OPENAI_API_VERSION,
                    service_id="default"
                ),
                name=f"ResumeEvaluator_{resume}",
                instructions=f"""
                You are a helpful resume evaluation assistant. Your task is to evaluate the provided resume based on
                the purchase requirement details. Use the provided tools to assist users with their resume.
                ALWAYS Use evaluate_single_resume tool to evaluate the resume.
                """,
                plugins=[ResumeSingleEvaluateTool()],
                arguments=KernelArguments(
                    settings=OpenAIChatPromptExecutionSettings(
                        response_format=ResumeEvaluationResult,
                        function_choice_behavior=FunctionChoiceBehavior.Auto(),
                        parallel_tool_calls=True,
                    )
                )
            )
            agents.append(agent)

        async def consume_generator(gen):
            async for result in gen:
                return result

        tasks = []
        for agent, resume in zip(agents, user_input.resumeNos):
            gen = agent.invoke(
                messages=f"Evaluate the resume with ID {resume} based on the purchase requirement code: {user_input.pr_code}, use the provided tools to retrieve the details.",
                thread=ChatHistoryAgentThread(thread_id=str(uuid4()))
            )
            tasks.append(consume_generator(gen))
        results = await asyncio.gather(*tasks)
        evaluations = []
        for result in results:
            logger.info(f"Evaluation result: {result}")
            if isinstance(result, str):
                evaluations.append(ResumeEvaluationResult.model_validate_json(result))
            elif isinstance(result, AgentResponseItem):
                evaluations.append(result.message.content)
        logger.info(f"Evaluations: {evaluations}")
        return evaluations


class PurchaseRequirementEvaluateAgent:
    """Wraps Semantic Kernel-based agents to handle Purchase Requirement Evaluation tasks."""

    agent: ChatCompletionAgent
    thread: ChatHistoryAgentThread = None
    SUPPORTED_CONTENT_TYPES = ['text', 'text/plain']
    service_id: str = 'purchase_requirement_evaluate_agent_service'

    def __init__(self):
        # Configure the chat completion service explicitly
        # It uses Azure OpenAI by default. Please change to ChatServices.OPENAI in case you want to use OpenAI service.
        chat_service = AzureChatCompletion(
            deployment_name=AZURE_OPENAI_API_MODEL,
            api_key=AZURE_OPENAI_API_KEY,
            base_url=AZURE_OPENAI_ENDPOINT,
            endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
            service_id=self.service_id
        )

        # Define the main TravelManagerAgent to delegate tasks to the appropriate agents
        self.agent = ChatCompletionAgent(
            service=chat_service,
            name="PurchaseRequirementEvaluateAgent",
            instructions="""
            You are a senior HR. You job is to evaluate resumes based on the provided purchase requirement (PR) and consultant resumes.
            Use the provided tools to evaluate resumes.
            Each evaluation request should include the PR details and one resume at a time.
            Make sure to evaluate all resumes for the given PR and generate a comprehensive evaluation report.
            The evaluation report should include:
            - Resume No. or Item No.
            - Your understanding of the PR and how the resume matches it
            - A list of resumes that best match the PR
            -- The list should include:
                - Resume No. or Item No.
                - Consultant Name
                - K-Level (K1, K2, K3, K4)
                - Rating (Daily cost estimated based on K-Level)
                - Comments (optional)
                - Suggestions level (From 1 to 5, 1 being the lowest)

            DO NOT PROVIDE CANCELED RESUMES IN THE EVALUATION REPORT.
            """,
            plugins=[PurchaseRequirementEvaluationTool()],
            arguments=KernelArguments(
                        settings=OpenAIChatPromptExecutionSettings(
                            response_format=PurchaseRequirementEvaluationResponse,
                            function_choice_behavior=FunctionChoiceBehavior.Auto(),
                            parallel_tool_calls=True
                        )
                    ),
        )

    async def invoke(self, user_input: str, session_id: str) -> dict[str, Any]:
        """Handle synchronous tasks (like tasks/send).

        Args:
            user_input (str): User input message.
            session_id (str): Unique identifier for the session.

        Returns:
            dict: A dictionary containing the content, task completion status,
            and user input requirement.
        """
        await self._ensure_thread_exists(session_id)

        # Use SK's get_response for a single shot
        response = await self.agent.get_response(
            messages=user_input,
            thread=self.thread,
        )
        return self._get_agent_response(response.content)

    async def stream(
        self,
        user_input: str,
        session_id: str,
    ) -> AsyncIterable[dict[str, Any]]:
        """For streaming tasks we yield the SK agent's invoke_stream progress.

        Args:
            user_input (str): User input message.
            session_id (str): Unique identifier for the session.

        Yields:
            dict: A dictionary containing the content, task completion status,
            and user input requirement.
        """
        await self._ensure_thread_exists(session_id)

        plugin_notice_seen = False
        plugin_event = asyncio.Event()

        text_notice_seen = False
        chunks: list[StreamingChatMessageContent] = []

        async def _handle_intermediate_message(
            message: 'ChatMessageContent',
        ) -> None:
            """Handle intermediate messages from the agent."""
            nonlocal plugin_notice_seen
            if not plugin_notice_seen:
                plugin_notice_seen = True
                plugin_event.set()
            # An example of handling intermediate messages during function calling
            for item in message.items or []:
                if isinstance(item, FunctionResultContent):
                    print(
                        f'SK Function Result:> {item.result} for function: {item.name}'
                    )
                elif isinstance(item, FunctionCallContent):
                    print(
                        f'SK Function Call:> {item.name} with arguments: {item.arguments}'
                    )
                else:
                    print(f'SK Message:> {item}')

        async for chunk in self.agent.invoke_stream(
            messages=user_input,
            thread=self.thread,
            on_intermediate_message=_handle_intermediate_message,
        ):
            if plugin_event.is_set():
                yield {
                    'is_task_complete': False,
                    'require_user_input': False,
                    'content': 'Processing function calls...',
                }
                plugin_event.clear()

            if any(isinstance(i, StreamingTextContent) for i in chunk.items):
                if not text_notice_seen:
                    yield {
                        'is_task_complete': False,
                        'require_user_input': False,
                        'content': 'Building the output...',
                    }
                    text_notice_seen = True
                chunks.append(chunk.message)

        if chunks:
            yield self._get_agent_response(sum(chunks[1:], chunks[0]))

    def _get_agent_response(
        self, message: 'ChatMessageContent'
    ) -> dict[str, Any]:
        """Extracts the structured response from the agent's message content.

        Args:
            message (ChatMessageContent): The message content from the agent.

        Returns:
            dict: A dictionary containing the content, task completion status, and user input requirement.
        """
        structured_response = PurchaseRequirementEvaluationResponse.model_validate_json(
            message.content
        )

        default_response = {
            'is_task_complete': False,
            'require_user_input': True,
            'content': 'We are unable to process your request at the moment. Please try again.',
        }

        if isinstance(structured_response, PurchaseRequirementEvaluationResponse):
            response_map = {
                'input_required': {
                    'is_task_complete': False,
                    'require_user_input': True,
                },
                'error': {
                    'is_task_complete': False,
                    'require_user_input': True,
                },
                'completed': {
                    'is_task_complete': True,
                    'require_user_input': False,
                },
            }

            response = response_map.get(structured_response.status)
            structure_response_json_str = structured_response.model_dump_json()
            if response:
                return {**response, 'content': structure_response_json_str}

        return default_response

    async def _ensure_thread_exists(self, session_id: str) -> None:
        """Ensure the thread exists for the given session ID.

        Args:
            session_id (str): Unique identifier for the session.
        """
        if self.thread is None or self.thread.id != session_id:
            await self.thread.delete() if self.thread else None
            self.thread = ChatHistoryAgentThread(thread_id=session_id)
