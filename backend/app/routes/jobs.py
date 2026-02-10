from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Job, Application
from app.schemas import JobCreate, JobUpdate, JobResponse
from app.auth import get_current_user, get_current_hr

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("/", response_model=JobResponse)
def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Create a new job posting (HR only)"""
    new_job = Job(
        title=job_data.title,
        description=job_data.description,
        required_skills=job_data.required_skills,
        experience_level=job_data.experience_level,
        hr_id=current_user.id
    )
    
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/", response_model=list[JobResponse])
def list_jobs(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all jobs (optionally filtered by status)"""
    # Base query based on user role
    if current_user.role == "hr":
        # HR sees all their jobs
        query = db.query(Job).filter(Job.hr_id == current_user.id)
    else:
        # Candidates only see open jobs
        query = db.query(Job).filter(Job.status == "open")
    
    # Apply optional status filter
    if status:
        query = query.filter(Job.status == status)
    
    jobs = query.all()
    
    # Check application status for candidates
    if current_user.role == "candidate":
        applied_job_ids = db.query(Application.job_id).filter(
            Application.candidate_id == current_user.id
        ).all()
        # applied_job_ids is a list of tuples like [(1,), (2,)]
        applied_ids = {id_tuple[0] for id_tuple in applied_job_ids}
        
        for job in jobs:
            # We can attach the attribute dynamically to the ORM instance
            # Pydantic's from_attributes will pick it up
            job.is_applied = job.id in applied_ids
            
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job details"""
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # HR can only see their own jobs (unless they want to see all)
    # Candidates can see open jobs
    if current_user.role == "hr" and job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own job postings"
        )
    
    if current_user.role == "candidate" and job.status != "open":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This job is not available"
        )
    
    return job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Update job (HR only)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check ownership
    if job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own job postings"
        )
    
    # Update fields
    if job_data.title:
        job.title = job_data.title
    if job_data.description:
        job.description = job_data.description
    if job_data.required_skills:
        job.required_skills = job_data.required_skills
    if job_data.experience_level:
        job.experience_level = job_data.experience_level
    if job_data.status:
        job.status = job_data.status
    
    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Delete/Close job (HR only)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check ownership
    if job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own job postings"
        )
    
    # Delete the job
    try:
        db.delete(job)
        db.commit()
    except Exception as e:
        print(f"Error deleting job: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job: {str(e)}"
        )
    return None
