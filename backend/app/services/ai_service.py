from openai import AsyncOpenAI
import json
import asyncio
from functools import partial
from app.config import get_settings

# Import from the refactored interview_process package
# Accessing config via the package modules which now use relative imports
try:
    from backend.interview_process.question_generator import QuestionGenerator
    from backend.interview_process.response_analyzer import ResponseAnalyzer
    from backend.interview_process.utils import extract_skills
    from backend.interview_process.config import MODEL_NAME
except ImportError:
    # Fallback for when running directly within backend directory
    from interview_process.question_generator import QuestionGenerator
    from interview_process.response_analyzer import ResponseAnalyzer
    from interview_process.utils import extract_skills
    from interview_process.config import MODEL_NAME

settings = get_settings()

# Initialize modular AI services
question_gen = QuestionGenerator()
analyzer = ResponseAnalyzer()

# Helper to run sync methods in async loop
async def run_sync(func, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(func, *args, **kwargs))

# Helper: Direct OpenAI/Groq Call (Async) for local functions
async def call_openai_direct(prompt: str, system_instr: str) -> str:
    # Try Groq first (faster and cheaper), then fall back to OpenAI
    api_key = None
    base_url = None
    
    if settings.groq_keys:
        api_key = settings.groq_keys[0]
        base_url = "https://api.groq.com/openai/v1"
        model = "llama-3.3-70b-versatile"  # Groq's best model
    elif settings.openai_keys:
        api_key = settings.openai_keys[0]
        base_url = None  # Use default OpenAI base URL
        model = "gpt-4o"
    else:
        raise Exception("No API key found. Please set GROQ_API_KEY or OPENAI_API_KEY in .env file.")
        
    client = AsyncOpenAI(api_key=api_key, base_url=base_url)
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_instr},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"API Call Error: {e}")
        raise e

import re

def clean_json(text: str) -> str:
    """Clean markdown code blocks from JSON string and extract first JSON object"""
    # Remove markdown code blocks
    text = text.replace("```json", "").replace("```", "").strip()
    
    # Try to find JSON object with regex if it's not clean
    match = re.search(r'(\{.*\})', text, re.DOTALL)
    if match:
        return match.group(1)
        
    match_list = re.search(r'(\[.*\])', text, re.DOTALL)
    if match_list:
        return match_list.group(1)

    return text

# ============================================================================
# Business Logic Functions
# ============================================================================

def calculate_match_percentage(extracted_skills: list, required_skills_str: str) -> float:
    """Calculate match percentage between extracted and required skills"""
    if not required_skills_str:
        return 0.0
    
    # Parse required skills
    required = set()
    try:
        # Try JSON first
        if required_skills_str.strip().startswith("["):
            req_list = json.loads(required_skills_str)
            if isinstance(req_list, list):
                for s in req_list:
                    required.add(str(s).lower().strip())
    except:
        pass
        
    if not required:
        # Fallback to splitting by comma or space
        # Replace common separators with comma
        normalized = required_skills_str.replace(";", ",").replace("\n", ",")
        # If no commas, assume space separation if it looks like a list of words
        if "," not in normalized and " " in normalized:
             # Heuristic: if it's just "Java Python", split by space
             parts = normalized.split()
        else:
             parts = normalized.split(",")
             
        for p in parts:
            clean = p.strip().lower()
            if clean:
                required.add(clean)
    
    if not required:
        return 0.0
        
    extracted_norm = set(s.lower().strip() for s in extracted_skills)
    
    # Calculate overlap
    # We use a fuzzy match or simple set intersection?
    # Simple set intersection + simple aliases usually works best for strict checking
    # But let's add some basic aliasing maps if needed? For now strict lower case match.
    
    # Handle JS vs JavaScript
    aliases = {
        "js": "javascript",
        "javascript": "js",
        "golang": "go",
        "go": "golang"
    }
    
    # Expand extracted with aliases
    expanded_extracted = set(extracted_norm)
    for s in extracted_norm:
        if s in aliases:
            expanded_extracted.add(aliases[s])
            
    matches = 0
    for req in required:
        if req in expanded_extracted:
            matches += 1
        else:
            # check for substring match if req is long? No, usually bad idea.
            pass
            
    return (matches / len(required)) * 100

async def parse_resume_with_ai(resume_text: str, required_skills: str, job_id: int) -> dict:
    """
    Parse resume using direct OpenAI call.
    """
    prompt = f"""
    Analyze this resume and extract:
    - List of skills (technical and soft skills)
    - Years of experience (numeric)
    - Education (list of degrees/certifications)
    - Previous job roles (list of job titles)
    - A professional 2-3 sentence summary of the candidate's profile
    
    Resume: {resume_text[:3000]}
    Required skills for the job: {required_skills}
    
    Return JSON with this exact structure:
    {{
        "skills": ["skill1", "skill2"],
        "experience": 3,
        "education": ["degree1", "degree2"],
        "roles": ["role1", "role2"],
        "summary": "Professional summary here...",
        "score": 5,
        "match_percentage": 50
    }}
    """
    
    result = {
         "skills": [], 
         "experience": 0, 
         "education": [], 
         "roles": [], 
         "summary": "No summary available.",
         "score": 5, 
         "match_percentage": 0
    }
    
    try:
        # Using a consistent system instruction
        response = await call_openai_direct(prompt, "You are an HR resume analyzer. Return valid JSON only.")
        result = json.loads(clean_json(response))
    except Exception as e:
        print(f"AI Parse Error: {e}, falling back to regex.")
        # Robust Fallback
        extracted_skills = extract_skills(resume_text)
        result["skills"] = extracted_skills
        result["summary"] = resume_text[:200] + "..." if len(resume_text) > 200 else resume_text
        
    # Recalculate match percentage programmatically to be safe
    match_pct = calculate_match_percentage(result.get("skills", []), required_skills)
    result["match_percentage"] = round(match_pct, 1)
    # Adjust 1-10 score based on match
    result["score"] = round((match_pct / 10), 1)
    
    return result

async def analyze_introduction(response_text: str) -> dict:
    """Delegate to ResponseAnalyzer"""
    return await run_sync(analyzer.analyze_introduction, response_text)

async def evaluate_detailed_answer(question: str, answer: str) -> dict:
    """Delegate to ResponseAnalyzer"""
    return await run_sync(analyzer.evaluate_answer, question, answer)

async def generate_domain_questions(skill_category: str, candidate_level: str = "mid", count: int = 5) -> list:
    """Delegate to QuestionGenerator"""
    # question_gen returns a list of strings
    return await run_sync(question_gen.generate_initial_skill_questions, skill_category, candidate_level)

async def generate_initial_interview_question(resume_text: str, job_title: str, required_skills: str, candidate_name: str) -> dict:
    """
    Hybrid: Use QuestionGenerator for the text, return dict for API compatibility.
    """
    question_text = await run_sync(question_gen.generate_general_intro_question)
    return {
        "question_text": question_text,
        "question_type": "behavioral"
    }

async def generate_adaptive_interview_question(previous_answer: str, previous_question: str, interview_history: list, job_title: str, required_skills: str, candidate_skills: list, current_question_number: int) -> dict:
    """
    Delegate to QuestionGenerator for behavioral, or use domain questions for technical.
    """
    background = {"primary_skill": "general"} 
    
    # 7 questions total usually
    if current_question_number >= 2: # Technical Phase
       category = "backend" 
       if candidate_skills:
           category = candidate_skills[0] # Naive pick first skill
       elif required_skills:
            # Try to infer category from required_skills string
            pass

       # Generate a batch and pick one based on index
       questions = await run_sync(question_gen.generate_initial_skill_questions, category, "mid")
       
       # Use modulo to pick a distinct question from the batch if possible, or random
       idx = (current_question_number) % len(questions)
       q_text = questions[idx] if questions else "Describe your experience."
       
       return {"question_text": q_text, "question_type": "technical"}
    else:
       # Intro/Behavioral Phase
       q_text = await run_sync(question_gen.generate_behavioral_question_ai, background)
       return {"question_text": q_text, "question_type": "behavioral"}

# Aliases for backward compatibility
evaluate_interview_answer = evaluate_detailed_answer

async def generate_behavioral_question(job_title: str, candidate_level: str) -> str:
    """Wrapper for behavioral question generation to match legacy signature"""
    # Create a dummy background since new logic requires it
    background = {
        "primary_skill": "general", 
        "full_name": "Candidate" 
    }
    return await run_sync(question_gen.generate_behavioral_question_ai, background)


async def generate_interview_report(job_title: str, required_skills: str, all_qa_pairs: list, overall_score: float) -> dict:
    """
    Generate Hiring Report using OpenAI directly (Legacy Logic preserved).
    """
    qa = "\\n".join([f"Q: {i['question']} A: {i['answer']}" for i in all_qa_pairs])
    prompt = f"""
    Generate Hiring Report for {job_title}.
    QA: {qa}
    Score: {overall_score}
    
    Return JSON: {{ "summary": "...", "recommendation": "...", "strengths": [], "weaknesses": [], "technical_score": 5, "communication_score": 5, "problem_solving_score": 5, "detailed_feedback": "..." }}
    """
    try:
        response = await call_openai_direct(prompt, "Generate professional HR report. Return valid JSON.")
        data = json.loads(clean_json(response))
        return {
            "overall_score": overall_score,
            "technical_skills_score": float(data.get("technical_score", 5)),
             "communication_score": float(data.get("communication_score", 5)),
             "problem_solving_score": float(data.get("problem_solving_score", 5)),
             "strengths": json.dumps(data.get("strengths", [])),
             "weaknesses": json.dumps(data.get("weaknesses", [])),
             "summary": data.get("summary", ""),
             "recommendation": data.get("recommendation", "consider"),
             "detailed_feedback": data.get("detailed_feedback", "")
        }
    except Exception as e:
        print(f"Report Gen Error: {e}")
        return {
            "overall_score": overall_score,
            "technical_skills_score": 5, "communication_score": 5, "problem_solving_score": 5,
            "strengths": "[]", "weaknesses": "[]", "summary": "Report gen failed", "recommendation": "consider", "detailed_feedback": "N/A"
        }
