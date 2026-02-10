from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, User, Job, Application, ResumeExtraction
from passlib.context import CryptContext
from datetime import datetime, timedelta
import random

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def populate_db():
    db = SessionLocal()
    try:
        print("Starting data population...")

        # 1. Create HR User
        hr_email = "hr@example.com"
        hr_user = db.query(User).filter(User.email == hr_email).first()
        if not hr_user:
            hr_user = User(
                email=hr_email,
                password_hash=get_password_hash("password123"),
                full_name="Alice HR",
                role="hr"
            )
            db.add(hr_user)
            db.commit()
            db.refresh(hr_user)
            print(f"Created HR user: {hr_user.email}")
        else:
            print(f"HR user already exists: {hr_user.email}")

        # 2. Create Jobs
        jobs_data = [
            {
                "title": "Senior Backend Developer",
                "description": "We are looking for an experienced Python developer...",
                "skills": "Python, FastAPI, SQL, AWS",
                "level": "senior"
            },
            {
                "title": "Frontend React Engineer",
                "description": "Join our frontend team to build amazing UIs...",
                "skills": "React, TypeScript, Tailwind, Next.js",
                "level": "mid"
            },
            {
                "title": "Data Scientist",
                "description": "Analyze large datasets and build ML models...",
                "skills": "Python, Pandas, Scikit-learn, TensorFlow",
                "level": "senior"
            }
        ]

        created_jobs = []
        for job_data in jobs_data:
            job = db.query(Job).filter(Job.title == job_data["title"], Job.hr_id == hr_user.id).first()
            if not job:
                job = Job(
                    title=job_data["title"],
                    description=job_data["description"],
                    required_skills=job_data["skills"],
                    experience_level=job_data["level"],
                    hr_id=hr_user.id,
                    status="open"
                )
                db.add(job)
                db.commit()
                db.refresh(job)
                print(f"Created Job: {job.title}")
            else:
                print(f"Job already exists: {job.title}")
            created_jobs.append(job)

        # 3. Create Candidates and Applications
        candidate_names = [
            "John Doe", "Jane Smith", "Bob Johnson", "Emily Davis", "Michael Wilson",
            "Sarah Brown", "David Lee", "Lisa Taylor", "James Anderson", "Karen White"
        ]

        statuses = ["submitted", "approved_for_interview", "rejected", "hired"]
        
        for i, name in enumerate(candidate_names):
            email = f"candidate{i+1}@example.com"
            candidate = db.query(User).filter(User.email == email).first()
            if not candidate:
                candidate = User(
                    email=email,
                    password_hash=get_password_hash("password123"),
                    full_name=name,
                    role="candidate"
                )
                db.add(candidate)
                db.commit()
                db.refresh(candidate)
                print(f"Created Candidate: {candidate.full_name}")

            # Apply to a random job
            job = random.choice(created_jobs)
            
            existing_app = db.query(Application).filter(
                Application.job_id == job.id,
                Application.candidate_id == candidate.id
            ).first()

            if not existing_app:
                status = random.choice(statuses)
                app = Application(
                    job_id=job.id,
                    candidate_id=candidate.id,
                    resume_file_path=f"dummy/path/{candidate.id}.pdf",
                    resume_file_name="resume.pdf",
                    status=status,
                    applied_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.add(app)
                db.commit()
                db.refresh(app)
                
                # Add dummy extraction data
                extraction = ResumeExtraction(
                    application_id=app.id,
                    extracted_text=f"Summary for {name}...",
                    skill_match_percentage=random.uniform(50, 100),
                    resume_score=random.uniform(5, 10)
                )
                db.add(extraction)
                db.commit()
                
                print(f"Created Application for {candidate.full_name} to {job.title} ({status})")

        print("Data population complete!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_db()
