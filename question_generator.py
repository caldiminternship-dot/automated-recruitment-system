"""
Adaptive Question Generator
Generates unique, contextual interview questions using a Modular Template Engine.
This creates distinct questions dynamically rather than selecting from a static list.
"""
import random
import hashlib

def generate_dynamic_question(
    question_number: int,
    job_title: str,
    required_skills: str,
    candidate_skills: list,
    previous_answer: str = "",
    previous_question: str = ""
) -> dict:
    """
    Generate unique, adaptive questions using Modular Template Construction.
    Structure: [Action] + [Context] + [Constraint/Impact]
    """
    # 1. Deterministic Seed
    # Ensures the same candidate/job combo gets consistent but unique questions
    seed_str = f"{question_number}{job_title}{candidate_skills}"
    seed_hash = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    rng = random.Random(seed_hash) # Local random instance to not affect global state
    
    # 2. Extract Context
    skill_list = [s.strip() for s in required_skills.split(",") if s.strip()]
    if not skill_list:
        skill_list = ["your core skills"]
        
    # Rotate through skills based on question number
    current_skill = skill_list[question_number % len(skill_list)]
    
    # 3. Modular Construction Engines
    
    if question_number <= 2:
        # === PHASE 1: DISCOVERY & FIT (Intro) ===
        # Mix: [Opening] + [Job Aspect] + [Goal]
        
        openings = [
            "Could you walk me through", 
            "I'd love to hear about",
            "Please describe",
            "Can you outline"
        ]
        
        subjects = [
            f"your journey towards becoming a {job_title}",
            f"the key experiences that prepared you for this {job_title} role",
            f"what specifically drew you to this opportunity in {extract_domain(job_title)}",
            "your most significant professional achievement to date"
        ]
        
        goals = [
             "and how it aligns with your career goals.",
             "and what you hope to achieve here.",
             "focusing on the skills you want to develop.",
             "highlighting the impact you've made."
        ]
        
        q_text = f"{rng.choice(openings)} {rng.choice(subjects)}, {rng.choice(goals)}"
        q_type = "communication"

    elif 3 <= question_number <= 7:
        # === PHASE 2: TECHNICAL & COMPETENCY (Deep Dive) ===
        # Mix: [Scenario] + [Skill/Tool] + [Challenge]
        
        scenarios = [
            "Imagine you are faced with",
            "Describe a real-world situation where you handled",
            "Suppose you need to implement a solution involving",
            "Walk me through your thought process when dealing with",
            "How would you approach"
        ]
        
        contexts = [
            f"a complex implementation of {current_skill}",
            f"a critical failure related to {current_skill}",
            f"scaling a system that relies heavily on {current_skill}",
            f"optimizing a legacy workflow using {current_skill}",
            f"integrating {current_skill} with other conflicting systems"
        ]
        
        challenges = [
            "under extremely tight deadlines?",
            "where performance was the number one priority?",
            "while managing conflicting stakeholder requirements?",
            "assuming resources were severely limited?",
            "to ensure long-term maintainability?"
        ]
        
        q_text = f"{rng.choice(scenarios)} {rng.choice(contexts)} {rng.choice(challenges)}"
        q_type = "technical"
        
    else:
        # === PHASE 3: ADAPTABILITY & BEHAVIOR (Soft Skills) ===
        # Mix: [Situation] + [Reaction] + [Outcome]
        
        situations = [
            "Tell me about a time when",
            "Describe a specific instance where",
            "Can you recall a moment when",
            "Have you ever faced a situation where"
        ]
        
        conflicts = [
            "you strongly disagreed with a manager's decision",
            "a key team member was underperforming",
            "requirements changed at the very last minute",
            "you had to deliver bad news to a stakeholder",
            "you made a mistake that impacted the timeline"
        ]
        
        resolutions = [
            "and how you resolved it constructively.",
            "and what you learned from the experience.",
            "and how you ensured the project still succeeded.",
            "specifically focusing on your communication strategy."
        ]
        
        q_text = f"{rng.choice(situations)} {rng.choice(conflicts)} {rng.choice(resolutions)}"
        q_type = "behavioral"

    return {
        "question_text": q_text,
        "question_type": q_type
    }

def extract_domain(job_title: str) -> str:
    """Extract general domain from job title or fallback to title"""
    job_lower = job_title.lower()
    
    # Generic mapping
    domains = {
        "dev": "software engineering",
        "engineer": "engineering",
        "marketer": "marketing",
        "manager": "management",
        "designer": "design",
        "sales": "sales",
        "hr": "human resources",
        "nurse": "healthcare",
        "chef": "culinary arts"
    }
    
    for key, val in domains.items():
        if key in job_lower:
            return val
            
    return job_title # Fallback to job title itself
