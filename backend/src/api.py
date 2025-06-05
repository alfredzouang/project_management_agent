import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, List

from dotenv import load_dotenv

from backend.src.model.project_types import Project

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.contents import ChatHistory, ChatHistoryTruncationReducer
from semantic_kernel.functions.kernel_arguments import KernelArguments
from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.connectors.ai.open_ai import AzureChatPromptExecutionSettings
from semantic_kernel.filters import FunctionInvocationContext
from semantic_kernel.filters.filter_types import FilterTypes
from semantic_kernel.connectors.ai import FunctionChoiceBehavior

app = FastAPI()

# Allow CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    messages: List[str]

class ProjectResponse(BaseModel):
    project: Project

# Load environment variables
load_dotenv(override=True)

# Set up logging
logging.basicConfig(
    format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)

# Kernel initialization (mirroring main.py)
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_API_MODEL = os.getenv("AZURE_OPENAI_API_MODEL")
service_id = "azure-openai"

kernel = Kernel()
kernel.add_service(AzureChatCompletion(
    deployment_name=AZURE_OPENAI_API_MODEL,
    api_key=AZURE_OPENAI_API_KEY,
    base_url=AZURE_OPENAI_ENDPOINT,
    endpoint=AZURE_OPENAI_ENDPOINT,
    api_version=AZURE_OPENAI_API_VERSION,
    service_id=service_id
))

# You may add plugins here if needed, as in main.py

@app.post("/project/create", response_model=ProjectResponse)
async def create_project(request: QueryRequest):
    try:
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
        for msg in request.messages:
            chat_history.add_user_message(msg)

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
        logger.error(f"Error in /project/query: {e}")
        raise HTTPException(status_code=500, detail=str(e))
