from fastmcp import FastMCP
from model.project_types import ProjectTask, Resource
from rich.logging import RichHandler

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


@resource_mcp_server.tool(
        name="find_available_resources",
        description="Find available resources for a given task.",
)
def find_available_resources(task: ProjectTask) -> list[Resource]:
    """
    Find available resources for a given task.
    """
    # This is a placeholder implementation. Replace with actual logic to find resources.
    logger.info(f"Finding available resources for task: {task.name} and skills: {task.required_skills}")

    return [
        Resource(name="Resource1", type="Human", skills=task.required_skills),
        Resource(name="Resource2", type="Human", skills=task.required_skills),
        Resource(name="Resource3", type="Human", skills=task.required_skills),
        Resource(name="Resource4", type="Human", skills=task.required_skills),
    ]
@resource_mcp_server.tool(
        name="assign_resources_to_task",
        description="Assign resources to a task.",
)
def assign_resources_to_task(task: ProjectTask, resources: list[Resource]) -> str:
    """
    Assign resources to a task.
    """
    logger.info(f"Assigning resources to task: {task.task_name} with resources: {[resource.resource_name for resource in resources]}")

    return f"Resources: {[resource.resource_name for resource in resources]} assigned to task: {task.task_name}"


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Resource MCP server...")
    resource_mcp_server.run(transport="sse", host="0.0.0.0", port=9001)