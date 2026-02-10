from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.database import get_db
from app.models import User, Job, Application, Interview
from app.auth import get_current_user
import os
import json
from datetime import datetime

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated analytics for the HR dashboard.
    Only accessible by HR users.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied"
        )

    # 1. Key Statistics
    open_jobs_count = db.query(Job).filter(Job.status == "open").count()
    
    total_applications = db.query(Application).count()
    pending_review = db.query(Application).filter(Application.status == "submitted").count()
    
    active_interviews = db.query(Interview).filter(
        Interview.status.in_(["scheduled", "in_progress"])
    ).count()
    
    offers_made = db.query(Application).filter(Application.status == "offer_extended").count()

    # 2. Application Status Distribution (for Charts)
    # Group by status and count
    status_counts = db.query(
        Application.status, func.count(Application.id)
    ).group_by(Application.status).all()
    
    # Format for frontend chart [{name: "Hired", value: 10}, ...]
    # Format for frontend chart [{name: "Hired", value: 10}, ...]
    chart_data = []
    for app_status, count in status_counts:
        status_label = "Unknown"
        if app_status:
            status_label = app_status.replace("_", " ").title()
        
        chart_data.append({"name": status_label, "value": count})

    # 3. Recent Interviews (Upcoming & Recent Past)
    # Fetch last 5 interviews
    recent_interviews_query = db.query(Interview).order_by(
        Interview.created_at.desc()
    ).limit(5).all()

    recent_interviews_data = []
    for interview in recent_interviews_query:
        # Fetch related data manually if relationships aren't eagerly loaded or to be safe
        candidate = db.query(User).filter(User.id == interview.candidate_id).first()
        application = db.query(Application).filter(Application.id == interview.application_id).first()
        job = db.query(Job).filter(Job.id == application.job_id).first() if application else None

        recent_interviews_data.append({
            "id": interview.id,
            "candidate_name": candidate.full_name if candidate else "Unknown",
            "job_title": job.title if job else "Unknown",
            "date": interview.created_at.isoformat() if interview.created_at else None,
            "status": interview.status
        })

    return {
        "stats": {
            "open_jobs": open_jobs_count,
            "total_applications": total_applications,
            "pending_review": pending_review,
            "active_interviews": active_interviews,
            "offers_made": offers_made
        },
        "chart_data": chart_data,
        "recent_interviews": recent_interviews_data
    }

@router.get("/reports")
async def get_interview_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all interview reports parsed from JSON files.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied"
        )
    
    reports = []
    
    # Go up two levels from app/routes to backend root
    # Adjust this based on actual structure: current file is backend/app/routes/analytics.py
    # so dirname x3 takes us to backend/
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    report_dir = os.path.join(backend_root, "interview_reports")
    
    if not os.path.exists(report_dir):
        # Try relative path if absolute fails or just return empty
        report_dir = "interview_reports"
        if not os.path.exists(report_dir):
            return []

    for filename in os.listdir(report_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(report_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    report_data = json.load(f)
                    
                    # Ensure all required fields exist with default values (Logic from dashboard.py)
                    report_data.setdefault('question_evaluations', [])
                    report_data.setdefault('total_questions_answered', 
                                         len(report_data.get('question_evaluations', [])))
                    report_data.setdefault('overall_score', 0)
                    report_data.setdefault('final_score', 0)
                    report_data.setdefault('candidate_profile', {})
                    report_data.setdefault('timestamp', '')
                    
                    report_data['filename'] = filename
                    
                    # Determine status based on score
                    overall_score = report_data.get('overall_score', 0)
                    if overall_score >= 7:
                        report_data['status'] = 'Selected'
                        report_data['status_color'] = 'success'
                    elif overall_score >= 6:
                        report_data['status'] = 'Conditional'
                        report_data['status_color'] = 'warning'
                    else:
                        report_data['status'] = 'Rejected'
                        report_data['status_color'] = 'error'
                    
                    # Parse timestamp for display
                    timestamp_str = report_data.get('timestamp', '')
                    if timestamp_str:
                        try:
                            # Handle different formats if needed, basic ISO check
                            if 'Z' in timestamp_str:
                                dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                            else:
                                dt = datetime.fromisoformat(timestamp_str)
                            report_data['display_date'] = dt.strftime("%Y-%m-%d %H:%M:%S")
                            report_data['display_date_short'] = dt.strftime("%b %d, %Y")
                        except:
                            report_data['display_date'] = timestamp_str
                            report_data['display_date_short'] = timestamp_str
                    
                    reports.append(report_data)
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                continue
    
    # Sort by timestamp (newest first)
    reports.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return reports
