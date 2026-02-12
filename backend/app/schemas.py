from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# ============================================================================
# Auth Schemas
# ============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # 'candidate' or 'hr'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# Job Schemas
# ============================================================================

class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: str  # JSON or comma-separated
    experience_level: str  # 'junior', 'mid', 'senior'

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    experience_level: Optional[str] = None
    status: Optional[str] = None  # 'open', 'closed', 'on_hold'

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    required_skills: str
    experience_level: str
    status: str
    is_applied: bool = False
    hr_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# Application Schemas
# ============================================================================

class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationStatusUpdate(BaseModel):
    status: str  # 'approved_for_interview', 'rejected'
    hr_notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    resume_file_name: Optional[str]
    resume_file_path: Optional[str]
    status: str
    applied_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ApplicationDetailResponse(ApplicationResponse):
    candidate: UserResponse
    job: JobResponse
    resume_extraction: Optional['ResumeExtractionResponse'] = None
    interview: Optional['InterviewResponse'] = None

# ============================================================================
# Resume Schemas
# ============================================================================

class ResumeExtractionResponse(BaseModel):
    id: int
    application_id: int
    extracted_text: Optional[str]  # This contains the AI summary
    extracted_skills: Optional[str]
    years_of_experience: Optional[float]
    education: Optional[str]
    previous_roles: Optional[str]
    experience_level: Optional[str]
    resume_score: float
    skill_match_percentage: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# Interview Report Schemas
# ============================================================================

class InterviewReportResponse(BaseModel):
    id: int
    interview_id: int
    overall_score: Optional[float]
    technical_skills_score: Optional[float]
    communication_score: Optional[float]
    problem_solving_score: Optional[float]
    summary: Optional[str]
    strengths: Optional[str]
    weaknesses: Optional[str]
    recommendation: Optional[str]
    detailed_feedback: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# Interview Schemas
# ============================================================================

class InterviewStart(BaseModel):
    application_id: int

class InterviewAnswerSubmit(BaseModel):
    answer_text: str

class InterviewQuestionResponse(BaseModel):
    id: int
    interview_id: int
    question_number: int
    question_text: str
    question_type: Optional[str]
    
    class Config:
        from_attributes = True

class InterviewAnswerResponse(BaseModel):
    id: int
    question_id: int
    answer_text: str
    answer_score: Optional[float]
    answer_evaluation: Optional[str]
    skill_relevance_score: Optional[float]
    submitted_at: datetime
    
    class Config:
        from_attributes = True

class InterviewListResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    job_id: int
    job_title: str
    locked_skill: Optional[str]
    score: Optional[float]
    
    class Config:
        from_attributes = True

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    status: str
    locked_skill: Optional[str] = None
    total_questions: int
    questions_asked: int
    overall_score: Optional[float]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    report: Optional[InterviewReportResponse] = None
    
    class Config:
        from_attributes = True

class InterviewDetailResponse(InterviewResponse):
    questions: List[InterviewQuestionResponse] = []

# ============================================================================
# Hiring Decision Schemas
# ============================================================================

class HiringDecisionMake(BaseModel):
    decision: str  # 'hired' or 'rejected'
    decision_comments: Optional[str] = None

class HiringDecisionResponse(BaseModel):
    id: int
    application_id: int
    decision: str
    decision_comments: Optional[str]
    decided_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# Notification Schemas
# ============================================================================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    notification_type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Update forward references
ApplicationDetailResponse.update_forward_refs()
