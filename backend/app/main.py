from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.config import get_settings
from app.database import Base, engine
from app.routes import auth, jobs, applications, interviews, decisions, notifications, analytics
from app.models import (
    User, Job, Application, ResumeExtraction, 
    Interview, InterviewQuestion, InterviewAnswer,
    InterviewReport, HiringDecision, Notification, ActivityLog
)

settings = get_settings()

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="HR Recruitment System API",
    description="AI-powered automated recruitment platform",
    version="1.0.0"
)

# Static files (Resume Uploads)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "HR Recruitment API is running"}

# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to HR Recruitment System API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "jobs": "/api/jobs",
            "applications": "/api/applications",
            "interviews": "/api/interviews",
            "decisions": "/api/decisions"
        }
    }

# Include routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(interviews.router)
app.include_router(decisions.router)
app.include_router(notifications.router)
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
