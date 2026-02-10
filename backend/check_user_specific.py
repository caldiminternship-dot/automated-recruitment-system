from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

def check_and_reset(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User {email} FOUND. ID: {user.id}")
            print(f"Resetting password to 'password123'...")
            user.password_hash = hash_password("password123")
            db.commit()
            print("Password reset successful.")
        else:
            print(f"User {email} NOT FOUND in database.")
    finally:
        db.close()

if __name__ == "__main__":
    check_and_reset("a@a.in")
