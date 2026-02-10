from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User, Application, HiringDecision, Notification, Job
from app.schemas import HiringDecisionMake, HiringDecisionResponse
from app.auth import get_current_user, get_current_hr

router = APIRouter(prefix="/api/decisions", tags=["hiring decisions"])

@router.put("/applications/{application_id}/decide", response_model=HiringDecisionResponse)
def make_hiring_decision(
    application_id: int,
    decision_data: HiringDecisionMake,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Make hiring decision (HR only)"""
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check HR ownership
    if application.job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only make decisions on your job applications"
        )
    
    # Strict Workflow: Check if interview is completed
    # We access the interview via relationship. If None or not completed, block decision.
    # Strict Workflow: Check if interview is completed
    # Allow decision if interview is completed OR if application is approved_for_interview (manual override)
    # This allows HR to reject candidates who didn't even start the interview.
    if application.status not in ["interview_completed", "approved_for_interview"]:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot make decision: Application must be approved for interview or interview completed."
        )
    
    # Validate decision
    if decision_data.decision not in ["hired", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be 'hired' or 'rejected'"
        )
    
    # Check if decision already exists
    existing_decision = db.query(HiringDecision).filter(
        HiringDecision.application_id == application_id
    ).first()
    
    if existing_decision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision already made for this application"
        )
    
    # Create decision
    hiring_decision = HiringDecision(
        application_id=application_id,
        hr_id=current_user.id,
        decision=decision_data.decision,
        decision_comments=decision_data.decision_comments,
        decided_at=datetime.utcnow()
    )
    
    # Update application status
    if decision_data.decision == "hired":
        application.status = "hired"
    else:
        application.status = "rejected_post_interview"
    
    db.add(hiring_decision)
    db.commit()
    db.refresh(hiring_decision)
    
    # Send notification to candidate
    try:
        notification = Notification(
            user_id=application.candidate_id,
            notification_type="hiring_decision",
            title=f"Hiring Decision for {application.job.title}",
            message=f"Your application for {application.job.title} has been reviewed. Decision: {'HIRED' if decision_data.decision == 'hired' else 'REJECTED'}",
            related_application_id=application_id
        )
        db.add(notification)
        db.commit()
    except Exception as e:
        print(f"Error creating notification: {e}")
    
    return hiring_decision

@router.get("/applications/{application_id}/decision")
def get_application_decision(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get hiring decision for application"""
    application = db.query(Application).filter(Application.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check access
    if current_user.role == "candidate" and application.candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own application decisions"
        )
    
    if current_user.role == "hr" and application.job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view decisions for your job applications"
        )
    
    decision = db.query(HiringDecision).filter(
        HiringDecision.application_id == application_id
    ).first()
    
    if not decision:
        return {"message": "Decision not yet made"}
    
    return decision

@router.get("/pipeline")
def get_hiring_pipeline(
    status_filter: str = None,
    job_id: int = None,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Get hiring pipeline for all applications (HR only)"""
    query = db.query(Application).join(Job).filter(Job.hr_id == current_user.id)
    
    if job_id:
        query = query.filter(Application.job_id == job_id)
    
    if status_filter:
        query = query.filter(Application.status == status_filter)
    
    applications = query.all()
    
    # Build detailed response with decision and interview info
    pipeline = []
    for app in applications:
        app_data = {
            "application_id": app.id,
            "candidate_name": app.candidate.full_name,
            "job_title": app.job.title,
            "status": app.status,
            "applied_at": app.applied_at,
            "interview": None,
            "decision": None
        }
        
        if app.interview:
            app_data["interview"] = {
                "id": app.interview.id,
                "status": app.interview.status,
                "score": app.interview.overall_score
            }
        
        decision = db.query(HiringDecision).filter(
            HiringDecision.application_id == app.id
        ).first()
        
        if decision:
            app_data["decision"] = {
                "decision": decision.decision,
                "decided_at": decision.decided_at
            }
        
        pipeline.append(app_data)
    
    return pipeline
