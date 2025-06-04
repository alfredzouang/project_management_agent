
import asyncio
from http import client
import logging
import os
import sys
from venv import logger

from dotenv import load_dotenv
from openai import api_key
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.processes.kernel_process import (
    KernelProcessEvent, KernelProcessEventVisibility, KernelProcessStepState)
from semantic_kernel.processes.local_runtime.local_kernel_process import \
    start as start_local_process

from model.project_types import Project, ProjectTask, ProjectType, Resource
from plugins import mermaid_plugin
from processes.project_kick_start_process import (
    ProjectKickStartProcessEvents, build_process)
from processes.steps.generate_output_step import (GenerateOutputState,
                                                  GenerateOutputStep)
from plugins.mermaid_plugin import MermaidPlugin
from plugins.sow_plugin import SOWPlugin
from semantic_kernel.connectors.mcp import MCPSsePlugin
from semantic_kernel.connectors.ai.azure_ai_inference import AzureAIInferenceChatCompletion
from azure.ai.inference.aio import ChatCompletionsClient
from azure.identity.aio import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential
from semantic_kernel.filters import FunctionInvocationContext
from semantic_kernel.filters.filter_types import FilterTypes
from collections.abc import Awaitable, Callable
from rich.logging import RichHandler

load_dotenv(override=True)

# Set the logging level for  semantic_kernel.kernel to DEBUG.

logging.basicConfig(
    format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
    handlers=[RichHandler(), logging.FileHandler("kernel.log", mode='a', encoding='utf-8', delay=False)],
    filename="kernel.log",
    filemode="a"
)

# Add the handler to the logger

logging.getLogger("kernel").setLevel(logging.INFO)
logger = logging.getLogger(__name__)
# Load settings

MAX_RETRIES = 5
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")
AZURE_OPENAI_API_BASE = os.getenv("AZURE_OPENAI_API_BASE", AZURE_OPENAI_ENDPOINT)
async def retry_filter(
    context: FunctionInvocationContext,
    next: Callable[[FunctionInvocationContext], Awaitable[None]],
) -> None:
    """A filter that retries the function invocation if it fails.

    The filter uses a binary exponential backoff strategy to retry the function invocation.
    """
    for i in range(MAX_RETRIES):
        try:
            await next(context)
            return
        except Exception as e:
            logger.warning(f"Failed to execute the function: {e}")
            backoff = 2**i
            logger.info(f"Sleeping for {backoff} seconds before retrying")

async def main():

    project: Project = Project(
        name="SnakeEatEggsGameProject",
        description="This project is about creating a snake eat eggs game.",
        project_type="software_development",
        estimated_start_date = "2024-05-08",
        estimated_finish_date = "2024-07-08",
        client_name="John Doe",
        client_email="john.doe@example.com",
        client_phone="123-456-7890",
        client_address="123 Main St, Anytown, USA",
        supplier_name="Jane Smith",
        supplier_email="jane.smith@example.com",
        supplier_phone="987-654-3210",
        supplier_address="456 Elm St, Othertown, USA"
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
    # kernel.add_service(AzureAIInferenceChatCompletion(
    #     ai_model_id=AZURE_OPENAI_API_MODEL,
    #     client=ChatCompletionsClient(
    #         endpoint=f"{str(AZURE_OPENAI_API_BASE).strip('/')}/openai/deployments/{AZURE_OPENAI_API_MODEL}",
    #         credential=AzureKeyCredential(AZURE_OPENAI_API_KEY),
    #         api_version=AZURE_OPENAI_API_VERSION,
    #     ),
    #     service_id=service_id,
    # ))
    mermaid_plugin = MermaidPlugin(kernel)
    resource_plugin = MCPSsePlugin(
        name="ResourceServerPlugin",
        description="""
This plugin provides tools for managing resources in a project.
""",
        url="http://localhost:9001/sse"
    )
    await resource_plugin.connect()

    sow_plugin = MCPSsePlugin(
        name="SOWServerPlugin",
        description="""
This plugin provides tools for creating SOW(Statement of Work) documents for a project.
""",
        url="http://localhost:9999/sse"
    )
    await sow_plugin.connect()
    kernel.add_plugin(sow_plugin, plugin_name="sow_plugin")
    
    kernel.add_plugin(mermaid_plugin, plugin_name="mermaid_plugin")
    kernel.add_plugin(resource_plugin, plugin_name="resource_plugin")
    kernel.add_filter(FilterTypes.FUNCTION_INVOCATION, retry_filter)
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
    
    await resource_plugin.close()
    await sow_plugin.close()

if __name__ == "__main__":
    asyncio.run(main())
