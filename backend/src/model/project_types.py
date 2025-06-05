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
    project_type: Literal["IDG - Bench Time (Non-billable)",
  "Managed Services - DSS",
  "IDG - DaaS Services",
  "Managed Services - BWA",
  "IDG - Multi Stream Projects",
  "ARS",
  "Lenovo Storage DSS-G",
  "IDG - CFS Projects (ISG)",
  "IDG - ARS Projects",
  "HPC",
  "DB Migration",
  "IDG - ARS Projects (Channel)",
  "IDG - TruScale Projects (ISG)",
  "IDG - CFS Projects (Channel)",
  "Hardware-only deployment",
  "Managed Services - Hardware only",
  "IDG - ARS Projects (ISG)",
  "Lenovo Storage (other)",
  "IDG - CFS Projects",
  "ThinkSystem DM Remote",
  "IDG - System Integration",
  "IDG - CSP Projects",
  "Managed Services - Flex",
  "VDI Remote Visualization",
  "Managed Services - HPC",
  "Managed Services - HANA",
  "IDG - Custom Application Development",
  "IDG - Deploy Projects (ISG)",
  "IDG - CO2 Projects (ISG)",
  "IDG - Other (Time off)",
  "IDG - CO2 Projects",
  "ThinkSystem DM/DE",
  "IDG - Managed Services",
  "IDG - Enablement ISU Projects",
  "TruScale",
  "IDG - Agency Services",
  "IDG - Business Consulting",
  "Hardware Install",
  "IDG - SSG Presales",
  "Extended Services",
  "Healthcheck",
  "IDG - CO2 Projects (Channel)",
  "IDG - Business Process Outsourcing",
  "Flex Services",
  "IDG - Presales Activity (Non-Billable)",
  "IDG - Legacy Non SOW",
  "IDG - Application Management",
  "IDG - Workplace Solutions (ISU)",
  "IDG - Deploy Projects",
  "ThinkAgile MX",
  "IDG - Education & Training Projects",
  "IDG - Global Shared Support (GSS)",
  "Other",
  "IDG - IT Consulting",
  "ThinkAgile CP",
  "Azure Cloud Migration Workshop",
  "Data Center Services",
  "ThinkAgile SXM (Azure Stack)",
  "IDG - ITC Projects",
  "ThinkAgile VX (VSAN)",
  "ThinkAgile HX & SXN (Nutanix)",
  "IDG - ITC Projects  (ISG)",
  "IDG - DaaS Services Transition",
  "IDG - MSCT Activity",
  "IDG - Internal Lenovo Project",
  "IDG - DWS Managed Service Desk",
  "SAP-HANA",
  "vRealize Cloud Operations Management Services",
  "Network configuration services",
  "Other - Virtualization & VDI",
  "IDG - PMO Transition Projects",
  "IDG - Other (Non-Billable)",
  "IDG - WW Presales (Non-Billable)",
  "IDG - Esports Projects",
  "ThinkAgile VX Remote Deployment",
  "Tokens",
  "ThinkAgile SXM Remote Deployment",
  "IDG - Lenovo Managed Services (LMS)",
  "Other - Hybrid Cloud",
  "ThinkSystem DE Remote",
  "Presales",
  "VDI",
  "VDI Architecture Jumpstart Services"] = None
    sow_expriation_date: Optional[str] = None
    kick_off_partner_completed_and_minutes_published_date: Optional[str] = None
    kick_off_internal_completed_and_minutes_published_date: Optional[str] = None
    kick_off_customer_completed_and_minutes_published_date: Optional[str] = None
    owner: Optional[str] = None
    project_manager: Optional[str] = None
    project_coordinator: Optional[str] = None
    solution_architect: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_address: Optional[str] = None
    client_email: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_phone: Optional[str] = None
    supplier_address: Optional[str] = None
    supplier_email: Optional[str] = None


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
    assigned_to: Resource | None = None
    required_skills: Optional[List[str]] = None
    is_milestone: Optional[bool]
    deliverables: Optional[List[str]] = None
    status: Optional[Literal["Not Started",
                            "In Progress",
                            "Completed",
                            "Blocked",
                            "Delayed",
                            "On Hold",
                            "Cancelled"]] = None

class ProjectMilestone(BaseModel):
    milestone_name: str
    milestone_description: str
    milestone_date: Optional[str] = None


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
#
# Sample SOW JSON    
# sow = {
#     'ProjectTitle': '[Solar Power Plant Installation]',
#     'EffectiveDate': '[March 15, 2054]',
#     'SOWVersion': '1.0',
#     'ClientPhone': '(555) 123-4567',
#     'ClientName': 'Anna Martinez',
#     'ClientAddress': '1234 Elm Street, Los Angeles, CA 90210',
#     'ClientEmail': 'anna.martinez@docformats.com',
#     'SupplierName': '[SolarTech Solutions LLC]',
#     'SupplierPhone': '(555) 987-6543',
#     'SupplierAddress': '5678 Oak Avenue, San Francisco, CA 94101',
#     'SupplierEmail': '[solutions@solartech.com]',
#     'ScopeOfWork': '[The contractor will design, supply, and install a solar power plant with a capacity of 5MW at the specified location. This includes site assessment, procurement of panels and inverters, civil works, installation, and commissioning.]',
#     'milestones': [
#     {
#         'MileStoneNumber': '1',
#         'MileStoneName': '[Site Assessment and Feasibility Report]',
#         'MileStoneDate': '[April 1, 2054]',
#     },
#     {
#         'MileStoneNumber': '2',
#         'MileStoneName': '[Procurement of Materials]',
#         'MileStoneDate': '[May 15, 2054]',
#     },
#     {
#         'MileStoneNumber': '3',
#         'MileStoneName': '[Installation and Civil Works Completion]',
#         'MileStoneDate': '[July 30, 2054]',
#     },
#     {
#         'MileStoneNumber': '4',
#         'MileStoneName': '[Testing and Commissioning]',
#         'MileStoneDate': '[August 20, 2054]',
#     }
#     ],
#     'deliverables': [
#     {
#         'DeliverableNumber': '1',
#         'DeliverableName': '[Site Assessment Report]',
#     },
#     {
#         'DeliverableNumber': '2',
#         'DeliverableName': '[Procurement List]',
#     },
#     {
#         'DeliverableNumber': '3',
#         'DeliverableName': '[Installation Report]',
#     },
#     {
#         'DeliverableNumber': '4',
#         'DeliverableName': '[Commissioning Report]',
#     }
#     ],
#     'PaymentTerms': '[50% advance on contract signing, 30% after Milestone 3, and 20% upon successful commissioning.]',
#     'TermsAndConditions': '[All work will be completed in accordance with local regulations and standards. Any changes to the scope of work will require a written change order.]',
#     'ClientResponsibilities': '[Provide access to the site, necessary permits, and timely feedback on deliverables.]',
#     'ContractorResponsibilities': '[Ensure timely completion of the project, adhere to safety standards, and provide all necessary documentation.]',
#     'EquipmentAndMaterials': '[All materials used will be of high quality and compliant with industry standards. The contractor will provide a warranty for all equipment for a period of 5 years.]',
#     'Confidentiality': '[Both parties agree to keep all project-related information confidential and not disclose it to any third party without prior written consent.]',
#     'GoverningLawAndDisputeResolution': '[This SOW shall be governed by the laws of the State of California. Any disputes arising from this SOW will be resolved through arbitration in accordance with the rules of the American Arbitration Association.]',
#     'Termination': '[Either party may terminate this SOW with 30 days written notice. In the event of termination, the client will pay for all work completed up to the date of termination.]'
# }

class SOWMilestone(BaseModel):
    """
    Milestone for a project
    """
    MileStoneNumber: str
    MileStoneName: str
    MileStoneDate: str

class SOWDeliverable(BaseModel):
    """
    Deliverable for a project
    """
    DeliverableNumber: str
    DeliverableName: str

class SOWDocument(BaseModel):
    """
    Statement of Work (SOW) document
    """
    ProjectTitle: str
    EffectiveDate: str
    SOWVersion: str
    ClientPhone: str
    ClientName: str
    ClientAddress: str
    ClientEmail: str
    SupplierName: str
    SupplierPhone: str
    SupplierAddress: str
    SupplierEmail: str
    ScopeOfWork: str
    milestones: List[SOWMilestone]
    deliverables: List[SOWDeliverable]
    PaymentTerms: str
    TermsAndConditions: str
    ClientResponsibilities: str
    ContractorResponsibilities: str
    EquipmentAndMaterials: str
    Confidentiality: str
    GoverningLawAndDisputeResolution: str
    Termination: str
    
