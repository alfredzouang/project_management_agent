import json
import logging
from enum import Enum
from typing import ClassVar, List

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
                                                      KernelProcessStepState, kernel_process_step_metadata)
from typing import Annotated
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from model.project_types import Project, ProjectTask
from opentelemetry import trace

logger = logging.getLogger(__name__)


class ReviewTaskState(BaseModel):

    chat_history: ChatHistory | None = None
    task_list: List[ProjectTask] | None = None
    project: Project | None = None
    need_revision: bool | None = None
    suggestion: str | None = None


class ReviewTaskResponse(BaseModel):

    need_revision: bool
    suggestion: str | None = None

@kernel_process_step_metadata("ReviewTaskStep.V1")
class ReviewTaskStep(KernelProcessStep[ReviewTaskState]):

    state: ReviewTaskState = Field(default_factory=ReviewTaskState)

    class Functions(Enum):
        REVIEW_TASK = "ReviewTask"
        REVISE_TASK = "ReviseTask"
        

    class OutputEvents(Enum):
        TASK_NEEDS_REVISION = "TaskNeedsRevision"
        TASK_REVIEW_PASSED = "TaskReviewPassed"

    system_prompt: ClassVar[str] = """
    # ROLE
        You are a senior project manager and you are responsible for reviewing tasks for a project.

        # INSTRUCTIONS
        1. You will be provided with a project description and a list of tasks.
        2. You need to review the tasks and provide feedback on each task.
        3. If the task is not clear, you need to revise the task and provide a revise suggestion.
        4. The tasks should be atomic and should not be too broad.
        5. The tasks descriptions should be clear and concise.
        6. The tasks dependent tasks should be clear and concise.
        7. The estimated start and finish dates should consider the dependent tasks.
        8. Your suggestion should be detailed and explain fully why the task needs revision.
        9. Use detailed examples to explain your suggestion. 
        

        # IMPORTANT NOTE
        1. ** THE TASKS SHOULD BE AS ATOMIC AND GRANULAR AS POSSIBLE **, provide task split suggestion if the task is not atomic.
        2. ** PAY SPECIAL ATTENTION TO THE TASKS DEPENDENCIES **, most of the tasks should be dependent on other tasks, some tasks should be dependent on multiple tasks, and some tasks should be independent that can be done in parallel.
        3. ** EACH ATOMIC TASK SHOULD HAVE NO MORE THAN 40 HOURS OF WORK **, if the task is more than 5 days of work, please split the task into multiple tasks.

        # OUTPUT FORMAT
        1. The output should be a JSON object with the following format:
        {output_format}

        Make sure to follow the output format strictly, otherwise the process will fail. ONLY RETURN THE JSON OBJECT WITHOUT ANY ADDITIONAL TEXT OR EXPLANATION.
        """

    async def activate(self, state: KernelProcessStepState[ReviewTaskState]):
        self.state = state.state
        if self.state.chat_history is None:
            output_schema_str = json.dumps(ReviewTaskResponse.model_json_schema(), indent=4)
            self.state.chat_history = ChatHistory(
                system_message=self.system_prompt.format(
                    output_format=output_schema_str
                ))

    @staticmethod
    def to_serializable(obj):
        from pydantic import BaseModel
        if isinstance(obj, BaseModel):
            return obj.model_dump(mode="json", exclude_none=True)
        elif isinstance(obj, dict):
            return {k: ReviewTaskStep.to_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [ReviewTaskStep.to_serializable(i) for i in obj]
        elif isinstance(obj, tuple):
            return tuple(ReviewTaskStep.to_serializable(i) for i in obj)
        else:
            return obj

    @kernel_function(name=Functions.REVIEW_TASK.value)
    async def review_task(self, context: KernelProcessStepContext, payload: dict, kernel: Annotated[Kernel | None, "The kernel", {"include_in_function_choices": False}] = None):
        self._report_process_state("ReviewTaskStep.review_task", "start", ReviewTaskStep.to_serializable({"payload": payload}))
        logger.info("Reviewing task...")
        
        task_list = payload.get("task_list", [])
        project = payload.get("project", None)
        if not task_list or not project:
            self._report_process_state("ReviewTaskStep.review_task", "error", ReviewTaskStep.to_serializable({"error": "Task list and project are required."}))
            raise ValueError("Task list and project are required.")
        self.state.task_list = task_list
        self.state.project = project

        serializable_payload = {
            "task_list": ReviewTaskStep.to_serializable(task_list),
            "project": ReviewTaskStep.to_serializable(project)
        }
        self.state.chat_history.add_user_message(json.dumps(serializable_payload))
        chat_service, settings = kernel.select_ai_service(
            type=ChatCompletionClientBase)
        assert isinstance(chat_service, ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)

        settings.response_format = ReviewTaskResponse
        settings.temperature = 0.0
        settings.max_tokens = 3000

        settings.function_choice_behavior = FunctionChoiceBehavior.Auto(filters={"included_plugins": ["resource_plugin"]})

        thread = ChatHistoryAgentThread(chat_history=self.state.chat_history)
        logger.info("Creating agent for task review...")
        agent = ChatCompletionAgent(
            kernel=kernel,
            name="ReviewTaskAgent",
            instructions=self.system_prompt.format(
                output_format=ReviewTaskResponse.model_json_schema()
            ),
        )
        response = await agent.get_response(thread=thread)
        logger.info(f"Response: {response.message.content}")

        formatted_response: ReviewTaskResponse = ReviewTaskResponse.model_validate_json(response.message.content) 

        logger.info(f"Suggestion: {formatted_response.suggestion}")
        logger.info(f"Need revision: {formatted_response.need_revision}")
        if formatted_response.need_revision:
            self.state.need_revision = True
            self.state.suggestion = formatted_response.suggestion
            await context.emit_event(process_event=self.OutputEvents.TASK_NEEDS_REVISION, data=formatted_response.model_dump())
            self._report_process_state("ReviewTaskStep.review_task", "needs_revision", ReviewTaskStep.to_serializable({"suggestion": self.state.suggestion, "need_revision": True}))
        else:
            self.state.need_revision = False
            self.state.suggestion = None
            await context.emit_event(process_event=self.OutputEvents.TASK_REVIEW_PASSED, data=ReviewTaskStep.to_serializable(payload))
            self._report_process_state("ReviewTaskStep.review_task", "review_passed", ReviewTaskStep.to_serializable(self.state))
        self._report_process_state("ReviewTaskStep.review_task", "end", ReviewTaskStep.to_serializable(self.state))
