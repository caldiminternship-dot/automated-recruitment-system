
import sys
import os

# Add the parent directory to sys.path to resolve app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, inspect
from app.config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url)

def check_and_add_column():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns("resume_extractions")]
    
    if "experience_level" in columns:
        print("Column 'experience_level' already exists.")
    else:
        print("Column 'experience_level' does not exist. Adding...")
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE resume_extractions ADD COLUMN experience_level VARCHAR(50)"))
                conn.commit()
                print("Column 'experience_level' added successfully.")
            except Exception as e:
                print(f"Error adding column: {e}")

if __name__ == "__main__":
    check_and_add_column()
