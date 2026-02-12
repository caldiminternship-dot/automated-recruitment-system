
import sys
import os

# Add the parent directory to sys.path to resolve app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, inspect
from app.config import get_settings

settings = get_settings()
print(f"Database URL: {settings.database_url}")

# Ensure absolute path for SQLite
if settings.database_url.startswith("sqlite:///./"):
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sql_app.db")
    db_url = f"sqlite:///{db_path}"
    print(f"Resolved DB URL: {db_url}")
else:
    db_url = settings.database_url

engine = create_engine(db_url)

def list_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables: {tables}")
    
    if "resume_extractions" in tables:
        columns = [c['name'] for c in inspector.get_columns("resume_extractions")]
        print(f"Columns in resume_extractions: {columns}")
    else:
        print("Table 'resume_extractions' NOT FOUND.")

if __name__ == "__main__":
    list_tables()
