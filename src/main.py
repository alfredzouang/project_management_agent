
import asyncio
import logging
import os
import sys

from dotenv import load_dotenv
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.processes.kernel_process import (
    KernelProcessEvent, KernelProcessEventVisibility, KernelProcessStepState)
from semantic_kernel.processes.local_runtime.local_kernel_process import \
    start as start_local_process

from model.project_types import Project, ProjectTask, ProjectType, Resource
from processes.project_kick_start_process import (
    ProjectKickStartProcessEvents, build_process)
from processes.steps.generate_output_step import (GenerateOutputState,
                                                  GenerateOutputStep)

load_dotenv(override=True)

# Set the logging level for  semantic_kernel.kernel to DEBUG.
logging.basicConfig(
    format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO
)
logging.getLogger("kernel").setLevel(logging.INFO)

AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")

async def main():

    project: Project = Project(
        name="SnakeEatEggsGameProject",
        description="This project is about creating a snake eat eggs game.",
        project_type="software_development",
        estimated_start_date = "2024-05-08",
        estimated_finish_date = "2024-07-08",
    )
    service_id="azure-openai"
    kernel = Kernel()
    kernel.add_service(AzureChatCompletion(
        deployment_name=AZURE_OPENAI_API_MODEL,
        api_key=AZURE_OPENAI_API_KEY,
        base_url=AZURE_OPENAI_ENDPOINT,
        endpoint=AZURE_OPENAI_ENDPOINT,
        api_version=AZURE_OPENAI_API_VERSION,
        service_id=service_id
    ))

    process = build_process()
    async with await start_local_process(
        process = process,
        kernel=kernel,
        initial_event=KernelProcessEvent(
            id=ProjectKickStartProcessEvents.StartProcess,
            data = project,
            visibility=KernelProcessEventVisibility.Public,
        ),
    ) as process_context:
        process_state = await process_context.get_state()
        output_step_state: KernelProcessStepState[GenerateOutputState] = next(
            (s.state for s in process_state.steps if s.state.name == GenerateOutputStep.GENERATE_OUTPUT), None
        )
        if output_step_state:
            logging.info(f"Output: {output_step_state.state.output}")
        else:
            logging.info("Output step state not found")

if __name__ == "__main__":
    asyncio.run(main())
