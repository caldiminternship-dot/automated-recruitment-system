from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, index=True)  # 'candidate' or 'hr'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = relationship("Job", back_populates="hr")
    applications = relationship("Application", back_populates="candidate")
    interviews = relationship("Interview", back_populates="candidate", foreign_keys="Interview.candidate_id")
    hiring_decisions = relationship("HiringDecision", back_populates="hr")
    notifications = relationship("Notification", back_populates="user")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=False)  # JSON array or comma-separated
    experience_level = Column(String(50), nullable=False)  # 'junior', 'mid', 'senior'
    status = Column(String(50), default='open', index=True)  # 'open', 'closed', 'on_hold'
    hr_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    hr = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint('job_id', 'candidate_id', name='unique_job_candidate'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    resume_file_path = Column(String(500))
    resume_file_name = Column(String(255))
    status = Column(String(50), default='submitted', index=True)  # 'submitted', 'approved_for_interview', 'rejected', 'hired', 'rejected_post_interview'
    hr_notes = Column(Text)
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
    resume_extraction = relationship("ResumeExtraction", back_populates="application", uselist=False, cascade="all, delete-orphan")
    interview = relationship("Interview", back_populates="application", uselist=False, cascade="all, delete-orphan")
    hiring_decision = relationship("HiringDecision", back_populates="application", uselist=False, cascade="all, delete-orphan")

class ResumeExtraction(Base):
    __tablename__ = "resume_extractions"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('applications.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    extracted_text = Column(Text)
    extracted_skills = Column(Text)  # JSON array
    years_of_experience = Column(Float)
    education = Column(Text)  # JSON array
    previous_roles = Column(Text)  # JSON array
    experience_level = Column(String(50))  # 'Intern', 'Junior', 'Mid-Level', 'Senior', 'Lead'
    resume_score = Column(Float, default=0)  # Out of 10
    skill_match_percentage = Column(Float, default=0)  # Out of 100
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="resume_extraction")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('applications.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    candidate_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(50), default='not_started', index=True)  # 'not_started', 'in_progress', 'completed', 'cancelled'
    locked_skill = Column(String(50))  # e.g. 'backend', 'frontend'
    total_questions = Column(Integer, default=5)
    questions_asked = Column(Integer, default=0)
    overall_score = Column(Float)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="interview")
    candidate = relationship("User", foreign_keys=[candidate_id])
    questions = relationship("InterviewQuestion", back_populates="interview")
    report = relationship("InterviewReport", back_populates="interview", uselist=False)

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey('interviews.id', ondelete='CASCADE'), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50))  # 'behavioral', 'technical', 'follow_up'
    ai_generated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="questions")
    answers = relationship("InterviewAnswer", back_populates="question")

class InterviewAnswer(Base):
    __tablename__ = "interview_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey('interview_questions.id', ondelete='CASCADE'), nullable=False, index=True)
    answer_text = Column(Text, nullable=False)
    answer_score = Column(Float)  # 1-10
    answer_evaluation = Column(Text)  # AI evaluation
    skill_relevance_score = Column(Float)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    evaluated_at = Column(DateTime)
    
    # Relationships
    question = relationship("InterviewQuestion", back_populates="answers")

class InterviewReport(Base):
    __tablename__ = "interview_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey('interviews.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    overall_score = Column(Float)
    technical_skills_score = Column(Float)
    communication_score = Column(Float)
    problem_solving_score = Column(Float)
    summary = Column(Text)
    strengths = Column(Text)  # JSON array or text
    weaknesses = Column(Text)  # JSON array or text
    recommendation = Column(String(50))  # 'recommended', 'consider', 'not_recommended'
    detailed_feedback = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="report")

class HiringDecision(Base):
    __tablename__ = "hiring_decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey('applications.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    hr_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), index=True)
    decision = Column(String(20), nullable=False)  # 'hired', 'rejected'
    decision_comments = Column(Text)
    decided_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="hiring_decision")
    hr = relationship("User", back_populates="hiring_decisions")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    notification_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    related_application_id = Column(Integer, ForeignKey('applications.id', ondelete='SET NULL'))
    related_interview_id = Column(Integer, ForeignKey('interviews.id', ondelete='SET NULL'))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    read_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    details = Column(Text)  # JSON
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
