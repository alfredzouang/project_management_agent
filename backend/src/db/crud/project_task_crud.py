from sqlalchemy.orm import Session
from db.models.base_model import ProjectTask

def get_project_task(db: Session, task_id: int):
    return db.query(ProjectTask).filter(ProjectTask.id == task_id).first()

def create_project_task(db: Session, project_id: int, name: str, description: str):
    db_task = ProjectTask(project_id=project_id, name=name, description=description)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_project_task(db: Session, task_id: int, name: str, description: str):
    db_task = db.query(ProjectTask).filter(ProjectTask.id == task_id).first()
    if db_task:
        db_task.name = name
        db_task.description = description
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_project_task(db: Session, task_id: int):
    db_task = db.query(ProjectTask).filter(ProjectTask.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
    return db_task
