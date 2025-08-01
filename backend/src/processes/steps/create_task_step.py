import json
from enum import Enum
from typing import (Callable, ClassVar, List)
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import (
    AzureChatPromptExecutionSettings)
from semantic_kernel.contents import (ChatHistory,
                                      ChatHistoryTruncationReducer)
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
# Removed duplicate import of AzureChatPromptExecutionSettings
from semantic_kernel.functions import kernel_function
from semantic_kernel.processes.kernel_process import (
    KernelProcessStep, KernelProcessStepContext, KernelProcessStepState, kernel_process_step_metadata)
from semantic_kernel.functions.kernel_arguments import KernelArguments
from semantic_kernel.connectors.ai.chat_completion_client_base import \
    ChatCompletionClientBase
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from model.project_types import (Project, ProjectTask)
from semantic_kernel.connectors.ai.azure_ai_inference import AzureAIInferenceChatCompletion
from azure.ai.inference.aio import ChatCompletionsClient
from pydantic import PrivateAttr

import logging

logger = logging.getLogger(__name__)

class CreateProjectTaskResponse(BaseModel):
    task_list: List[ProjectTask] = Field(default=None)
    project: Project = Field(default=None)

class CreateProjectTaskState(BaseModel):
    chat_history: ChatHistory | None = None
    project_infos: CreateProjectTaskResponse | None = None

@kernel_process_step_metadata("CreateProjectTaskStep.V1")
class CreateProjectTaskStep(KernelProcessStep[CreateProjectTaskState]):

    state: CreateProjectTaskState = Field(default_factory=CreateProjectTaskState)

    # Remove _state_callback and custom report_state; use mixin's _report_process_state

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

    @staticmethod
    def to_serializable(obj):
        from pydantic import BaseModel
        if isinstance(obj, BaseModel):
            return obj.model_dump(mode="json", exclude_none=True)
        elif isinstance(obj, dict):
            return {k: CreateProjectTaskStep.to_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [CreateProjectTaskStep.to_serializable(i) for i in obj]
        elif isinstance(obj, tuple):
            return tuple(CreateProjectTaskStep.to_serializable(i) for i in obj)
        else:
            return obj

    @kernel_function(name=Functions.CREATE_TASK.value)
    async def create_tasks(self, context: KernelProcessStepContext,  project: Project, kernel: Annotated[Kernel | None, "The kernel", {"include_in_function_choices": False}] = None) -> None:
        self._report_process_state("CreateProjectTaskStep.create_tasks", "start", CreateProjectTaskStep.to_serializable({"project": project}))
        logger.info(f"Creating tasks for project: {project.description}")
        self.state.project_infos.project = project
        self.state.chat_history.add_user_message(json.dumps(project.model_dump(mode="json", exclude_none=True)))

        try:
            # chat_service, settings = kernel.select_ai_service(type=AzureAIInferenceChatCompletion)
            chat_service, settings = kernel.select_ai_service(type=ChatCompletionClientBase)
            assert isinstance(chat_service, ChatCompletionClientBase)
            assert isinstance(settings, AzureChatPromptExecutionSettings)
            settings.response_format = CreateProjectTaskResponse
            settings.function_choice_behavior = FunctionChoiceBehavior.Auto(filters={"included_plugins": ["mermaid_plugin", "resource_plugin"]})
            settings.temperature = 0.0
            settings.max_tokens = 6000

            agent = ChatCompletionAgent(
                # service=chat_service,
                kernel=kernel,
                name = "CreateProjectTaskAgent",
                instructions= self.system_prompt.format(
                    input_format=Project.model_json_schema(),
                    output_format=CreateProjectTaskResponse.model_json_schema()
                ),
                arguments=KernelArguments(settings=settings)
            )
            thread = ChatHistoryAgentThread(chat_history=self.state.chat_history)

            response = await agent.get_response(thread=thread)
            self.state.chat_history.add_assistant_message(response.message.content)

            formatted_response: CreateProjectTaskResponse = CreateProjectTaskResponse.model_validate_json(response.message.content)
            task_list = formatted_response.task_list
            self.state.project_infos.task_list = task_list

            self._report_process_state("CreateProjectTaskStep.create_tasks", "tasks_created", CreateProjectTaskStep.to_serializable({"task_list": task_list}))
            await context.emit_event(
                process_event=self.OutputEvents.TASK_CREATED,
                data={
                    "task_list": formatted_response.task_list,
                    "project": formatted_response.project
                }
            )
            self._report_process_state("CreateProjectTaskStep.create_tasks", "end", CreateProjectTaskStep.to_serializable(self.state))
        except Exception as e:
            self._report_process_state("CreateProjectTaskStep.create_tasks", "error", CreateProjectTaskStep.to_serializable({"error": str(e)}))
            raise
    
    @kernel_function(name=Functions.REVISE_TASK.value)
    async def revise_tasks(self, context: KernelProcessStepContext, payload: dict, kernel: Annotated[Kernel | None, "The kernel", {"include_in_function_choices": False}] = None) -> None:
        self._report_process_state("CreateProjectTaskStep.revise_tasks", "start", CreateProjectTaskStep.to_serializable({"payload": payload}))
        logger.info("Revise task lists base on suggestions...")
        try:
            task_list = self.state.project_infos.task_list
            if not task_list:
                self._report_process_state("CreateProjectTaskStep.revise_tasks", "error", CreateProjectTaskStep.to_serializable({"error": "Task list is required."}))
                raise ValueError("Task list is required.")
            project = self.state.project_infos.project
            if not project:
                self._report_process_state("CreateProjectTaskStep.revise_tasks", "error", CreateProjectTaskStep.to_serializable({"error": "Project is required."}))
                raise ValueError("Project is required.")
            suggestion = payload.get("suggestion", None)
            if not suggestion:
                self._report_process_state("CreateProjectTaskStep.revise_tasks", "error", CreateProjectTaskStep.to_serializable({"error": "No suggestion is provided."}))
                raise ValueError("No suggestion is provided.")
            self.state.chat_history.add_user_message(
            f"""
            Here are previous generated task list and project information:
            {json.dumps(self.state.project_infos.model_dump(mode="json", exclude_none=True))}
            Revise the task list based on following suggestions:
            {suggestion}
            """
            )
            
            chat_service, settings = kernel.select_ai_service(type=ChatCompletionClientBase)
            assert isinstance(chat_service, ChatCompletionClientBase)
            assert isinstance(settings, AzureChatPromptExecutionSettings)
            settings.function_choice_behavior = FunctionChoiceBehavior.Auto(filters={"included_plugins": ["mermaid_plugin", "resource_plugin"]})
            settings.response_format = CreateProjectTaskResponse
            settings.temperature = 0.0
            settings.max_tokens = 6000

            agent = ChatCompletionAgent(
                kernel=kernel,
                name = "ReviseTaskAgent",
                instructions= self.system_prompt.format(
                    input_format=Project.model_json_schema(),
                    output_format=CreateProjectTaskResponse.model_json_schema()
                ),
                arguments=KernelArguments(settings=settings)
            )
            thread = ChatHistoryAgentThread(chat_history=self.state.chat_history)

            response = await agent.get_response(thread=thread)

            formatted_response: CreateProjectTaskResponse = CreateProjectTaskResponse.model_validate_json(response.message.content)
            self.state.chat_history.add_assistant_message(response.message.content)

            task_list = formatted_response.task_list
            self.state.project_infos.task_list = task_list

            self._report_process_state("CreateProjectTaskStep.revise_tasks", "tasks_revised", CreateProjectTaskStep.to_serializable({"task_list": task_list}))
            await context.emit_event(
                process_event=self.OutputEvents.TASK_REVISED,
                data={
                    "task_list": formatted_response.task_list,
                    "project": formatted_response.project
                }
            )
            self._report_process_state("CreateProjectTaskStep.revise_tasks", "end", CreateProjectTaskStep.to_serializable(self.state))
        except Exception as e:
            self._report_process_state("CreateProjectTaskStep.revise_tasks", "error", CreateProjectTaskStep.to_serializable({"error": str(e)}))
            raise
