from app.database import SessionLocal
from app.models import ResumeExtraction, Application

def check_application_summary(app_id):
    db = SessionLocal()
    try:
        app = db.query(Application).filter(Application.id == app_id).first()
        if not app:
            print(f"Application {app_id} not found")
            return
        
        if not app.resume_extraction:
            print(f"No resume extraction for application {app_id}")
            return
        
        extraction = app.resume_extraction
        print(f"Application ID: {app_id}")
        print(f"Candidate: {app.candidate.full_name} ({app.candidate.email})")
        print(f"Job: {app.job.title}")
        print(f"\nSummary in DB:")
        print(f"'{extraction.extracted_text}'")
        print(f"\nLength: {len(extraction.extracted_text or '')}")
        
    finally:
        db.close()

if __name__ == "__main__":
    # Check the application from the screenshot (looks like it's for c@c.in applying to test1)
    # Let's check all to find it
    db = SessionLocal()
    apps = db.query(Application).all()
    print(f"Found {len(apps)} applications\n")
    for app in apps:
        if app.candidate.email == "c@c.in":
            print(f"Found c@c.in application: ID {app.id}")
            check_application_summary(app.id)
            break
    db.close()
