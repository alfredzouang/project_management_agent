from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Project(Base):
    __tablename__ = 'project'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)

class ProjectTask(Base):
    __tablename__ = 'project_task'
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, index=True)
    name = Column(String, index=True)
    description = Column(String)

class Resource(Base):
    __tablename__ = 'project_resource'
    id = Column(String, primary_key=True, index=True)
    resource_name = Column(String, index=True)
    resource_type = Column(String, index=True)
    skills = Column(String, index=True)

class ResourcePlan(Base):
    __tablename__ = 'resource_plan'
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, index=True)
    project_id = Column(Integer, index=True)
    allocation = Column(String)

class ProjectType(Base):
    __tablename__ = 'project_type'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class Consultant(Base):
    __tablename__ = 'consultant'
    Resume_No = Column("Resume No.", String, primary_key=True)
    # Other columns are dynamically mapped

class Resume(Base):
    __tablename__ = 'resume'
    RequirementNo = Column(String, primary_key=True)
    # Other columns are dynamically mapped

class WorkexResume(Base):
    __tablename__ = 'workexresume'
    id = Column(Integer, primary_key=True, autoincrement=True)
    ItemNo = Column(String)
    Company = Column(String)
    JobTitle = Column(String)
    StartDate = Column(String)
    EndDate = Column(String)
    Description = Column(String)
