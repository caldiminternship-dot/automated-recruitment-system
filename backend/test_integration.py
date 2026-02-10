import sys
import os
import asyncio

# Add backend to path so we can import app and interview_process
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.services.ai_service import question_gen, analyzer, extract_skills
    print("✅ Successfully imported ai_service")
except Exception as e:
    print(f"❌ Failed to import ai_service: {e}")
    sys.exit(1)

async def test_integration():
    print("Testing QuestionGenerator...")
    try:
        q = question_gen.generate_initial_skill_questions("python", "mid")
        print(f"✅ Generated questions: {len(q)}")
    except Exception as e:
        print(f"❌ Question generation failed: {e}")

    print("\nTesting ResponseAnalyzer...")
    try:
        analysis = analyzer.analyze_introduction("I am a python developer with 5 years experience.")
        print(f"✅ Analysis result: {analysis}")
    except Exception as e:
        print(f"❌ Analysis failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_integration())
