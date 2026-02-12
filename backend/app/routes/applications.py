from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import json
from datetime import datetime
from app.database import get_db
from app.models import User, Application, Job, ResumeExtraction
from app.schemas import ApplicationCreate, ApplicationStatusUpdate, ApplicationResponse, ApplicationDetailResponse
from app.auth import get_current_user, get_current_candidate, get_current_hr
from app.services.ai_service import parse_resume_with_ai

router = APIRouter(prefix="/api/applications", tags=["applications"])

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/apply", response_model=ApplicationResponse)
async def apply_for_job(
    job_id: int,
    resume_file: UploadFile = File(...),
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """Apply for a job with resume (Candidate only)"""
    # Check if job exists and is open
    job = db.query(Job).filter(Job.id == job_id, Job.status == "open").first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or not open"
        )
    
    # Check if already applied
    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_id == current_user.id
    ).first()
    
    if existing_app:
        # If the previous application was rejected, allow re-application by deleting the old one
        if existing_app.status == "rejected":
            # Start fresh - delete the old application tree (cascades should handle relations)
            db.delete(existing_app)
            db.commit()
            # Loop continues to create new app
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied for this job"
            )
    
    MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB
    ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
    
    # Validate file content type
    if resume_file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF and DOCX allowed."
        )
        
    # Validate file size (Need to read chunk to be safe, but spooled file has .size or we check after reading)
    # Since UploadFile is spooled, we can check size if headers provided, or read content.
    content = await resume_file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )
            
    # Save resume file
    file_extension = resume_file.filename.split(".")[-1]
    filename = f"{current_user.id}_{job_id}_{datetime.utcnow().timestamp()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename).replace("\\", "/")
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create application
    new_application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        resume_file_path=file_path,
        resume_file_name=resume_file.filename,
        status="submitted"
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    # Parse resume with AI (async in background would be better)
    try:
        # Read resume file
        # Parse resume text based on file type
        try:
            resume_text = ""
            file_ext = file_path.lower().split('.')[-1]
            
            if file_ext == 'pdf':
                try:
                    from pypdf import PdfReader
                    reader = PdfReader(file_path)
                    for page in reader.pages:
                        resume_text += page.extract_text() + "\n"
                except Exception as e:
                    print(f"PDF Error: {e}")
                    # Fallback to binary decode if PDF read fails (unlikely to work but last resort)
                    with open(file_path, "rb") as f:
                        resume_text = f.read().decode('utf-8', errors='ignore')
                        
            elif file_ext in ['docx', 'doc']:
                try:
                    import docx
                    doc = docx.Document(file_path)
                    for para in doc.paragraphs:
                        resume_text += para.text + "\n"
                except Exception as e:
                    print(f"DOCX Error: {e}")
                    with open(file_path, "rb") as f:
                        resume_text = f.read().decode('utf-8', errors='ignore')
                        
            else:
                # Text file
                with open(file_path, "rb") as f:
                    resume_text = f.read().decode('utf-8', errors='ignore')
                    
            if not resume_text.strip():
                resume_text = "No readable text found in resume."
                
        except Exception as e:
            print(f"Text Extraction Error: {e}")
            resume_text = "Error extracting text."
        
        # Parse with AI
        extraction_data = await parse_resume_with_ai(
            resume_text,
            job.required_skills,
            job.id
        )
        
        # Store extraction
        resume_extraction = ResumeExtraction(
            application_id=new_application.id,
            extracted_text=extraction_data.get("summary", resume_text[:200]),  # Store AI summary
            extracted_skills=json.dumps(extraction_data.get("skills") or []),
            years_of_experience=extraction_data.get("experience"),
            education=json.dumps(extraction_data.get("education") or []),
            previous_roles=json.dumps(extraction_data.get("roles") or []),
            experience_level=extraction_data.get("experience_level"),
            resume_score=extraction_data.get("score", 0),
            skill_match_percentage=extraction_data.get("match_percentage", 0)
        )
        db.add(resume_extraction)
        
        # --- Validation Logic ---
        rejection_reasons = []
        
        # 0. Check if it's a resume
        if extraction_data.get("is_resume") is False:
             rejection_reasons.append("uploaded document is not a resume")
        
        # 1. Check for parsing failure
        # Heuristic: If skills are empty or extracted text indicates failure
        if not extraction_data.get("skills") and extraction_data.get("experience") == 0:
             rejection_reasons.append("resume parsing failed")
             
        # 2. Check for experience level mismatch
        # Normalize levels for comparison
        job_level = job.experience_level.lower().strip() if job.experience_level else ""
        candidate_level = str(extraction_data.get("experience_level", "")).lower().strip()
        
        # Define hierarchy
        levels = {
            "intern": 0,
            "junior": 1,
            "mid": 2, "mid-level": 2,
            "senior": 3,
            "lead": 4, "manager": 4, "lead / manager": 4
        }
        
        job_level_rank = levels.get(job_level, -1)
        candidate_level_rank = levels.get(candidate_level, -1)
        
        # If both levels are recognized, check if candidate is lower than required
        if job_level_rank != -1 and candidate_level_rank != -1:
            if candidate_level_rank < job_level_rank:
                 rejection_reasons.append("experience level mismatch")
        
        # If rejected, update status
        if rejection_reasons:
            new_application.status = "rejected"
            new_application.hr_notes = f"Auto-rejected based on: {', '.join(rejection_reasons)}"
            
        db.commit()

        # Send notification to HR (only if not rejected? Or always? User didn't specify, but usually HR wants to know)
        # If rejected, maybe we don't notify or notify as auto-rejected. Let's notify as usual for now or maybe skip to avoid noise.
        # User goal is to reject. Let's send notification but maybe indicate rejection?
        # For now, keeping existing notification logic but maybe updating message if rejected.
        
        from app.models import Notification
        try:
            notification_type = "new_application"
            message = f"{current_user.full_name} has applied for the {job.title} position."
            
            if new_application.status == "rejected":
                message += f" (Auto-rejected: {', '.join(rejection_reasons)})"
            
            notification = Notification(
                user_id=job.hr_id,
                notification_type=notification_type,
                title=f"New Application: {current_user.full_name}",
                message=message,
                related_application_id=new_application.id
            )
            db.add(notification)
            db.commit()
        except Exception as e:
            print(f"Error creating notification: {e}")

    except Exception as e:
        print(f"Error parsing resume: {e}")
        # Application is still created, just resume parsing failed
    
    return new_application

@router.get("/my-applications", response_model=list[ApplicationDetailResponse])
def get_my_applications(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """Get candidate's own applications"""
    applications = db.query(Application).filter(
        Application.candidate_id == current_user.id
    ).all()
    return applications

@router.get("", response_model=list[ApplicationDetailResponse])
def get_hr_applications(
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Get all applications for HR's jobs (HR only)"""
    applications = db.query(Application).join(Job).filter(
        Job.hr_id == current_user.id
    ).all()
    return applications

@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get application details"""
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Candidates can see only their own applications
    if current_user.role == "candidate" and application.candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own applications"
        )
    
    # HR can see applications for their jobs
    if current_user.role == "hr" and application.job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view applications for your jobs"
        )
    
    return application

@router.put("/{application_id}/status", response_model=ApplicationDetailResponse)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Update application status (HR only)"""
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if HR owns the job
    if application.job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update applications for your jobs"
        )
    
    # Validate status
    valid_statuses = ["approved_for_interview", "rejected"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    application.status = status_update.status
    if status_update.hr_notes:
        application.hr_notes = status_update.hr_notes
    
    db.commit()
    db.refresh(application)
    return application
