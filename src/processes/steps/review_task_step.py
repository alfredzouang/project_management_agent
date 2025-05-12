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
                                                      KernelProcessStepState)

from model.project_types import Project, ProjectTask

logger = logging.getLogger(__name__)


class ReviewTaskState(BaseModel):

    chat_history: ChatHistory | None = None
    task_list: List[ProjectTask] | None = None
    project: Project | None = None


class ReviewTaskResponse(BaseModel):

    need_revision: bool
    suggestion: str | None = None


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
        
        # OUTPUT FORMAT
        1. The output should be a JSON object with the following format:
        {{
            "need_revision": true/false,
            "suggestion": "revision_suggestion"    
        }}

        # IMPORTANT NOTE
        1. ** THE TASKS SHOULD BE AS ATOMIC AND GRANULAR AS POSSIBLE **, provide task split suggestion if the task is not atomic.
        2. ** PAY SPECIAL ATTENTION TO THE TASKS DEPENDENCIES **, most of the tasks should be dependent on other tasks, some tasks should be dependent on multiple tasks, and some tasks should be independent that can be done in parallel.
        3. ** EACH ATOMIC TASK SHOULD HAVE NO MORE THAN 40 HOURS OF WORK **, if the task is more than 5 days of work, please split the task into multiple tasks.
        """

    async def activate(self, state: KernelProcessStepState[ReviewTaskState]):
        self.state = state.state
        if self.state.chat_history is None:
            self.state.chat_history = ChatHistory(
                system_message=self.system_prompt)

    @kernel_function(name=Functions.REVIEW_TASK.value)
    async def review_task(self, context: KernelProcessStepContext, payload: dict, kernel: Kernel):
        logger.info("Reviewing task...")
        
        task_list = payload.get("task_list", [])
        project = payload.get("project", None)
        if not task_list or not project:
            raise ValueError("Task list and project are required.")
        self.state.task_list = task_list
        self.state.project = project
        self.state.chat_history.add_user_message(json.dumps({
            "task_list": task_list,
            "project": project
        })
        )
        # print(f"chathistory: {self.state.chat_history}")
        chat_service, settings = kernel.select_ai_service(
            type=ChatCompletionClientBase)
        assert isinstance(chat_service, ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)

        settings.response_format = ReviewTaskResponse
        settings.temperature = 0.0
        settings.max_tokens = 3000

        response = await chat_service.get_chat_message_content(chat_history=self.state.chat_history, settings=settings)

        response: ReviewTaskResponse = ReviewTaskResponse.model_validate_json(response.content)

        logger.info(f"Suggestion: {response.suggestion}")
        logger.info(f"Need revision: {response.need_revision}")
        if response.need_revision:
            await context.emit_event(process_event=self.OutputEvents.TASK_NEEDS_REVISION, data=response)
        else:
            await context.emit_event(process_event=self.OutputEvents.TASK_REVIEW_PASSED, data=payload)
