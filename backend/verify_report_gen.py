
import sys
import os
import json
import time

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from interview_process.report_manager import ReportManager
    print("✅ Successfully imported ReportManager")
except ImportError as e:
    print(f"❌ Failed to import ReportManager: {e}")
    sys.exit(1)

def test_report_generation():
    rm = ReportManager()
    
    session_state = {
        "candidate_profile": {
            "skills": ["Python", "FastAPI"],
            "primary_skill": "backend",
            "experience": "mid",
            "intro_score": 8
        },
        "questions_asked": ["What is GIL?", "Explain Dependency Injection"],
        "question_evaluations": [
            {
                "question": "What is GIL?",
                "answer": "Global Interpreter Lock",
                "evaluation": {"overall": 9, "accuracy": 10},
                "score": 9,
                "question_number": 1,
                "question_type": "technical"
            },
            {
                "question": "Explain Dependency Injection",
                "answer": "Design pattern...",
                "evaluation": {"overall": 8, "accuracy": 8},
                "score": 8,
                "question_number": 2,
                "question_type": "technical"
            }
        ],
        "questions": ["What is GIL?", "Explain Dependency Injection"],
        "responses": [], # Optional if question_evaluations is present
        "overall_score": 8.5,
        "final_score": 8.5,
        "messages": [],
        "start_time": time.time() - 300,
        "end_time": time.time(),
        "user_id": 999
    }
    
    try:
        path = rm.save_interview_report(session_state)
        print(f"✅ Report saved to: {path}")
        
        # Verify file exists
        if os.path.exists(path):
            print("✅ File actually exists")
            
            # Read and verify JSON structure
            with open(path, 'r') as f:
                data = json.load(f)
                if data['overall_score'] == 8.5:
                    print("✅ JSON content verified")
                else:
                     print("❌ JSON content mismatch")
        else:
            print("❌ File was not created")
            
    except Exception as e:
        print(f"❌ Failed to save report: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_report_generation()
