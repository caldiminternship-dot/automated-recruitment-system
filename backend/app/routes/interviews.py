from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import json
from app.database import get_db
from app.models import User, Interview, Application, InterviewQuestion, InterviewAnswer, InterviewReport, Job
from app.schemas import (
    InterviewStart, InterviewAnswerSubmit, InterviewResponse, 
    InterviewQuestionResponse, InterviewDetailResponse, InterviewReportResponse,
    InterviewListResponse
)
from app.auth import get_current_user, get_current_candidate, get_current_hr
from app.services.ai_service import (
    generate_initial_interview_question,
    generate_adaptive_interview_question,
    evaluate_interview_answer,
    generate_interview_report,
    analyze_introduction,
    evaluate_detailed_answer,
    generate_domain_questions,
    generate_behavioral_question
)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

@router.get("/my-interviews", response_model=list[InterviewListResponse])
def get_my_interviews(
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """Get candidate's own interviews"""
    interviews = db.query(Interview).filter(
        Interview.candidate_id == current_user.id
    ).all()
    
    results = []
    for i in interviews:
        results.append({
            "id": i.id,
            "status": i.status,
            "created_at": i.created_at,
            "job_id": i.application.job_id,
            "job_title": i.application.job.title,
            "locked_skill": i.locked_skill,
            "score": i.overall_score
        })
    return results

@router.post("/start", response_model=InterviewResponse)
async def start_interview(
    data: InterviewStart,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """Start interview (Candidate only, after application approved)"""
    # Check if application exists and is approved
    application = db.query(Application).filter(
        Application.id == data.application_id,
        Application.candidate_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    if application.status != "approved_for_interview":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Application must be approved before starting interview"
        )
    
    if not application.resume_file_path:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Resume must be uploaded"
        )
    
    # Check if interview already exists
    existing_interview = db.query(Interview).filter(
        Interview.application_id == data.application_id
    ).first()
    
    if existing_interview:
        # If interview exists and is in progress, return it (allow resume)
        if existing_interview.status == "in_progress":
            return existing_interview
        # If interview is completed, don't allow restart
        elif existing_interview.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Interview already completed for this application"
            )
    
    # Create new interview
    interview = Interview(
        application_id=data.application_id,
        candidate_id=current_user.id,
        status="in_progress",
        started_at=datetime.utcnow()
    )
    
    db.add(interview)
    db.commit()
    db.refresh(interview)
    
    # Generate first question
    # Generate ALL questions upfront (Legacy Logic Port)
    try:
        job = application.job
        resume_extraction = application.resume_extraction
        resume_text = resume_extraction.extracted_text if resume_extraction else ""
        
        # 1. Analyze Intro/Resume to Lock Skill
        analysis = await analyze_introduction(resume_text)
        locked_skill = analysis.get("primary_skill", "general")
        experience = analysis.get("experience", "mid")
        
        print(f"🔒 Locking interview to skill: {locked_skill} ({experience})")
        
        # Save locked skill
        interview.locked_skill = locked_skill
        db.add(interview)
        db.commit()
        
        # 2. Generate Technical Questions (4 Questions)
        tech_questions_list = await generate_domain_questions(
            skill_category=locked_skill,
            candidate_level=experience,
            count=4
        )
        
        # 3. Generate Behavioral Question (1 Question)
        behavioral_q = await generate_behavioral_question(
            job_title=job.title,
            candidate_level=experience
        )
        
        # 4. Save to DB
        question_objects = []
        
        # Add Technical Questions
        for i, q_text in enumerate(tech_questions_list):
            q = InterviewQuestion(
                interview_id=interview.id,
                question_number=i + 1,
                question_text=q_text,
                question_type="technical"
            )
            db.add(q)
            question_objects.append(q)
            
        # Add Behavioral Question (Last)
        last_q = InterviewQuestion(
            interview_id=interview.id,
            question_number=5,
            question_text=behavioral_q,
            question_type="behavioral"
        )
        db.add(last_q)
        
        db.commit()
        
    except Exception as e:
        print(f"Error generating questions: {e}")
        # Fallback questions
        fallbacks = [
            "Tell me about yourself.",
            "Describe a challenging project you worked on.",
            "What refer technical skills do you have?",
            "How do you handle conflict in a team?",
            "Do you have any questions for us?"
        ]
        for i, q_text in enumerate(fallbacks):
            q = InterviewQuestion(
                interview_id=interview.id,
                question_number=i + 1,
                question_text=q_text,
                question_type="behavioral"
            )
            db.add(q)
        db.commit()
    
    return interview

@router.get("/{interview_id}/current-question", response_model=InterviewQuestionResponse)
async def get_current_question(
    interview_id: int,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """Get current question for interview"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.candidate_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
        
    if interview.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Interview complete"
        )
    
    # Get latest unanswered question
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).order_by(InterviewQuestion.question_number).all()
    
    # Find first unanswered question
    for question in questions:
        answers = db.query(InterviewAnswer).filter(
            InterviewAnswer.question_id == question.id
        ).all()
        if not answers:
            return question
            
    # If all questions are answered, check if we need to generate more?
    # For now, we assume fixed 5 questions as per legacy logic "generating questions once"
    # But if we wanted to support "infinite" or "upto 10", we would generate here.
    # Since we generated 5 at start, and legacy had 5 total, we stop here.
    
    # Interview complete
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Interview complete"
    )

@router.post("/{interview_id}/submit-answer")
async def submit_answer(
    interview_id: int,
    data: InterviewAnswerSubmit,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """Submit answer to current question"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.candidate_id == current_user.id,
        Interview.status == "in_progress"
    ).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found or not in progress"
        )
    
    # Get current unanswered question
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).order_by(InterviewQuestion.question_number).all()
    
    current_question = None
    for question in questions:
        answers = db.query(InterviewAnswer).filter(
            InterviewAnswer.question_id == question.id
        ).all()
        if not answers:
            current_question = question
            break
    
    if not current_question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No unanswered question found"
        )
    
    # Save answer
    answer = InterviewAnswer(
        question_id=current_question.id,
        answer_text=data.answer_text,
        submitted_at=datetime.utcnow()
    )
    
    db.add(answer)
    
    # Evaluate answer with AI
    try:
        job = interview.application.job
        evaluation = await evaluate_detailed_answer(
            question=current_question.question_text,
            answer=data.answer_text
        )
        
        answer.answer_score = float(evaluation.get("overall", 5))
        answer.skill_relevance_score = float(evaluation.get("technical_accuracy", 5))
        # Store full detailed evaluation JSON in the text field
        answer.answer_evaluation = json.dumps(evaluation)
        answer.evaluated_at = datetime.utcnow()
    except Exception as e:
        print(f"Error evaluating answer: {e}")
    
    db.commit()
    db.refresh(answer)
    
    return {"success": True, "answer_id": answer.id}

@router.post("/{interview_id}/end")
async def end_interview(
    interview_id: int,
    current_user: User = Depends(get_current_candidate),
    db: Session = Depends(get_db)
):
    """End interview and trigger evaluation"""
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.candidate_id == current_user.id,
        Interview.status == "in_progress"
    ).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found or not in progress"
        )
    
    # End interview
    interview.status = "completed"
    interview.ended_at = datetime.utcnow()
    
    # Update application status
    interview.application.status = "interview_completed"
    
    # Calculate overall score
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_id == interview_id
    ).all()
    
    scores = []
    qa_pairs = []
    for question in questions:
        answers = db.query(InterviewAnswer).filter(
            InterviewAnswer.question_id == question.id
        ).all()
        if answers:
            score = answers[0].answer_score or 5.0
            scores.append(score)
            qa_pairs.append({
                "question": question.question_text,
                "answer": answers[0].answer_text,
                "score": score
            })
    
    overall_score = sum(scores) / len(scores) if scores else 5.0
    interview.overall_score = overall_score
    interview.questions_asked = len(questions)
    
    db.commit()
    
    # Generate report
    try:
        job = interview.application.job
        report_data = await generate_interview_report(
            job_title=job.title,
            required_skills=job.required_skills,
            all_qa_pairs=qa_pairs,
            overall_score=overall_score
        )
        
        # Serialize detailed_feedback to JSON string if it's a dict/list
        detailed_feedback_val = report_data["detailed_feedback"]
        if isinstance(detailed_feedback_val, (dict, list)):
            detailed_feedback_val = json.dumps(detailed_feedback_val)
            
        report = InterviewReport(
            interview_id=interview_id,
            overall_score=report_data["overall_score"],
            technical_skills_score=report_data["technical_skills_score"],
            communication_score=report_data["communication_score"],
            problem_solving_score=report_data["problem_solving_score"],
            strengths=report_data["strengths"],
            weaknesses=report_data["weaknesses"],
            summary=report_data["summary"],
            recommendation=report_data["recommendation"].lower().replace(" ", "_"),
            detailed_feedback=detailed_feedback_val
        )
        
        db.add(report)
        db.commit()

        # Send notification to HR
        from app.models import Notification
        try:
            notification = Notification(
                user_id=job.hr_id,
                notification_type="interview_completed",
                title=f"Interview Completed: {current_user.full_name}",
                message=f"{current_user.full_name} has completed the interview for {job.title}. AI Score: {overall_score:.1f}",
                related_application_id=interview.application_id,
                related_interview_id=interview_id
            )
            db.add(notification)
            db.commit()
        except Exception as e:
            print(f"Error creating notification: {e}")
            
        # ---------------------------------------------------------
        # integrate ReportManager for JSON file generation
        # ---------------------------------------------------------
        try:
            try:
                from backend.interview_process.report_manager import ReportManager
            except ImportError:
                from interview_process.report_manager import ReportManager
                
            report_manager = ReportManager()
            
            # Reconstruct session_state
            # 1. Candidate Info
            candidate_info = {
                "skills": str(interview.locked_skill).split(',') if interview.locked_skill else [],
                "primary_skill": interview.locked_skill or "general",
                "experience": "mid", # Defaulting as we might not have stored it explicitly in Interview
                "intro_score": 0 # Not explicitly stored
            }
            
            # 2. Responses
            responses_data = []
            for i, qa in enumerate(qa_pairs):
                # Try to parse the stored evaluation JSON
                eval_data = {}
                try:
                    # Find the answer object again or use what we have
                    # We have 'answer' text in qa_pairs, but we need the evaluation JSON
                    # which is in the Answer table. 
                    # Optimization: We already iterated answers above.
                    # Let's re-fetch or assume we need to query if we didn't keep it.
                    # Actually, let's just use what we have.
                    pass
                except:
                    pass
                    
                # Iterate questions again to get full data? 
                # Or just build from what we have. 
                # We need the `answer_evaluation` field from InterviewAnswer.
                
                # Let's find the specific answer object for this question
                ans_obj = db.query(InterviewAnswer).filter(
                     InterviewAnswer.question_id == questions[i].id
                ).first()
                
                evaluation_json = {}
                if ans_obj and ans_obj.answer_evaluation:
                    try:
                        evaluation_json = json.loads(ans_obj.answer_evaluation)
                    except:
                        pass
                
                responses_data.append({
                    "question": qa["question"],
                    "answer": qa["answer"],
                    "evaluation": evaluation_json,
                    "score": qa["score"],
                    "question_number": i + 1,
                    "question_type": questions[i].question_type
                })

            # 3. Questions Asked List
            questions_list = [q.question_text for q in questions]
            
            # 4. Messages (Simulated Transcript)
            messages = []
            messages.append({"role": "system", "content": f"Interview initialized for {job.title}", "timestamp": str(interview.started_at)})
            for resp in responses_data:
                messages.append({"role": "system", "content": f"Question: {resp['question']}"})
                messages.append({"role": "candidate", "content": resp['answer']})
            
            session_state = {
                "candidate_profile": candidate_info,
                "questions_asked": questions_list, # This is the list of strings
                "question_evaluations": responses_data, # This matches the report manager's expectation
                "questions": questions_list, # ReportManager uses this too
                "responses": responses_data, # InterviewManager uses this
                "overall_score": overall_score,
                "final_score": overall_score,
                "messages": messages,
                "start_time": interview.started_at.timestamp() if interview.started_at else 0,
                "end_time": interview.ended_at.timestamp() if interview.ended_at else 0,
                "user_id": current_user.id # For ReportManager to link to DB if it wants (though we already did)
            }
            
            saved_path = report_manager.save_interview_report(session_state)
            print(f"✅ JSON Report saved to: {saved_path}")
            
        except Exception as e:
            print(f"❌ Error in ReportManager integration: {e}")
            import traceback
            traceback.print_exc()

    except Exception as e:
        print(f"Error generating report: {e}")
    
    return {"success": True, "interview_id": interview_id, "status": "completed"}

@router.get("/{interview_id}", response_model=InterviewDetailResponse)
def get_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get interview details"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Check access
    if current_user.role == "candidate" and interview.candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own interviews"
        )
    
    if current_user.role == "hr" and interview.application.job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view interviews for your jobs"
        )
    
    return interview

@router.get("/{interview_id}/report", response_model=InterviewReportResponse)
def get_interview_report(
    interview_id: int,
    current_user: User = Depends(get_current_hr),
    db: Session = Depends(get_db)
):
    """Get interview report (HR only)"""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    
    # Check HR access
    if interview.application.job.hr_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view reports for your interviews"
        )
    
    report = db.query(InterviewReport).filter(
        InterviewReport.interview_id == interview_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not yet available"
        )
    
    return report
