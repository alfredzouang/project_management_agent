import asyncio
import logging
import os

from collections.abc import AsyncIterable
from enum import Enum
from typing import TYPE_CHECKING, Annotated, Any, Dict, Literal

import httpx
import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field
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
from db.models.base_model import SessionLocal
from db.models.project_management_models import Consultant, Resume, WorkexResume
from sqlalchemy import text

from sympy import Li

load_dotenv(override=True)

# Set the logging level for  semantic_kernel.kernel to DEBUG.

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

# region Chat Service Configuration


class ChatServices(str, Enum):
    """Enum for supported chat completion services."""

    AZURE_OPENAI = 'azure_openai'
    OPENAI = 'openai'


service_id = 'default'


def get_chat_completion_service(
    service_name: ChatServices,
) -> 'ChatCompletionClientBase':
    """Return an appropriate chat completion service based on the service name.

    Args:
        service_name (ChatServices): Service name.

    Returns:
        ChatCompletionClientBase: Configured chat completion service.

    Raises:
        ValueError: If the service name is not supported or required environment variables are missing.
    """
    if service_name == ChatServices.AZURE_OPENAI:
        return _get_azure_openai_chat_completion_service()
    if service_name == ChatServices.OPENAI:
        return _get_openai_chat_completion_service()
    raise ValueError(f'Unsupported service name: {service_name}')


def _get_azure_openai_chat_completion_service() -> AzureChatCompletion:
    """Return Azure OpenAI chat completion service.

    Returns:
        AzureChatCompletion: The configured Azure OpenAI service.
    """
    return AzureChatCompletion(
        deployment_name=AZURE_OPENAI_API_MODEL,
        api_key=AZURE_OPENAI_API_KEY,
        base_url=AZURE_OPENAI_ENDPOINT,
        endpoint=AZURE_OPENAI_ENDPOINT,
        api_version=AZURE_OPENAI_API_VERSION,
        service_id=service_id
    )


def _get_openai_chat_completion_service() -> OpenAIChatCompletion:
    """Return OpenAI chat completion service.

    Returns:
        OpenAIChatCompletion: Configured OpenAI service.
    """
    return OpenAIChatCompletion(
        service_id=service_id,
        ai_model_id=os.getenv('OPENAI_MODEL_ID'),
        api_key=os.getenv('OPENAI_API_KEY'),
    )


# endregion

# region Plugin


class ResumePlugin:
    """A simple resume plugin that reads resume data from database.

    The Plugin is used by the `resume_evaluate_agent`.
    """

    @kernel_function(
        description='Retrieves resume and purchase requirement data for a given resume number starting with "RN" and purchase request code starting with "PR"'
    )
    def get_resume_data(
        self,
        pr_code: Annotated[
            str, 'The purchase request code to retrieve data for, it starts with "PR"'
        ],
        resume_no: Annotated[
            str, 'The resume number to retrieve data for, it starts with "RN"'
        ]
    ) -> dict:
        try:
            session = SessionLocal()
            logger.info(f"Retrieving resume data for PR Code: {pr_code}, Resume No.: {resume_no}")

            # 查询 purchase_requirement 基本信息
            pr_row = session.execute(
                text('SELECT * FROM purchase_requirement WHERE "PR Code" = :pr_code'),
                {"pr_code": pr_code}
            ).mappings().first()
            if pr_row is None:
                logger.info(json.dumps({"error": f"No purchase requirement found for PR Code={pr_code}"}))
                pr_dict = {}
            else:
                pr_dict = dict(pr_row)
            logger.info(f"Purchase Requirement data retrieved: {pr_dict}")

            # 查询 consultant 基本信息
            consultant_row = session.execute(
                text('SELECT * FROM consultant WHERE "Resume No." = :resume_no'),
                {"resume_no": resume_no}
            ).mappings().first()
            if consultant_row is None:
                logger.info(json.dumps({"error": f"No consultant found for Resume No.={resume_no}"}))
                consultant_dict = {}
            else:
                consultant_dict = dict(consultant_row)
            logger.info(f"Consultant data retrieved: {consultant_dict}")

            # 查询 resume 信息
            resume_row = session.execute(
                text('SELECT * FROM resume WHERE ItemNo = :resume_no'),
                {"resume_no": resume_no}
            ).mappings().first()
            if resume_row is None:
                logger.info(json.dumps({"error": f"No resume found for ItemNo={resume_no}"}))
                resume_dict = {}
            else:
                logger.info(f"Resume data retrieved for ItemNo={resume_no}")
                resume_dict = dict(resume_row)

            # 查询所有工作经历
            workex_rows = session.execute(
                text('SELECT Company, JobTitle, StartDate, EndDate, Description FROM workexresume WHERE ItemNo = :resume_no'),
                {"resume_no": resume_no}
            ).mappings().all()
            work_experiences = []
            for row in workex_rows:
                work_experiences.append({
                    "Company": row["Company"],
                    "JobTitle": row["JobTitle"],
                    "StartDate": row["StartDate"],
                    "EndDate": row["EndDate"],
                    "Description": row["Description"]
                })

            # 合并输出
            result = {
                "pr_info": pr_dict,
                "consultant": consultant_dict,
                "resume": resume_dict,
                "work_experiences": work_experiences
            }
            logger.info(json.dumps(result, ensure_ascii=False, indent=2))
            session.close()
            return result
        except Exception as e:
            return f'Resume data failed to retrieve: {e!s}'


class SkillLevelPlugin:
    """A simple plugin to retrieve skill levels from the database.

    The Plugin is used by the `resume_evaluate_agent`.
    """

    @kernel_function(
        description='Retrieves skill levels for a given skill model name'
    )
    def get_skill_level(
        self,
        skill_model_name: Annotated[
            str, 'The name of the skill to retrieve level for'
        ]
    ) -> str:
        try:
            session = SessionLocal()
            logger.info(f"Retrieving skill levels for {skill_model_name}")
            rows = session.execute(
                text(
                    "SELECT Skill, Name, Range FROM active_rating_values WHERE Skill LIKE :pattern COLLATE NOCASE"
                ),
                {"pattern": f"%{skill_model_name}%"}
            ).mappings().all()
            if not rows:
                return f'No skill level found for {skill_model_name}'
            skill_levels = []
            for row in rows:
                skill_levels.append({
                    "Skill": row["Skill"],
                    "Name": row["Name"],
                    "Range": row["Range"]
                })
            session.close()
            logger.info(f'Skill levels for {skill_model_name}: {skill_levels}')
            return json.dumps(skill_levels, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f'Skill level retrieval failed: {e!s}')
            return f'Skill level retrieval failed: {e!s}'
        
class PurchaseRequirementPlugin:

    @kernel_function(
        description='Retrieves purchase requirement data for a given purchase request code'
    )
    def get_purchase_requirement_data(
        self,
        pr_code: Annotated[
            str, 'The purchase request code to retrieve data for, it starts with "PR"'
        ]
    ) -> dict:
        try:
            session = SessionLocal()
            logger.info(f"Retrieving purchase requirement data for {pr_code}")
            row = session.execute(
                text('SELECT * FROM purchase_requirement WHERE "PR Code" = :pr_code'),
                {"pr_code": pr_code}
            ).mappings().first()
            if row is None:
                return f'No purchase requirement found for PR Code={pr_code}'
            result = dict(row)
            session.close()
            logger.info(f'Purchase requirement data for {pr_code}: {result}')
            return result
        except Exception as e:
            logger.error(f'Purchase requirement retrieval failed: {e!s}')
            return f'Purchase requirement retrieval failed: {e!s}'
# endregion

# region Response Format
class ConsultantBasicInfo(BaseModel):
    """A Consultant Basic Info model to direct how the model should respond."""

    resume_no: str
    consultant_name: str
    consultant_email: str | None = None
    consultant_phone: str | None = None
    consultant_vendor_id: str | None = None
    consultant_itcode: str | None = None
    consultant_vendor_name_cn: str | None = None
    consultant_vendor_name_en: str | None = None
    consultant_status: str | None = None
    consultant_base_location: str | None = None
    consultant_base_country: str | None = None
    consultant_skill_model: str | None = None
    consultant_skill_model_status: str | None = None
    consultant_experience: str | None = None
    consultant_k_level: str | None = None
    consultant_rate_currency: str | None = None
    consultant_rate: float | None = None
    consultant_approve_status: str | None = None
    consultant_onboard_status: str | None = None
    consultant_working_hours_per_week: int | None = None
    consultant_itcode_status: str | None = None
    consultant_account_type: str | None = None
    consultant_manager: str | None = None
    consultant_t3_org_name: str | None = None


class ResumeFormat(BaseModel):
    """A Resume Format model to direct how the model should respond."""

    resume_no: str
    consultant_name: str
    consultant_purchase_request_no: str | None = None
    consultant_department: str | None = None
    consultant_tower_name: str | None = None
    consultant_vendor_name: str | None = None
    consultant_is_lenovo_experienced: bool | None = None
    consultant_english_level: str | None = None
    consultant_vm_focal: str | None = None
    consultant_proposed_cv_date: str | None = None
    consultant_is_interviewed: bool | None = None
    consultant_interview_date: str | None = None
    consultant_comments: str | None = None
    consultant_is_created_cob: str | None = None
    consultant_estimate_mandays: int | None = None
    consultant_original_rate: float | None = None
    consultant_approved_rate: float | None = None
    consultant_fail_reason: str | None = None
    consultant_working_years: float | None = None
    consultant_office_mode: str | None = None
    consultant_contract_no: str | None = None

class WorkExperienceFormat(BaseModel):
    """A Work Experience Format model to direct how the model should respond."""

    company: str
    job_title: str
    start_date: str
    end_date: str | None = None
    description: str | None = None

class ConsultantResumeFormat(BaseModel):
    """A Consultant Resume Format model to direct how the model should respond."""

    consultant_basic_info: ConsultantBasicInfo
    resume: ResumeFormat
    work_experiences: list[WorkExperienceFormat] | None = None

class EvaluatedSkillFormat(BaseModel):
    """A Evaluated Skill Format model to direct how the model should respond."""

    skill_name: str
    skill_level: str | None = None
    skill_range: str | None = None
    
    evaluated_skill_rating: int | None = Field(
        default=None,
        description="The evaluated cost for this resume per man-day, should be in the range of k-level"
    )
    evaluated_skill_rating_reason: str | None = Field(
        default=None,
        description="The reason for the evaluated skill rating."
    )

class ResponseFormat(BaseModel):
    """A Response Format model to direct how the model should respond."""

    consultant_resume: ConsultantResumeFormat
    evaluated_level_for_consultant: EvaluatedSkillFormat
    status: Literal['input_required', 'error', 'completed'] = 'completed'
    message: str



# endregion

# region Semantic Kernel Agent


class ResumeEvaluateAgent:
    """Wraps Semantic Kernel-based agents to handle Resume Evaluation tasks."""

    agent: ChatCompletionAgent
    threads: Dict[str, ChatHistoryAgentThread] = None
    SUPPORTED_CONTENT_TYPES = ['text', 'text/plain']

    def __init__(self):
        # Configure the chat completion service explicitly
        # It uses Azure OpenAI by default. Please change to ChatServices.OPENAI in case you want to use OpenAI service.
        chat_service = get_chat_completion_service(ChatServices.AZURE_OPENAI)
        self.threads = {}
        resume_data_agent = ChatCompletionAgent(
            service=chat_service,
            name='ResumeDataAgent',
            instructions=(
                'You specialize in retrieving and processing resume data. '
                'This includes fetching consultant basic information, resume details, and work experiences '
                'from the database based on the provided resume number and purchase requirement code. '
                'Your goal is to provide structured and accurate resume data for evaluation purposes.'
            ),
            plugins=[ResumePlugin()],
        )

        # Define a SkillDataAgent to handle skill-related tasks
        skill_data_agent = ChatCompletionAgent(
            service=chat_service,
            name='SkillEvaluationAgent',
            instructions=(
                'You specialize in retrieving and processing skill level data. '
                'This includes fetching skill model names, levels, and other relevant information '
                'from the database based on the provided skill model name. '
                'Your goal is to provide structured and accurate skill data for evaluation purposes.'
            ),
            plugins=[SkillLevelPlugin()],
        )

        purchase_requirement_data_agent = ChatCompletionAgent(
            service=chat_service,
            name='PurchaseRequirementDataAgent',
            instructions=(
                'You specialize in retrieving and processing purchase requirement data. '
                'This includes fetching purchase requirement details based on the provided purchase request code. '
                'Your goal is to provide structured and accurate purchase requirement data for evaluation purposes.'
            ),
            plugins=[PurchaseRequirementPlugin()],
        )

        # Define the main TravelManagerAgent to delegate tasks to the appropriate agents
        self.agent = ChatCompletionAgent(
            service=chat_service,
            name='ResumeEvaluateAgent',
            instructions=(
                """
                # ROLE
                You are a senior HR. Your job is to evaluate a consultant purchase request's fitness based on their resume and skills.
                
                # TOOLS TO USE
                You will use the provided resume number to retrieve the consultant's basic information, resume details,
                and work experiences from the resume_data_agent, and then evaluate the consultant's skills based on
                the provided skill model name using skill_evaluation_agent.
                You will also retrieve purchase requirement data using the purchase_requirement_data_agent.
                
                # IMPORTANT INSTRUCTIONS
                1. Use the 'Skill' field in purchase requirement data to determine the skill model name.
                2. The K-Levels are something like K1, K2, K3 etc. You will use the skill model name to retrieve the skill levels from the skill_evaluation_agent.
                3. The skill range is from the 'Range' field in the skill_evaluation_agent's response. It's like '3≤K2<5(CNY754~1217)'. The skill range should be used to evaluate the consultant's skills against the purchase requirement.
                4. The evaluated skill rating is the cost for this resume (Should be in the range of k-level's range) per day.
                5. Evaluate the consultant's skills based on the experience and work history provided in the resume.

                # OUTPUT INSTRUCTIONS
                You will return a structured response containing the consultant's resume and evaluated skill levels.
                Mark sure you provide the following key information in your response:
                - `consultant_resume`: A structured object containing the consultant's basic information, resume details
                and work experiences.
                - `evaluated_level_for_consultant`: A structured object containing the evaluated skill levels (k-levels)
                and their corresponding man-day cost(aka rating).

                """
                
            ),
            plugins=[skill_data_agent, resume_data_agent, purchase_requirement_data_agent],
            arguments=KernelArguments(
                settings=OpenAIChatPromptExecutionSettings(
                    response_format=ResponseFormat
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
            thread=self.threads[session_id],
        )
        logger.info(f"Resume Evaluation Agent response: {response.content}")
        return response.content

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
            thread=self.threads[session_id],
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
        structured_response = ResponseFormat.model_validate_json(
            message.content
        )

        default_response = {
            'is_task_complete': False,
            'require_user_input': True,
            'content': 'We are unable to process your request at the moment. Please try again.',
        }

        if isinstance(structured_response, ResponseFormat):
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
            response_json_str = json.dumps(structured_response.model_dump_json(), ensure_ascii=False, indent=2)
            if response:
                
                response_dict = {**response, 'content': response_json_str}
                logger.info(f"Structured response: {response_dict}")
                return response_dict
            else:
                logger.error(f"Unexpected status in structured response: {structured_response.status}")
                default_response_dict = {**default_response, 'content': response_json_str}
                return default_response_dict

    async def _ensure_thread_exists(self, session_id: str) -> None:
        """Ensure the thread exists for the given session ID.

        Args:
            session_id (str): Unique identifier for the session.
        """
        if self.threads is None or session_id not in self.threads:
            await self.threads[session_id].delete() if session_id in self.threads else None
            self.threads[session_id] = ChatHistoryAgentThread(thread_id=session_id)


# endregion
