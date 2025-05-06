from sqlalchemy.orm import Session
from src.db.models.base_model import ProjectType, engine

# List of project types to insert
project_types = [
    'IDG - Bench Time (Non-billable)', 'Managed Services - DSS', 'IDG - DaaS Services', 'Managed Services - BWA',
    'IDG - Multi Stream Projects', 'ARS', None, 'Lenovo Storage DSS-G', 'IDG - CFS Projects (ISG)', 'IDG - ARS Projects',
    'HPC', 'DB Migration', 'IDG - ARS Projects (Channel)', 'IDG - TruScale Projects (ISG)', 'IDG - CFS Projects (Channel)',
    'Hardware-only deployment', 'Managed Services - Hardware only', 'IDG - ARS Projects (ISG)', 'Lenovo Storage (other)',
    'IDG - CFS Projects', 'ThinkSystem DM Remote', 'IDG - System Integration', 'IDG - CSP Projects', 'Managed Services - Flex',
    'VDI Remote Visualization', 'Managed Services - HPC', 'Managed Services - HANA', 'IDG - Custom Application Development',
    'IDG - Deploy Projects (ISG)', 'IDG - CO2 Projects (ISG)', 'IDG - Other (Time off)', 'IDG - CO2 Projects', 'ThinkSystem DM/DE',
    'IDG - Managed Services', 'IDG - Enablement ISU Projects', 'TruScale', 'IDG - Agency Services', 'IDG - Business Consulting',
    'Hardware Install', 'IDG - SSG Presales', 'Extended Services', 'Healthcheck', 'IDG - CO2 Projects (Channel)',
    'IDG - Business Process Outsourcing', 'Flex Services', 'IDG - Presales Activity (Non-Billable)', 'IDG - Legacy Non SOW',
    'IDG - Application Management', 'IDG - Workplace Solutions (ISU)', 'IDG - Deploy Projects', 'ThinkAgile MX',
    'IDG - Education & Training Projects', 'IDG - Global Shared Support (GSS)', 'Other', 'IDG - IT Consulting', 'ThinkAgile CP',
    'Azure Cloud Migration Workshop', 'Data Center Services', 'ThinkAgile SXM (Azure Stack)', 'IDG - ITC Projects',
    'ThinkAgile VX (VSAN)', 'ThinkAgile HX & SXN (Nutanix)', 'IDG - ITC Projects  (ISG)', 'IDG - DaaS Services Transition',
    'IDG - MSCT Activity', 'IDG - Internal Lenovo Project', 'IDG - DWS Managed Service Desk', 'SAP-HANA',
    'vRealize Cloud Operations Management Services', 'Network configuration services', 'Other - Virtualization & VDI',
    'IDG - PMO Transition Projects', 'IDG - Other (Non-Billable)', 'IDG - WW Presales (Non-Billable)', 'IDG - Esports Projects',
    'ThinkAgile VX Remote Deployment', 'Tokens', 'ThinkAgile SXM Remote Deployment', 'IDG - Lenovo Managed Services (LMS)',
    'Other - Hybrid Cloud', 'ThinkSystem DE Remote', 'Presales', 'VDI', 'VDI Architecture Jumpstart Services'
]

# Create a new session
session = Session(bind=engine)

# Insert project types into the database
for project_type in project_types:
    new_project_type = ProjectType(name=project_type)
    session.add(new_project_type)

# Commit the transaction
session.commit()

# Close the session
session.close()
