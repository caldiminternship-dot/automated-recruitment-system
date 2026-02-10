from app.database import SessionLocal
from app.models import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"- ID: {user.id} | Email: {user.email} | Role: {user.role} | Active: {user.is_active}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
