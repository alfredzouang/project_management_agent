from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

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
    __tablename__ = 'resource'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)

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

DATABASE_URL = "sqlite:////Users/zouang/code/lenovo/ProjectManagementAgents/db/project_management.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
