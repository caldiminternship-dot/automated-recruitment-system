import asyncio
import os
from app.services.ai_service import parse_resume_with_ai
from app.config import get_settings

# Mock resume text
SAMPLE_RESUME = """
John Doe
Software Engineer

EXPERIENCE
Senior Developer at Tech Corp (2020-Present)
- Led a team of 5 developers building React applications
- Optimized backend performance using Python and Redis
- Implemented CI/CD pipelines with GitHub Actions

Junior Developer at Web Solutions (2018-2020)
- Developed responsive websites using HTML, CSS, JavaScript
- Collaborated with UX designers

EDUCATION
B.S. Computer Science, University of Technology (2018)

SKILLS
Python, JavaScript, React, SQL, Docker, AWS
"""

SAMPLE_JOB_SKILLS = "Python, React, AWS, Leadership"

async def test_generation():
    print(f"Testing AI Summary Generation...")
    print(f"Settings Groq Key present: {bool(get_settings().groq_api_key)}")
    print("-" * 50)
    
    try:
        # Call the service function
        result = await parse_resume_with_ai(SAMPLE_RESUME, SAMPLE_JOB_SKILLS, 1)
        
        print("\n✅ API Call Successful!")
        print(f"Match Score: {result.get('match_percentage')}%")
        print("-" * 50)
        print("GENERATED SUMMARY:")
        print(result.get('summary'))
        print("-" * 50)
        print("FULL JSON RESULT:")
        print(result)
        
    except Exception as e:
        print(f"\n❌ Error during test: {e}")

if __name__ == "__main__":
    # Ensure we are in backend directory for .env loading if needed, 
    # though pydantic_settings handles absolute paths usually if configured or runs from CWD.
    if os.getcwd().endswith("backend"):
        asyncio.run(test_generation())
    else:
        print("Please run this script from the 'backend' directory.")
