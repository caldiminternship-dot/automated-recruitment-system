from app.database import SessionLocal
from app.models import ResumeExtraction

def inspect_summaries():
    db = SessionLocal()
    try:
        extractions = db.query(ResumeExtraction).all()
        print(f"Found {len(extractions)} resume extractions\n")
        
        for extraction in extractions:
            text = extraction.extracted_text or ""
            print(f"ID {extraction.id}:")
            print(f"  Length: {len(text)}")
            print(f"  Content: '{text[:100]}'")
            print(f"  Repr: {repr(text[:50])}")
            print()
        
    finally:
        db.close()

if __name__ == "__main__":
    inspect_summaries()
