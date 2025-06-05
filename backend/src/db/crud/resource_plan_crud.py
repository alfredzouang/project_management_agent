from sqlalchemy.orm import Session
from db.models.base_model import ResourcePlan

def get_resource_plan(db: Session, plan_id: int):
    return db.query(ResourcePlan).filter(ResourcePlan.id == plan_id).first()

def create_resource_plan(db: Session, resource_id: int, project_id: int, allocation: str):
    db_plan = ResourcePlan(resource_id=resource_id, project_id=project_id, allocation=allocation)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def update_resource_plan(db: Session, plan_id: int, resource_id: int, project_id: int, allocation: str):
    db_plan = db.query(ResourcePlan).filter(ResourcePlan.id == plan_id).first()
    if db_plan:
        db_plan.resource_id = resource_id
        db_plan.project_id = project_id
        db_plan.allocation = allocation
        db.commit()
        db.refresh(db_plan)
    return db_plan

def delete_resource_plan(db: Session, plan_id: int):
    db_plan = db.query(ResourcePlan).filter(ResourcePlan.id == plan_id).first()
    if db_plan:
        db.delete(db_plan)
        db.commit()
    return db_plan
