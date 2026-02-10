from app.database import SessionLocal
from app.models import User
from app.auth import verify_password

def check_login(email, password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} NOT FOUND in DB.")
            return

        print(f"User found: {user.email}")
        match = verify_password(password, user.password_hash)
        if match:
            print(f"SUCCESS: Password '{password}' matches hash.")
        else:
            print(f"FAILURE: Password '{password}' DOES NOT match hash.")
    finally:
        db.close()

if __name__ == "__main__":
    print("Test 1: Exact match")
    check_login("candidate@example.com", "password123")
    print("\nTest 2: Mixed case match (Candidate@example.com)")
    check_login("Candidate@example.com", "password123")
