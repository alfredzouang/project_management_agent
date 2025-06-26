import logging

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.types import (
    TaskArtifactUpdateEvent,
    TaskState,
    TaskStatus,
    TaskStatusUpdateEvent,
)
from a2a.utils import (
    new_agent_text_message,
    new_task,
    new_text_artifact,
)
from requests import session
from agents.resume_evaluate_agent.resume_evaluate_agent import ResumeEvaluateAgent
from rich.logging import RichHandler
import json
from semantic_kernel.contents.chat_message_content import ChatMessageContent
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SemanticKernelResumeAgentExecutor(AgentExecutor):
    """ "SemanticKernelResumeAgent Executor"""

    def __init__(self):
        self.agent = ResumeEvaluateAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        query = context.get_user_input()
        task = context.current_task
        session_id = context.context_id
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)
        logger.info(f"Executing task: {task.id} with query: {query}")
        try:
            response = await self.agent.invoke(query, session_id=session_id)
            if isinstance(response, str):
                message = TaskArtifactUpdateEvent(
                    contextId=session_id,
                    taskId=context.task_id,
                    artifact=new_text_artifact(
                        name='current_result',
                        text=response,
                    ),
                )
                await event_queue.enqueue_event(message)
                # await event_queue.enqueue_event(new_agent_text_message(response))
            elif isinstance(response, dict):
                message = TaskArtifactUpdateEvent(
                    contextId=session_id,
                    taskId=context.task_id,
                    artifact=new_text_artifact(
                        name='current_result',
                        text=json.dumps(response, indent=2),
                    ),
                )
                await event_queue.enqueue_event(message)
            elif isinstance(response, ChatMessageContent):
                message = TaskArtifactUpdateEvent(
                    contextId=session_id,
                    taskId=context.task_id,
                    artifact=new_text_artifact(
                        name='current_result',
                        text=response.content
                    ),
                )
                await event_queue.enqueue_event(message)
            else:
                raise ValueError(f"Unexpected response type: {type(response)}")
            status = TaskStatusUpdateEvent(
                contextId=session_id,
                taskId=context.task_id,
                status=TaskStatus(state=TaskState.completed),
                final=True
            )
            await event_queue.enqueue_event(status)
            logger.info(f"Task {task.id} completed successfully.")
            # result = await self.agent.invoke(query, session_id=context.context_id)
            # if isinstance(result, str):
            #     await event_queue.enqueue_event(new_agent_text_message(result))
            # elif isinstance(result, dict):
            #     result_text = json.dumps(result)
            #     await event_queue.enqueue_event(new_agent_text_message(result_text))
        except Exception as e:
            logger.error(f"Error occurred while executing task: {task.id}, error: {e}")
            await event_queue.enqueue_event(new_agent_text_message(f"Error: {str(e)}"))

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        raise Exception('cancel not supported')