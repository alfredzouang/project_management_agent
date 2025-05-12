from typing import List, Dict, Any, Optional, Union, Literal
from click import Option
from pydantic import BaseModel, Field


class Resource(BaseModel):
    """Resource model

    Args:
        BaseModel (_type_): _description_
    """
    id: str
    resource_name: str

class ProjectType(BaseModel):
    """
    Project type
    """
    id: str
    name: str

class Project(BaseModel):
    """
    Base class for all projects.
    """
    name: str
    description: str
    customer: Optional[str] = None
    estimated_start_date: Optional[str] = None
    estimated_finish_date: Optional[str] = None
    actual_start_date: Optional[str] = None
    actual_finish_date: Optional[str] = None
    estimated_effort_in_hours: Optional[float] = None
    effort_completed_in_hours: Optional[float] = None
    complete_percentage: Optional[float] = None
    estimated_total_cost: Optional[float] = None
    actual_total_cost: Optional[float] = None
    cost_consumption_percentage: Optional[float] = None
    project_type: str
    sow_expriation_date: Optional[str] = None
    kick_off_partner_completed_and_minutes_published_date: Optional[str] = None
    kick_off_internal_completed_and_minutes_published_date: Optional[str] = None
    kick_off_customer_completed_and_minutes_published_date: Optional[str] = None
    owner: Optional[str] = None
    project_manager: Optional[str] = None
    project_coordinator: Optional[str] = None
    solution_architect: Optional[str] = None

class ProjectTask(BaseModel):
    """Project Task Model

    Args:
        BaseModel (_type_): _description_
    """

    id: str
    task_name: str
    task_description: str
    project_id: str
    parent_task: Optional[str] = None
    child_tasks: Optional[List[str]] = None
    dependent_task: Optional[List[str]] = None
    estimated_effort_in_hours: Optional[float] = None
    status_reason: str
    outline_level: int
    assigned_to: Optional[str]
    required_skills: Optional[List[str]] = None

    status: Optional[Literal["Not Started",
                            "In Progress",
                            "Completed",
                            "Blocked",
                            "Delayed",
                            "On Hold",
                            "Cancelled"]] = None

class Resource(BaseModel):
    """Resource model

    Args:
        BaseModel (_type_): _description_
    """
    id: str
    resource_name: str
    resource_type: Literal['human', 'machine']
    it_code: Optional[str] = None
    day_rate: Optional[float] = None
    fiscal_year: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    grade: Optional[str] = None
    working_city: Optional[str] = None
    currency: Optional[str] = None
    skills: Optional[List[str]] = None
    quote: Optional[str] = None

class ProjectPlan(BaseModel):
    """
    Plan for a project
    """
    id: str
    project: Project
    task: ProjectTask
    planned_start_date: Optional[str] = None
    planned_finish_date: Optional[str] = None
    actual_start_date: Optional[str] = None
    actual_finish_date: Optional[str] = None
    
    