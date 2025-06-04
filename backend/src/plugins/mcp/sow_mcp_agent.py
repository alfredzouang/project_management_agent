from ast import List
import logging
from typing import Annotated, Any, Literal
import argparse
import anyio

from semantic_kernel.functions import kernel_function
from mailmerge import MailMerge
from pydantic import BaseModel
from typing import List, Any, ClassVar
from model.project_types import Project, ProjectTask, SOWDocument
from datetime import datetime
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import \
    AzureChatPromptExecutionSettings
from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel.functions.kernel_arguments import KernelArguments
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
import os
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


TEMPLATE_LOCATION = "/Users/zouang/code/lenovo/ProjectManagementAgents/data/sow-template-new.docx"
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")
AZURE_OPENAI_API_BASE = os.getenv("AZURE_OPENAI_API_BASE", AZURE_OPENAI_ENDPOINT)


def parse_arguments():
    parser = argparse.ArgumentParser(description="Run the Semantic Kernel MCP server.")
    parser.add_argument(
        "--transport",
        type=str,
        choices=["sse", "stdio"],
        default="stdio",
        help="Transport method to use (default: stdio).",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help="Port to use for SSE transport (required if transport is 'sse').",
    )
    return parser.parse_args()

class CreateSOWInput(BaseModel):
    project: Project
    task_list: List[ProjectTask]

class SOWPlugin:


    @kernel_function(
        description="Create SOW(Statement of Work) document based on the provided input.",
        name="SOWDocumentCreator",
    )
    async def create_sow_document(self, project_title:Annotated[str,"The title of the project"], create_sow_input: Annotated[SOWDocument, "The Input JSON object to create a SOW document"]) -> Annotated[str,"Return the message of the SOW document creation result."]:
        """Create SOW document based on the provided input."""
        print(f"Creating SOW document for input: {create_sow_input.model_dump()}")
        if not create_sow_input:
            return "Please provide a valid JSON input to create a SOW document."
        sow_document = MailMerge(TEMPLATE_LOCATION)
        sow_document.merge(**create_sow_input.model_dump())
        sow_document.merge_rows('MileStoneNumber', create_sow_input.model_dump().get('milestones'))
        sow_document.merge_rows('DeliverableNumber', create_sow_input.model_dump().get('deliverables'))
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sow_document.write(f"./output/{project_title}_sow_document_{timestamp}.docx")
        return "SOW document created successfully."
    
class SOWMCPAgent:
    """SOWMCP Agent for managing SOWs and MCPs."""

    system_prompt: ClassVar[str] = """
    # ROLE
        You are a senior project manager and you are responsible for creating SOW(Statement of Work) document for a project.
        You will be provided with a project description and you need to create SOW document for the project.

    # INSTRUCTIONS
        1. You will be provided with a project description and you need to create SOW document for the project.
        2. Output in JSON format.
    
    # INPUT FORMAT
        You will be provided with a JSON object with the following format:
        {input_format}
    
    """

    def __init__(self, kernel: Kernel):
        self.kernel = kernel
        settings = AzureChatPromptExecutionSettings()
        settings.temperature = 0.0
        settings.max_tokens = 2000
        settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
        sow_plugin = SOWPlugin()
        self.agent = ChatCompletionAgent(
            kernel=kernel,
            name = "SOWAgent",
            instructions= self.system_prompt.format(
                input_format=CreateSOWInput.model_json_schema(),
            ),
            plugins=[sow_plugin],
            arguments=KernelArguments(settings=settings)
        )
    
    async def run(self, transport: Literal["sse", "stdio"] = "stdio", port: int | None = None) -> None:
        print(f"Running SOW MCP Agent with transport: {transport}")
        if transport == "sse" and port is not None:
            import nest_asyncio
            import uvicorn
            from mcp.server.sse import SseServerTransport
            from starlette.applications import Starlette
            from starlette.routing import Mount, Route

            sse = SseServerTransport("/messages/")
            print(f"Starting SSE server on port {port}...")
            server = self.agent.as_mcp_server()
            async def handle_sse(request):
                async with sse.connect_sse(request.scope, request.receive, request._send) as (
                    read_stream,
                    write_stream,
                ):
                    await server.run(read_stream, write_stream, server.create_initialization_options())

            starlette_app = Starlette(
                debug=True,
                routes=[
                    Route("/sse", endpoint=handle_sse),
                    Mount("/messages/", app=sse.handle_post_message),
                ],
            )
            nest_asyncio.apply()
            uvicorn.run(starlette_app, host="0.0.0.0", port=port)  # nosec
        elif transport == "stdio":
            from mcp.server.stdio import stdio_server

            async def handle_stdin(stdin: Any | None = None, stdout: Any | None = None) -> None:
                async with stdio_server() as (read_stream, write_stream):
                    await server.run(read_stream, write_stream, server.create_initialization_options())

            await handle_stdin()

async def run(transport: Literal["sse", "stdio"] = "stdio", port: int | None = None) -> None:
    print(f"Running SOW MCP Agent with transport: {transport}")
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
    agent = SOWMCPAgent(
        kernel=kernel
    )
    await agent.run(transport=transport, port=port)
    

if __name__ == "__main__":
    args = parse_arguments()
    anyio.run(run, args.transport, args.port)