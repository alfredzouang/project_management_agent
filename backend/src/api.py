from datetime import date
import os
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, List

from dotenv import load_dotenv
from regex import D

from model.project_types import Project

from utils.kernel_factory import create_kernel
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.contents import ChatHistory, ChatHistoryTruncationReducer
from semantic_kernel.functions.kernel_arguments import KernelArguments
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.filters import FunctionInvocationContext
from semantic_kernel.filters.filter_types import FilterTypes
from semantic_kernel.connectors.ai import FunctionChoiceBehavior
from processes.project_kick_start_process import build_process
from semantic_kernel.processes.kernel_process import (
    KernelProcessEvent, KernelProcessEventVisibility
)
from semantic_kernel.processes.kernel_process import (
    KernelProcessEvent, KernelProcessEventVisibility, KernelProcessStepState)

from semantic_kernel.processes.local_runtime.local_kernel_process import start as start_local_process
from plugins.mermaid_plugin import MermaidPlugin
from semantic_kernel.connectors.mcp import MCPSsePlugin
from processes.process_state.process_state_management import (
    dump_process_state_metadata_locally,load_process_state_metadata)
from contextlib import asynccontextmanager
from semantic_kernel.agents import AzureAIAgent
from azure.ai.agents.models import CodeInterpreterTool, FilePurpose, FileSearchTool
from azure.identity.aio import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential
from azure.ai.agents.models import (
    ResponseFormatJsonSchema,
    ResponseFormatJsonSchemaType,
)
from semantic_kernel.agents import AzureAIAgent, AzureAIAgentSettings, AzureAIAgentThread
from azure.ai.agents.models import VectorStore

@asynccontextmanager
async def lifespan(app):
    # Startup: connect plugins
    await connect_plugins()
    try:
        yield
    finally:
        # Shutdown: close MCP plugins
        try:
            await resource_plugin.close()
        except Exception as e:
            logger.warning(f"Failed to close resource_plugin: {e}")
        try:
            await sow_plugin.close()
        except Exception as e:
            logger.warning(f"Failed to close sow_plugin: {e}")
    # Optionally, add more shutdown logic here

app = FastAPI(lifespan=lifespan)

# Allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    messages: List[dict]  # Each dict: {"role": "user"|"assistant", "content": str}

class ProjectResponse(BaseModel):
    project: Project


# Load environment variables
load_dotenv(override=True)

AZURE_AI_AGENT_ENDPOINT = os.getenv("AZURE_AI_AGENT_ENDPOINT")
AZURE_AI_AGENT_KEY = os.getenv("AZURE_AI_AGENT_KEY")
AZURE_AI_AGENT_PROJECT_ENDPOINT = os.getenv("AZURE_AI_AGENT_PROJECT_ENDPOINT", AZURE_AI_AGENT_ENDPOINT)

# Set up logging
import sys
logging.basicConfig(
    format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.WARNING,  # Set root logger to WARNING to suppress most logs
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)  # Only show INFO+ logs from api.py

# Kernel and plugin initialization (singleton, for performance)
kernel = create_kernel(logger=logger)

# Connect and register plugins once at startup
mermaid_plugin = MermaidPlugin(kernel)
resource_plugin = MCPSsePlugin(
    name="ResourceServerPlugin",
    description="This plugin provides tools for managing resources in a project.",
    url="http://localhost:9001/sse"
)
sow_plugin = MCPSsePlugin(
    name="SOWServerPlugin",
    description="This plugin provides tools for creating SOW(Statement of Work) documents for a project.",
    url="http://localhost:9999/sse"
)

# Connect plugins at startup (async)
async def connect_plugins():
    await resource_plugin.connect()
    await sow_plugin.connect()
    kernel.add_plugin(mermaid_plugin, plugin_name="mermaid_plugin")
    kernel.add_plugin(resource_plugin, plugin_name="resource_plugin")
    kernel.add_plugin(sow_plugin, plugin_name="sow_plugin")

# (Startup event replaced by lifespan handler above)

from fastapi import Request

@app.post("/project/create", response_model=ProjectResponse)
async def create_project(
    messages: str = Form(...),
    file: UploadFile = File(None)
):
    import json
    import sys

    try:
        messages_list = json.loads(messages)
        # Optionally handle the uploaded file
        file_content = None
        file_text = None
        if file is not None:
            file_content = await file.read()
            # Do not read file again later! Use this variable everywhere.

            # --- Extract text from uploaded file ---
            import io
            file_ext = os.path.splitext(file.filename)[-1].lower()
            try:
                if file_ext == ".txt":
                    file_text = file_content.decode("utf-8", errors="ignore")
                elif file_ext == ".pdf":
                    import fitz  # pymupdf
                    pdf_stream = io.BytesIO(file_content)
                    doc = fitz.open(stream=pdf_stream, filetype="pdf")
                    file_text = ""
                    for page in doc:
                        file_text += page.get_text()
                elif file_ext == ".docx":
                    from docx import Document
                    doc_stream = io.BytesIO(file_content)
                    doc = Document(doc_stream)
                    file_text = "\n".join([para.text for para in doc.paragraphs])
                else:
                    file_text = "[Unsupported file type]"
            except Exception as e:
                file_text = f"[Failed to extract file text: {e}]"
        # Prepare chat history and settings
        system_prompt = (
            "You are a project assistant. The user will describe the project they want to create. "
            "Based on the chat history, return a valid Project object matching the Project schema. "
            "Only return the Project object."
        )
        project_schema = Project.model_json_schema()
        project_schema_str = str(project_schema)
        chat_history = ChatHistoryTruncationReducer(
            system_message=f"{system_prompt}\nProject schema:\n{project_schema_str}",
            target_count=10
        )
        # Append file text below the first user message (or all user messages if needed)
        file_text_appended = False
        for msg in messages_list:
            if isinstance(msg, dict) and msg.get("role") == "user":
                user_content = msg.get("content", "")
                if file_text and not file_text_appended:
                    user_content = f"{user_content}\n\n[File Content:]\n{file_text}"
                    file_text_appended = True
                chat_history.add_user_message(user_content)
            elif isinstance(msg, dict) and msg.get("role") == "assistant":
                chat_history.add_assistant_message(msg.get("content", ""))

        # Select AI service and settings
        chat_service, settings = kernel.select_ai_service(type=ChatCompletionClientBase)
        assert isinstance(settings, AzureChatPromptExecutionSettings)
        settings.response_format = Project
        settings.temperature = 0.0
        settings.max_tokens = 2000
        settings.function_choice_behavior = FunctionChoiceBehavior.Auto()
        
        # Create agent and thread
        agent = ChatCompletionAgent(
            kernel=kernel,
            name="CreateProjectAgent",
            instructions=f"{system_prompt}\nProject schema:\n{project_schema_str}",
            arguments=KernelArguments(settings=settings)
        )
        thread = ChatHistoryAgentThread(chat_history=chat_history)

        # Get response
        response = await agent.get_response(thread=thread)
        try:
            project_obj = Project.model_validate_json(response.message.content)
        except Exception as e:
            logger.error(f"Failed to parse Project: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse project data from agent response.")
        return ProjectResponse(project=project_obj)
    except Exception as e:
        logger.error(f"Error in /project/create: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/project/start")
async def start_project_documentation_process(project: Project):
    """
    Start the project documentation process and stream status updates.
    Uses a singleton kernel and pre-connected plugins for performance.
    """
    logger.info(f"Starting project documentation process for project: {project.name}")
    state_queue = asyncio.Queue()

    def state_callback_to_ui(state):
        # This can be called from sync code, so use asyncio.create_task to put into the queue
        logger.debug(f"State callback received: {state}")
        asyncio.create_task(state_queue.put(state))

    async def run_process():
        process = build_process(state_callback=state_callback_to_ui)
        async with await start_local_process(
            process=process,
            kernel=kernel,
            initial_event=KernelProcessEvent(
                id="StartProcess",
                data=project,
                visibility=KernelProcessEventVisibility.Public,
            ),
        ) as process_context:
            process_state = await process_context.get_state()
            process_state_metadata = process_state.to_process_state_metadata()
            process_timestamp = date.today().strftime("%Y%m%d%H%M%S")
            PROCESS_STATE_JSON_FILE_NAME = f"{process_timestamp}_{project.name}_state.json"
            dump_process_state_metadata_locally(process_state_metadata, PROCESS_STATE_JSON_FILE_NAME)  # The process runs and triggers state_callback as it goes

    import json
    from pydantic import BaseModel

    def to_serializable(obj):
        if isinstance(obj, BaseModel):
            return obj.model_dump()
        elif isinstance(obj, dict):
            return {k: to_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [to_serializable(i) for i in obj]
        elif isinstance(obj, tuple):
            return tuple(to_serializable(i) for i in obj)
        else:
            return obj

    async def status_stream():
        # Build the process (replace with documentation-specific process if available)
        yield "data: {\"status\": \"stream started\"}\n\n"
        process_task = asyncio.create_task(run_process())
        process_done = False
        while True:
            try:
                # Wait for a state with a timeout to periodically check if the process is done
                state = await asyncio.wait_for(state_queue.get(), timeout=0.5)
                # Try to JSON-serialize the state, handle errors gracefully
                try:
                    serializable_state = to_serializable(state)
                    # DEBUG: Log every event sent to the frontend
                    logger.info(f"[SSE] Sending event to frontend: {json.dumps(serializable_state)}")
                    yield f"data: {json.dumps(serializable_state)}\n\n"
                except Exception as ser_err:
                    logger.error(f"Failed to serialize process state: {ser_err} | State: {repr(state)}")
                    # Attempt to yield a minimal error message to the frontend
                    yield f'data: {{"status": "error", "error": "Failed to serialize process state", "details": "{str(ser_err)}"}}\n\n'
            except asyncio.TimeoutError:
                # No state received in this interval, check if process is done
                if process_task.done():
                    # Drain any remaining states
                    while not state_queue.empty():
                        state = await state_queue.get()
                        try:
                            serializable_state = to_serializable(state)
                            yield f"data: {json.dumps(serializable_state)}\n\n"
                        except Exception as ser_err:
                            logger.error(f"Failed to serialize process state: {ser_err} | State: {repr(state)}")
                            yield f'data: {{"status": "error", "error": "Failed to serialize process state", "details": "{str(ser_err)}"}}\n\n'
                    # Optionally, send a final message
                    yield 'data: {"status": "done"}\n\n'
                    break
        await process_task  # Ensure process finishes

    return StreamingResponse(status_stream(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
