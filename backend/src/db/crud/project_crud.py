from sqlalchemy.orm import Session
from db.models.base_model import Project

def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()

def create_project(db: Session, name: str, description: str):
    db_project = Project(name=name, description=description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: int, name: str, description: str):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if db_project:
        db_project.name = name
        db_project.description = description
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if db_project:
        db.delete(db_project)
        db.commit()
    return db_project
