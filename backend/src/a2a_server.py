import logging

import click
import httpx

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryPushNotifier, InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from agents.resume_evaluate_agent.agent_executor import SemanticKernelResumeAgentExecutor
from dotenv import load_dotenv

from agents.resume_evaluate_agent import resume_evaluate_agent
from rich.logging import RichHandler

logging.basicConfig(level=logging.INFO, handlers=[RichHandler()])
logger = logging.getLogger(__name__)

load_dotenv()


@click.command()
@click.option('--host', default='localhost')
@click.option('--port', default=9002)
def main(host, port):
    """Starts the Semantic Kernel Agent server using A2A."""
    httpx_client = httpx.AsyncClient()
    request_handler = DefaultRequestHandler(
        agent_executor=SemanticKernelResumeAgentExecutor(),
        task_store=InMemoryTaskStore(),
        push_notifier=InMemoryPushNotifier(httpx_client),
    )

    server = A2AStarletteApplication(
        agent_card=get_agent_card(host, port), http_handler=request_handler
    )
    import uvicorn

    uvicorn.run(server.build(), host=host, port=port)


def get_agent_card(host: str, port: int):
    """Returns the Agent Card for the Semantic Kernel Resume Evaluation Agent."""
    # Build the agent card
    capabilities = AgentCapabilities(streaming=True)
    resume_evaluate_skill = AgentSkill(
        id='resume-evaluate-skill',
        name='Semantic Kernel Resume Evaluation',
        description=(
            'Handles comprehensive resume evaluation, including skill assessment and experience validation.'
        ),
        tags=['resume', 'evaluation', 'semantic-kernel'],
        examples=[
            'Evaluate the resume of a consultant, Resume No. RN20240628000080_1.',
        ],
    )

    agent_card = AgentCard(
        name='Resume Evaluate Agent',
        description=(
            'Semantic Kernel-based resume evaluation agent providing comprehensive resume analysis services '
            'including skill assessment and experience validation.'
        ),
        url=f'http://{host}:{port}/',
        version='1.0.0',
        defaultInputModes=['text'],
        defaultOutputModes=['text'],
        capabilities=capabilities,
        skills=[resume_evaluate_skill],
    )

    return agent_card


if __name__ == '__main__':
    main()