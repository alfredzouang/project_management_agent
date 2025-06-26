from datetime import date
import os
import logging
import a2a
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, List

from dotenv import load_dotenv
from regex import D

from backend.src.agents import purchase_requirement_evaluate_agent
from model.project_types import Project
from model.purchase_requirements_types import (
    PurchaseRequirementEvaluationResponse, ResumeEvaluationResult)
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
from semantic_kernel.functions.kernel_function_decorator import kernel_function
from semantic_kernel.agents.chat_completion.chat_completion_agent import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.connectors.ai.open_ai import (
    AzureChatCompletion,
    OpenAIChatCompletion,
    OpenAIChatPromptExecutionSettings,
)
from agents.purchase_requirement_evaluate_agent import PurchaseRequirementEvaluateAgent

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
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")
AZURE_OPENAI_API_BASE = os.getenv("AZURE_OPENAI_API_BASE", AZURE_OPENAI_ENDPOINT)


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

@app.post("/api/project/create", response_model=ProjectResponse)
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


@app.post("/api/project/start")
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

from fastapi import Query
import sqlite3

# Global DB path for all endpoints
DB_PATH = os.path.join(os.path.dirname(__file__), "../../db/purchase_consultant_db.db")

@app.get("/api/purchase-requirement-filters")
async def get_purchase_requirement_filters():
    """
    Get all unique filter values for PR Type, PR Category, Business Unit, Skill, Approval Status.
    """
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # PR Type
    cursor.execute("SELECT DISTINCT [PR Type] FROM purchase_requirement WHERE [PR Type] IS NOT NULL AND [PR Type] != ''")
    pr_types = [row[0] for row in cursor.fetchall()]

    # PR Category
    cursor.execute("SELECT DISTINCT [PR Category] FROM purchase_requirement WHERE [PR Category] IS NOT NULL AND [PR Category] != ''")
    pr_categories = [row[0] for row in cursor.fetchall()]

    # Business Unit (Requestor) (User)
    cursor.execute("SELECT DISTINCT [Business Unit (Requestor) (User)] FROM purchase_requirement WHERE [Business Unit (Requestor) (User)] IS NOT NULL AND [Business Unit (Requestor) (User)] != ''")
    business_units = [row[0] for row in cursor.fetchall()]

    # Skill
    cursor.execute("SELECT DISTINCT [Skill] FROM purchase_requirement WHERE [Skill] IS NOT NULL AND [Skill] != ''")
    skills = [row[0] for row in cursor.fetchall()]

    # Approval Status
    cursor.execute("SELECT DISTINCT [Approval Status] FROM purchase_requirement WHERE [Approval Status] IS NOT NULL AND [Approval Status] != ''")
    approval_statuses = [row[0] for row in cursor.fetchall()]

    conn.close()
    return {
        "pr_types": pr_types,
        "pr_categories": pr_categories,
        "business_units": business_units,
        "skills": skills,
        "approval_statuses": approval_statuses
    }

@app.get("/api/purchase-requirements")
async def get_purchase_requirements(
    pr_code: str = Query(None, alias="pr_code"),
    pr_type: str = Query(None, alias="pr_type"),
    pr_title: str = Query(None, alias="pr_title"),
    pr_category: str = Query(None, alias="pr_category"),
    business_unit: str = Query(None, alias="business_unit"),
    skill: str = Query(None, alias="skill"),
    approval_status: str = Query(None, alias="approval_status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """
    查询采购需求列表，支持多条件筛选和分页。
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 构建 SQL 查询
    sql = "SELECT * FROM purchase_requirement WHERE 1=1"
    params = []

    if pr_code:
        # 支持模糊搜索
        if "%" in pr_code or "_" in pr_code:
            sql += " AND [PR Code] LIKE ?"
            params.append(pr_code)
        else:
            sql += " AND [PR Code] LIKE ?"
            params.append(f"%{pr_code}%")
    if pr_type:
        sql += " AND [PR Type]=?"
        params.append(pr_type)
    if pr_title:
        sql += " AND [PR Title] LIKE ?"
        params.append(f"%{pr_title}%")
    if pr_category:
        sql += " AND [PR Category]=?"
        params.append(pr_category)
    if business_unit:
        # 字段名为 Business Unit (Requestor) (User)
        sql += " AND [Business Unit (Requestor) (User)]=?"
        params.append(business_unit)
    if skill:
        # Skill 字段为 Skill，Skill Required (must to have)，Skill Required (nice to have) 三者之一包含即可
        sql += " AND ([Skill] LIKE ? OR [Skill Required (must to have)] LIKE ? OR [Skill Required (nice to have)] LIKE ?)"
        params.extend([f"%{skill}%"] * 3)

    if approval_status:
        sql += " AND [Approval Status]=?"
        params.append(approval_status)

    # 分页
    sql += " ORDER BY [PR Code] DESC LIMIT ? OFFSET ?"
    params.extend([page_size, (page - 1) * page_size])

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    result = [dict(row) for row in rows]

    # 查询总数
    count_sql = "SELECT COUNT(*) FROM purchase_requirement WHERE 1=1"
    count_params = []
    if pr_code:
        # 支持模糊搜索
        if "%" in pr_code or "_" in pr_code:
            count_sql += " AND [PR Code] LIKE ?"
            count_params.append(pr_code)
        else:
            count_sql += " AND [PR Code] LIKE ?"
            count_params.append(f"%{pr_code}%")
    if pr_type:
        count_sql += " AND [PR Type]=?"
        count_params.append(pr_type)
    if pr_title:
        count_sql += " AND [PR Title] LIKE ?"
        count_params.append(f"%{pr_title}%")
    if pr_category:
        count_sql += " AND [PR Category]=?"
        count_params.append(pr_category)
    if business_unit:
        count_sql += " AND [Business Unit (Requestor) (User)]=?"
        count_params.append(business_unit)
    if skill:
        count_sql += " AND ([Skill] LIKE ? OR [Skill Required (must to have)] LIKE ? OR [Skill Required (nice to have)] LIKE ?)"
        count_params.extend([f"%{skill}%"] * 3)
    cursor.execute(count_sql, count_params)
    total = cursor.fetchone()[0]

    conn.close()
    return {"data": result, "total": total, "page": page, "page_size": page_size}

@app.get("/api/purchase-requirements/{pr_code}")
async def get_purchase_requirement_detail(pr_code: str):
    """
    获取单个采购需求详情（通过 PR Code 精确查找）
    """
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM purchase_requirement WHERE [PR Code]=?", (pr_code,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")
    return dict(row)

@app.get("/api/purchase-requirements/{pr_code}/resumes")
async def get_resumes_by_pr_code(pr_code: str):
    """
    Get all resumes where resume.PR = pr_code
    """
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resume WHERE [PR]=?", (pr_code,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/api/consultant/{resume_no}")
async def get_consultant_by_resume_no(resume_no: str):
    """
    Get consultant info by resume_no
    """
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultant WHERE [Resume No.]=?", (resume_no,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")
    return dict(row)

@app.get("/api/workexresume/{item_no}")
async def get_workex_by_item_no(item_no: str):
    """
    Get work experience info by item_no
    """
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workexresume WHERE [ItemNo]=?", (item_no,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

from fastapi import status
from pydantic import BaseModel


# Maintain chat history per context
chat_history_store: dict[str, ChatHistory] = {}

@app.get("/api/purchase-requirements/{pr_code}/evaluate", response_model=dict)
async def evaluate_purchase_requirement(pr_code: str):
    """
    Evaluate a purchase requirement and its resumes by acting as an a2a_client, sending the request to a running a2a_server.
    Returns: {"response": ...}
    """
    logger.info(f"Received evaluation request for PR Code: {pr_code}")

    # 1. Query PR, resumes, consultants
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # PR info
    cursor.execute("SELECT * FROM purchase_requirement WHERE [PR Code]=?", (pr_code,))
    pr_row = cursor.fetchone()
    if not pr_row:
        conn.close()
        return {"response": {"error": f"PR Code {pr_code} not found"}}
    pr_info = dict(pr_row)

    # Resumes for this PR
    cursor.execute("SELECT * FROM resume WHERE [PR]=? AND Status != 'Cancelled'", (pr_code,))
    resume_rows = cursor.fetchall()
    resumes = [dict(row) for row in resume_rows]

    # Consultant info for each resume (join on consultant.Resume No. = resume.ItemNo)
    consultant_map = {}
    for resume in resumes:
        item_no = resume.get("ItemNo")
        if item_no:
            cursor.execute("SELECT * FROM consultant WHERE [Resume No.]=?", (item_no,))
            consultant_row = cursor.fetchone()
            if consultant_row:
                consultant_map[item_no] = dict(consultant_row)
    conn.close()

    # 2. Compose user_input string for the agent
    import json
    user_input = json.dumps({
        "pr": pr_info,
        "resumes": resumes,
        "consultants": consultant_map
    }, ensure_ascii=False)

    context_id = f"pr_{pr_code}"
    

    try:
        # Get or create ChatHistory for the context
        chat_history = chat_history_store.get(context_id)
        if chat_history is None:
            chat_history = ChatHistory(
                messages=[],
            )
            chat_history_store[context_id] = chat_history
            logger.info(f"Created new ChatHistory for context ID: {context_id}")

        # Add user input to chat history
        logger.info(f"User input for evaluation: {user_input}")
        chat_history.messages.append(ChatMessageContent(role="user", content=user_input))

        purchase_requirement_evaluate_agent = PurchaseRequirementEvaluateAgent()

        # Get response from the agent
        response = await purchase_requirement_evaluate_agent.invoke(user_input=user_input, session_id=context_id)

        # Add assistant response to chat history
        import json
        chat_history.messages.append(ChatMessageContent(role="assistant", content=json.dumps(response, ensure_ascii=False)))

        logger.info(f"Purchase evaluation agent response: {response}")

        import json
        try:
            parsed = json.loads(response)
        except Exception:
            parsed = {"raw": response}

        # If parsed is a dict with resumeNo/itemNo/name/klevel/rating/comment, wrap as results
        if (
            isinstance(parsed, dict)
            and any(k in parsed for k in ["resumeNo", "itemNo", "name", "klevel", "rating", "comment"])
            and "results" not in parsed
        ):
            # Normalize pr_code to prCode
            pr_code_val = parsed.get("prCode") or parsed.get("pr_code") or pr_code
            # Remove pr_code/prCode from the result dict to avoid duplication
            result_dict = dict(parsed)
            result_dict.pop("pr_code", None)
            result_dict.pop("prCode", None)
            result_obj = {
                "prCode": pr_code_val,
                "results": [result_dict]
            }
            logger.info(f"API returning: {result_obj}")
            return result_obj
        # If already has prCode/results, return as is
        if isinstance(parsed, dict) and "results" in parsed and "prCode" in parsed:
            logger.info(f"API returning: {parsed}")
            return parsed
        # fallback: wrap as empty results
        result_obj = {
            "prCode": pr_code,
            "results": [],
            "raw": parsed
        }
        logger.info(f"API returning: {result_obj}")
        return result_obj
    except Exception as e:
        logger.error(f"a2a_client error: {e}")
        return {"response": {"error": str(e)}}

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Serve static frontend files
import pathlib
static_dir = pathlib.Path(__file__).parent / "static"
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

# SPA fallback: serve index.html for any non-API route
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    if not full_path.startswith("api/"):
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Not Found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
