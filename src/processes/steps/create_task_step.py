import json
from enum import Enum
from typing import (ClassVar, List)

from pydantic import BaseModel, Field
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.chat_completion_client_base import \
    ChatCompletionClientBase
from semantic_kernel.connectors.ai.open_ai import (
    AzureChatPromptExecutionSettings)
from semantic_kernel.contents import (ChatHistory,
                                      ChatHistoryTruncationReducer)
from semantic_kernel.functions import kernel_function
from semantic_kernel.processes.kernel_process import (
    KernelProcessStep, KernelProcessStepContext, KernelProcessStepState)

from model.project_types import (Project, ProjectTask)
import logging

logger = logging.getLogger(__name__)

class CreateProjectTaskResponse(BaseModel):
    task_list: List[ProjectTask] = None
    project: Project = None

class CreateProjectTaskState(BaseModel):
    chat_history: ChatHistory | None = None
    project_infos: CreateProjectTaskResponse | None = None

class CreateProjectTaskStep(KernelProcessStep[CreateProjectTaskState]):

    state: CreateProjectTaskState = Field(default_factory=CreateProjectTaskState)

    class Functions(Enum):
        CREATE_TASK = "CreateTask"
        REVISE_TASK = "ReviseTask"

    class OutputEvents(Enum):
        TASK_CREATED = "TaskCreated"
        TASK_REVISED = "TaskRevised"

    system_prompt: ClassVar[str] = """
    # ROLE
        You are a senior project manager and you are responsible for creating tasks for a project.

        # INSTRUCTIONS
        1. You will be provided with a project description and you need to create tasks for the project.
        2. Each task should have a name and a description.

        # INPUT FORMAT
        1. The input will be a JSON object with the following format:
        {input_format}
                    // metadata

        # OUTPUT FORMAT
        1. The tasks should be in JSON format.
        2. The JSON format should be as follows:
        {output_format}
        # IMPORTANT NOTE
        1. ** THE TASKS SHOULD BE AS ATOMIC AND GRANULAR AS POSSIBLE **.
        2. ** PAY SPECIAL ATTENTION TO THE TASKS DEPENDENCIES **, most of the tasks should be dependent on other tasks, some tasks should be dependent on multiple tasks, and some tasks should be independent that can be done in parallel.
        3. ** EACH ATOMIC TASK SHOULD HAVE NO MORE THAN 40 HOURS OF WORK **, if the task is more than 5 days of work, please split the task into multiple tasks.
    """

    async def activate(self, state: KernelProcessStepState[CreateProjectTaskState]):
        self.state = state.state
        if self.state.chat_history is None:
            project_schema = Project.model_json_schema()
            project_schema_str = json.dumps(project_schema, indent=4)
            output_schema = CreateProjectTaskResponse.model_json_schema()
            output_schema_str = json.dumps(output_schema, indent=4)
            self.state.chat_history = ChatHistoryTruncationReducer(system_message=self.system_prompt.format(input_format=project_schema_str, output_format=output_schema_str), target_count=20)
        if self.state.project_infos is None:
            self.state.project_infos = CreateProjectTaskResponse()
        self.state.chat_history

    @kernel_function(name=Functions.CREATE_TASK.value)
    async def create_tasks(self, context: KernelProcessStepContext, kernel: Kernel, project: Project) -> None:

        logger.info(f"Creating tasks for project: {project.description}")

        self.state.project_infos.project = project
        self.state.chat_history.add_user_message(json.dumps(project.model_dump()))

        chat_service, settings = kernel.select_ai_service(type=ChatCompletionClientBase)
        assert isinstance(chat_service, ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)

        settings.response_format = CreateProjectTaskResponse
        settings.temperature = 0.0
        settings.max_tokens = 6000

        response = await chat_service.get_chat_message_content(chat_history=self.state.chat_history, settings=settings)

        formatted_response: CreateProjectTaskResponse = CreateProjectTaskResponse.model_validate_json(response.content)
        task_list = formatted_response.task_list
        self.state.project_infos.task_list = task_list

        await context.emit_event(process_event=self.OutputEvents.TASK_CREATED, data=formatted_response.model_dump())
    
    @kernel_function(name=Functions.REVISE_TASK.value)
    async def revise_tasks(self, context: KernelProcessStepContext, kernel: Kernel, payload: dict) -> None:
        logger.info("Revise task lists base on suggestions...")
        task_list = self.state.project_infos.task_list
        if not task_list:
            raise ValueError("Task list is required.")
        project = self.state.project_infos.project
        if not project:
            raise ValueError("Project is required.")
        suggestion = payload.get("suggestion", None)
        if not suggestion:
            raise ValueError("No suggestion is provided.")
        self.state.chat_history.add_user_message(
        f"""
        Here are previous generated task list and project information:
        {json.dumps(self.state.project_infos.model_dump())}
        Revise the task list based on following suggestions:
        {suggestion}
        """
        )
        chat_service, settings = kernel.select_ai_service(type=ChatCompletionClientBase)
        assert isinstance(chat_service, ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)

        settings.response_format = CreateProjectTaskResponse
        settings.temperature = 0.0
        settings.max_tokens = 6000

        response = await chat_service.get_chat_message_content(chat_history=self.state.chat_history, settings=settings)

        formatted_response: CreateProjectTaskResponse = CreateProjectTaskResponse.model_validate_json(response.content)
        task_list = formatted_response.task_list
        self.state.project_infos.task_list = task_list

        await context.emit_event(process_event=self.OutputEvents.TASK_REVISED, data=formatted_response.model_dump())