import json
from enum import Enum
from typing import (ClassVar, List)
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import (
    AzureChatPromptExecutionSettings)
from semantic_kernel.contents import (ChatHistory,
                                      ChatHistoryTruncationReducer)
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.functions import kernel_function
from semantic_kernel.processes.kernel_process import (
    KernelProcessStep, KernelProcessStepContext, KernelProcessStepState, kernel_process_step_metadata)
from semantic_kernel.functions.kernel_arguments import KernelArguments
from semantic_kernel.connectors.ai.chat_completion_client_base import \
    ChatCompletionClientBase
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from model.project_types import (Project, ProjectTask)
import logging


logger = logging.getLogger(__name__)

class AssignResourceResponse(BaseModel):
    task_list: List[ProjectTask] = None
    project: Project = None

class AssignResourceState(BaseModel):
    chat_history: ChatHistory | None = None
    project_infos: AssignResourceResponse | None = None

@kernel_process_step_metadata("AssignResourceStep.V1")
class AssignResourceStep(KernelProcessStep[AssignResourceState]):

    state: AssignResourceState = Field(default_factory=AssignResourceState)

    class Functions(Enum):
        ASSIGN_RESOURCE = "AssignResource"

    class OutputEvents(Enum):
        RESOURCE_ASSIGNED = "ResourceAssigned"

    system_prompt: ClassVar[str] = """
    # ROLE
        You are a senior project manager and you are responsible for assign proper resources to tasks for a project.

        # INSTRUCTIONS
        1. You will be provided with a project description and tasks for the project.
        2. You need to assign resources to each task based on the project description and tasks.
        3. Each task should have one or more resources assigned to it.

        # INPUT FORMAT
        1. The input will be a JSON object with the following format:
        {input_format}

        # OUTPUT FORMAT
        1. The tasks should be in JSON format.
        2. The JSON format should be as follows:
        {output_format}
        # IMPORTANT NOTE
        1. ** EACH TASK SHOULD HAVE AT LEAST ONE RESOURCE ASSIGNED TO IT. **
        2. ** THE RESOURCES SHOULD HAVE REQUIRED SKILLS AND EXPERIENCE TO COMPLETE THE TASKS. **
    """

    async def activate(self, state: KernelProcessStepState[AssignResourceState]):
        self.state = state.state
        if self.state.chat_history is None:
            project_schema = Project.model_json_schema()
            project_schema_str = json.dumps(project_schema, indent=4)
            output_schema = AssignResourceResponse.model_json_schema()
            output_schema_str = json.dumps(output_schema, indent=4)
            self.state.chat_history = ChatHistoryTruncationReducer(system_message=self.system_prompt.format(input_format=project_schema_str, output_format=output_schema_str), target_count=20)
        if self.state.project_infos is None:
            self.state.project_infos = AssignResourceResponse()

        self.state.chat_history

    @kernel_function(name=Functions.ASSIGN_RESOURCE.value)
    async def assign_resources(self, context: KernelProcessStepContext,  payload: dict, kernel: Annotated[Kernel | None, "The kernel", {"include_in_function_choices": False}] = None) -> None:
        self._report_process_state("AssignResourceStep.assign_resources", "start", {"payload": payload})
        project: Project = Project.model_validate(payload.get("project", None))
        if not project:
            self._report_process_state("AssignResourceStep.assign_resources", "error", {"error": "Project is required."})
            raise ValueError("Project is required.")
        task_list: List[ProjectTask] = payload.get("task_list", [])
        if not task_list:
            self._report_process_state("AssignResourceStep.assign_resources", "error", {"error": "Task list is required."})
            raise ValueError("Task list is required.")
        
        logger.info(f"Assigning resources to tasks for project: {project.name}")

        self.state.project_infos.project = project
        self.state.project_infos.task_list = task_list
        self.state.chat_history.add_user_message(json.dumps(self.state.project_infos.model_dump(mode="json", exclude_none=True)))

        chat_service, settings = kernel.select_ai_service(type=ChatCompletionClientBase)
        assert isinstance(chat_service, ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)
        settings.response_format = AssignResourceResponse
        settings.function_choice_behavior = FunctionChoiceBehavior.Auto(filters={"included_plugins": ["resource_plugin"]})
        settings.temperature = 0.0
        settings.max_tokens = 6000

        agent = ChatCompletionAgent(
            kernel=kernel,
            name = "AssignResourcesAgent",
            instructions= self.system_prompt.format(
                input_format=Project.model_json_schema(),
                output_format=AssignResourceResponse.model_json_schema()
            ),
            arguments=KernelArguments(settings=settings)
        )
        thread = ChatHistoryAgentThread(chat_history=self.state.chat_history)

        response = await agent.get_response(thread=thread)
        self.state.chat_history.add_assistant_message(response.message.content)

        formatted_response: AssignResourceResponse = AssignResourceResponse.model_validate_json(response.message.content)
        task_list = formatted_response.task_list
        self.state.project_infos.task_list = task_list

        await context.emit_event(process_event=self.OutputEvents.RESOURCE_ASSIGNED, data=formatted_response.model_dump())
        self._report_process_state("AssignResourceStep.assign_resources", "end")
