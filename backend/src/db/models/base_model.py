import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models.project_management_models import Base

# Load .env if present (for local development)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Use DATABASE_URL from environment, default to local SQLite
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///../db/project_management.db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
