from fastmcp import FastMCP
from model.project_types import ProjectTask, Resource
from rich.logging import RichHandler
import uuid
import requests

import logging
logging.basicConfig(
    format="[%(asctime)s - %(name)s:%(lineno)d - %(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
    handlers=[RichHandler()]
)
logging.getLogger("kernel").setLevel(logging.INFO)

logger = logging.getLogger(__name__)

resource_mcp_server = FastMCP(
    name = "ResourceMCP",
    instructions="""
This server provides tools for managing resources in a project.
It allows you to find available resources for a given task and assign them to the task.
    """,
)
D365_API_ENDPOINT = "https://api.d365.example.com/resources"

resources = [
    Resource(id="1", resource_name="Resource1", resource_type="human", skills=["game design", "requirements analysis"]),
    Resource(id="2", resource_name="Resource2", resource_type="human", skills=["documentation"]),
    Resource(id="3", resource_name="Resource3", resource_type="human", skills=["software architecture", "documentation"]),
    Resource(id="4", resource_name="Resource4", resource_type="human", skills=["UI/UX design", "game design"]),
    Resource(id="5", resource_name="Resource5", resource_type="human", skills=["devops", "software setup"]),
    Resource(id="6", resource_name="Resource6", resource_type="human", skills=["graphic design", "audio production"]),
    Resource(id="7", resource_name="Resource7", resource_type="human", skills=["game development", "programming"]),
    Resource(id="8", resource_name="Resource8", resource_type="human", skills=["UI development", "audio integration"]),
    Resource(id="9", resource_name="Resource9", resource_type="human", skills=["game testing", "quality assurance"]),
    Resource(id="10", resource_name="Resource10", resource_type="human", skills=["game deployment", "release management"]),
    Resource(id="11", resource_name="Resource11", resource_type="human", skills=["project management", "stakeholder communication"]),
    Resource(id="12", resource_name="Resource12", resource_type="human", skills=["QA", "game testing"]),
    Resource(id="13", resource_name="Resource13", resource_type="human", skills=["QA", "user testing"]),
    Resource(id="14", resource_name="Resource14", resource_type="human", skills=["game design", "UI/UX design"]),
    Resource(id="15", resource_name="Resource15", resource_type="human", skills=["deployment", "support", "maintenance"]),
]

@resource_mcp_server.tool(
        name="find_available_resources",
        description="Find available resources for a given task.",
)
def find_available_resources(task: dict) -> list[Resource]:
    """
    Find available resources for a given task.
    """
    global resources
    # This is a placeholder implementation. Replace with actual logic to find resources.
    logger.info(f"Finding available resources for task: {task}")
    return find_resource_by_skills_in_d365_mock(task.get("required_skills", []))


@resource_mcp_server.tool(
        name="assign_resources_to_task",
        description="Assign resources to a task.",
)
def assign_resources_to_task(task: dict, resources: list[Resource]) -> str:
    """
    Assign resources to a task.
    """
    task : ProjectTask = ProjectTask.model_validate(task)
    logger.info(f"Assigning resources to task: {task.task_name} with resources: {[resource.resource_name for resource in resources]}")

    return f"Resources: {[resource.resource_name for resource in resources]} assigned to task: {task.task_name}"


def find_resource_by_skills_in_d365(required_skills: list[str]) -> list[Resource]:
    """
    Find resources in D365 by their skills.
    """
    response = requests.post(
        url=D365_API_ENDPOINT + "/find_resources",
        json={"skills": required_skills}
    )
    resources = [Resource(**item) for item in response.json()]
    return resources

def find_resource_by_skills_in_d365_mock(required_skills: list[str]) -> list[Resource]:
    """
    Mock function to simulate finding resources in D365 by their skills.
    This is a placeholder for testing purposes.
    """
    logger.info(f"Mock finding resources in D365 for skills: {required_skills}")
    return [
        Resource(id=str(uuid.uuid4()), resource_name=f"MockResource-{skill}", resource_type="human", skills=[skill])
        for skill in required_skills
    ]

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Resource MCP server...")
    resource_mcp_server.run(transport="sse", host="0.0.0.0", port=9001)