from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

def reset_password(email, new_password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Resetting password for {user.email}...")
            user.password_hash = hash_password(new_password)
            db.commit()
            print("Password reset successful.")
        else:
            print(f"User {email} not found.")
    finally:
        db.close()

if __name__ == "__main__":
    # Resetting the most likely test account
    reset_password("candidate@example.com", "password123")
