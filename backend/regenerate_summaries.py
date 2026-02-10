"""
Script to regenerate AI summaries for existing applications.
This updates the extracted_text field with an AI-generated summary.
"""
import asyncio
from app.database import SessionLocal
from app.models import ResumeExtraction, Application, Job
from app.services.ai_service import parse_resume_with_ai

async def regenerate_summaries():
    db = SessionLocal()
    try:
        extractions = db.query(ResumeExtraction).all()
        print(f"Found {len(extractions)} resume extractions to update")
        
        for extraction in extractions:
            application = db.query(Application).filter(Application.id == extraction.application_id).first()
            if not application:
                continue
                
            job = db.query(Job).filter(Job.id == application.job_id).first()
            if not job:
                continue
            
            # Get current extracted text (raw resume)
            current_text = extraction.extracted_text or ""
            
            # Skip if already has a good summary (not just "..")
            if current_text and len(current_text) > 10 and not current_text.strip() == "..":
                print(f"Skipping extraction {extraction.id} - already has summary")
                continue
            
            print(f"Regenerating summary for application {application.id}...")
            
            # Re-parse with AI to get summary
            # Note: We don't have the original resume text, so we'll generate from what we have
            skills_text = f"Skills: {extraction.extracted_skills}"
            education_text = f"Education: {extraction.education}"
            roles_text = f"Roles: {extraction.previous_roles}"
            
            combined_text = f"{skills_text}\n{education_text}\n{roles_text}"
            
            try:
                result = await parse_resume_with_ai(combined_text, job.required_skills, job.id)
                extraction.extracted_text = result.get("summary", "Summary generation failed")
                print(f"  ✓ Updated with: {extraction.extracted_text[:50]}...")
            except Exception as e:
                print(f"  ✗ Error: {e}")
                extraction.extracted_text = "Unable to generate summary"
        
        db.commit()
        print("\nDone! Summaries regenerated.")
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(regenerate_summaries())
