"""
Simple script to fix empty summaries in existing applications.
"""
from app.database import SessionLocal
from app.models import ResumeExtraction
import json

def fix_empty_summaries():
    db = SessionLocal()
    try:
        extractions = db.query(ResumeExtraction).all()
        print(f"Found {len(extractions)} resume extractions")
        
        updated = 0
        for extraction in extractions:
            current_text = extraction.extracted_text or ""
            
            # Check if summary is empty or just ".."
            if not current_text.strip() or current_text.strip() in ["..", ".", ""]:
                # Generate a basic summary from available data
                try:
                    skills = json.loads(extraction.extracted_skills) if extraction.extracted_skills else []
                    education = json.loads(extraction.education) if extraction.education else []
                    roles = json.loads(extraction.previous_roles) if extraction.previous_roles else []
                    
                    summary_parts = []
                    if roles:
                        summary_parts.append(f"Experienced in {', '.join(roles[:2])}")
                    if skills:
                        summary_parts.append(f"with skills in {', '.join(skills[:5])}")
                    if education:
                        summary_parts.append(f"holding {', '.join(education[:2])}")
                    
                    if summary_parts:
                        extraction.extracted_text = ". ".join(summary_parts) + "."
                    else:
                        extraction.extracted_text = "Candidate profile available for review."
                    
                    print(f"✓ Updated extraction {extraction.id}")
                    updated += 1
                except Exception as e:
                    print(f"✗ Error updating extraction {extraction.id}: {e}")
                    extraction.extracted_text = "Candidate profile available for review."
                    updated += 1
        
        db.commit()
        print(f"\nDone! Updated {updated} summaries.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_empty_summaries()
