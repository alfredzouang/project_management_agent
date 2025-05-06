from sqlalchemy.orm import Session
from src.db.models.base_model import Resource

def get_resource(db: Session, resource_id: int):
    return db.query(Resource).filter(Resource.id == resource_id).first()

def create_resource(db: Session, name: str, type: str):
    db_resource = Resource(name=name, type=type)
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def update_resource(db: Session, resource_id: int, name: str, type: str):
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if db_resource:
        db_resource.name = name
        db_resource.type = type
        db.commit()
        db.refresh(db_resource)
    return db_resource

def delete_resource(db: Session, resource_id: int):
    db_resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if db_resource:
        db.delete(db_resource)
        db.commit()
    return db_resource
