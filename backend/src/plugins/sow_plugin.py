from semantic_kernel import Kernel
from semantic_kernel.functions import kernel_function
from typing import Annotated, Optional, Dict, Any
from rich.logging import RichHandler
from pydantic import BaseModel, Field
from model.project_types import Project, ProjectTask, SOWDeliverable, SOWDocument, SOWMilestone
import logging
import json
import logging
from enum import Enum
from typing import ClassVar, List
from typing import Annotated

from openai import project
from pydantic import BaseModel, Field
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.chat_completion_client_base import \
    ChatCompletionClientBase
from semantic_kernel.connectors.ai.open_ai import \
    AzureChatPromptExecutionSettings
from semantic_kernel.contents import ChatHistory
from semantic_kernel.functions import kernel_function
from semantic_kernel.processes.kernel_process import (KernelProcessStep,
                                                      KernelProcessStepContext,
                                                      KernelProcessStepState)
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from model.project_types import Project, ProjectTask
from semantic_kernel.functions.kernel_arguments import KernelArguments
from datetime import datetime
from mailmerge import MailMerge
import os
# logging.basicConfig(
#     format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
#     datefmt="%Y-%m-%d %H:%M:%S",
#     level=logging.INFO,
#     handlers=[RichHandler()]
# )

logger = logging.getLogger(__name__)

TEMPLATE_LOCATION = "/Users/zouang/code/lenovo/ProjectManagementAgents/data/sow-template-new.docx"

class CreateSOWInput(BaseModel):
    project: Project
    task_list: List[ProjectTask]

class SOWPlugin:

    kernel: Kernel

    system_prompt: ClassVar[str] = """
    # ROLE
        You are a senior project manager and you are responsible for creating SOW(Statement of Work) document for a project.
        You will be provided with a project description and you need to create SOW document for the project.

    # INSTRUCTIONS
        1. You will be provided with a project description and you need to create SOW document for the project.
        2. Output in JSON format.
    
    # INPUT FORMAT
        You will be provided with a JSON object with the following format:
        {input_format}
    
    # OUTPUT FORMAT
    The SOW document should follow the following schema:
        {output_format}
    """

    def __init__(self, kernel: Annotated[Kernel | None, "The kernel", {"include_in_function_choices": False}] = None):
        self.kernel = kernel


    @kernel_function(
        description="Create SOW(Statement of Work) document based on the provided JSON input.",
        name="SOWDocumentCreator",
    )
    async def create_sow_document(self, create_sow_input: Annotated[CreateSOWInput, "The Input JSON object to create a SOW document"]) -> str:
        logger.info(f"Creating SOW document for input: {create_sow_input}")
        if not create_sow_input:
            return "Please provide a valid JSON input to create a SOW document."
        settings = AzureChatPromptExecutionSettings()
        settings.function_choice_behavior = FunctionChoiceBehavior.Auto(filters={"included_plugins": ["mermaid_plugin", "resource_plugin"]})
        settings.response_format = SOWDocument
        agent = ChatCompletionAgent(
            kernel=self.kernel,
            name = "SOWAgent",
            instructions= self.system_prompt.format(
                output_format = SOWDocument.model_dump_json()
            ),
            arguments=KernelArguments(settings=settings)
        )
        thread = ChatHistoryAgentThread()
        logger.info("thread: %s", thread)
        response = await agent.get_response(messages = create_sow_input.model_dump_json(), thread=thread)
        logger.warning("Agent response: %s", response.message.content)

        formatted_response: SOWDocument = SOWDocument.model_validate_json(response.message.content)
        sow_document = MailMerge(TEMPLATE_LOCATION)
        sow_document.merge(formatted_response.model_dump())
        sow_document.merge_rows('MileStoneNumber', formatted_response.model_dump().get('milestones'))
        sow_document.merge_rows('DeliverableNumber', formatted_response.model_dump().get('deliverables'))
        sow_document.write("./output/sow_document.docx")
        return "SOW document created successfully."
