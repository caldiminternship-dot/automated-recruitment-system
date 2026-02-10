"""
Generate AI summaries for existing resume extractions that have raw text.

"""
import asyncio
import json
from app.database import SessionLocal
from app.models import ResumeExtraction, Application, Job
from app.services.ai_service import call_openai_direct, clean_json

async def generate_summary_for_extraction(extraction, job_required_skills):
    """Generate a professional summary from resume data"""
    try:
        # Get the data we have
        skills = json.loads(extraction.extracted_skills) if extraction.extracted_skills else []
        education = json.loads(extraction.education) if extraction.education else []
        roles = json.loads(extraction.previous_roles) if extraction.previous_roles else []
        experience = extraction.years_of_experience or 0
        
        # Create a prompt for AI summary
        prompt = f"""
        Create a professional 2-3 sentence summary for this candidate:
        
        Skills: {', '.join(skills) if skills else 'Not specified'}
        Experience: {experience} years
        Education: {', '.join(education) if education else 'Not specified'}
        Previous Roles: {', '.join(roles) if roles else 'Not specified'}
        
        Return ONLY the summary text, no JSON, no extra formatting.
        """
        
        summary = await call_openai_direct(prompt, "You are an HR professional writing candidate summaries.")
        return summary.strip()
    except Exception as e:
        print(f"  AI Error: {e}")
        # Fallback to basic summary
        parts = []
        if roles:
            parts.append(f"Experienced professional with background in {', '.join(roles[:2])}")
        if skills:
            parts.append(f"Skilled in {', '.join(skills[:5])}")
        if education:
            parts.append(f"Education: {', '.join(education[:2])}")
        
        return ". ".join(parts) + "." if parts else "Experienced professional."

async def regenerate_all_summaries():
    db = SessionLocal()
    try:
        extractions = db.query(ResumeExtraction).all()
        print(f"Found {len(extractions)} resume extractions\n")
        
        updated = 0
        for extraction in extractions:
            # Get the application and job
            application = db.query(Application).filter(Application.id == extraction.application_id).first()
            if not application:
                continue
            
            job = db.query(Job).filter(Job.id == application.job_id).first()
            if not job:
                continue
            
            print(f"Processing extraction {extraction.id} for application {application.id}...")
            
            # Force regenerate AI summary
            summary = await generate_summary_for_extraction(extraction, job.required_skills)
            extraction.extracted_text = summary
            
            print(f"  ✓ Generated: {summary[:80]}...")
            updated += 1
        
        db.commit()
        print(f"\n✅ Done! Updated {updated} summaries.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Generating AI summaries for all applications...\n")
    asyncio.run(regenerate_all_summaries())
