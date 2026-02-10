from app.database import SessionLocal
from app.models import User
from app.auth import verify_password, hash_password

def deep_check(email, test_password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} NOT FOUND")
            return
            
        print(f"User: {user.email} (ID: {user.id})")
        print(f"Password hash in DB: {user.password_hash[:50]}...")
        print(f"Testing password: '{test_password}'")
        print(f"Password length: {len(test_password)}")
        
        # Test verification
        result = verify_password(test_password, user.password_hash)
        print(f"Verification result: {result}")
        
        # Generate fresh hash for comparison
        fresh_hash = hash_password(test_password)
        print(f"Fresh hash for same password: {fresh_hash[:50]}...")
        
        # Test fresh hash
        fresh_result = verify_password(test_password, fresh_hash)
        print(f"Fresh hash verification: {fresh_result}")
        
    finally:
        db.close()

if __name__ == "__main__":
    deep_check("a@a.in", "password123")
