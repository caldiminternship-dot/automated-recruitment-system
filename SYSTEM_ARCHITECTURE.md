# HR Recruitment System - Complete Architecture

## 1. SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANDIDATE & HR PORTAL                         │
│                   (Next.js Frontend + React)                     │
│  ┌──────────────────────────┬──────────────────────────────┐    │
│  │  CANDIDATE INTERFACE     │   HR DASHBOARD               │    │
│  │  - Sign Up / Login       │   - Job Management          │    │
│  │  - Job Browsing          │   - Resume Screening        │    │
│  │  - Job Application       │   - Interview Reports       │    │
│  │  - Resume Upload         │   - Hiring Decisions        │    │
│  │  - AI Interview          │   - Candidate Tracking      │    │
│  │  - Interview Status      │   - Analytics               │    │
│  └──────────────────────────┴──────────────────────────────┘    │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ (REST API with JWT Auth)
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│                   PYTHON FASTAPI BACKEND                          │
│  ┌────────────┬──────────┬──────────┬───────────┬──────────┐    │
│  │ Auth       │ Jobs     │ Apps     │ Interviews│ HR       │    │
│  │ Module     │ Module   │ Module   │ Module    │ Module   │    │
│  │            │          │          │           │          │    │
│  │ - JWT      │ - CRUD   │ - Apply  │ - Gen Q's │ - Review │    │
│  │ - Sessions │ - Skill  │ - Upload │ - Evaluate│ - Decide │    │
│  │ - Roles    │  Mgmt    │  Resume  │ - Parse   │ - Reports│    │
│  └────────────┴──────────┴──────────┴───────────┴──────────┘    │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │         AI INTEGRATION (OpenAI GPT-4o)                    │   │
│  │  - Resume Parsing & Scoring                              │   │
│  │  - Interview Question Generation (Adaptive)              │   │
│  │  - Response Evaluation & Scoring                         │   │
│  │  - Report Generation                                     │   │
│  └───────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ (SQLAlchemy ORM)
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│              PostgreSQL DATABASE (hr_system)                      │
│  ┌──────────┬─────────┬──────────┬──────────┬──────────────┐    │
│  │ Users    │ Jobs    │ Apps     │Interview │ Evaluation   │    │
│  │ Table    │ Table   │ Table    │ Table    │ Table        │    │
│  │          │         │          │          │              │    │
│  │ - ID     │ - ID    │ - ID     │ - ID     │ - ID         │    │
│  │ - Email  │ - Title │ - JobID  │ - AppID  │ - IntervID   │    │
│  │ - Role   │ - Skills│ - UserID │ - Status │ - Skills     │    │
│  │ - Pass   │ - Desc  │ - Resume │ - Q & A  │ - Score      │    │
│  └──────────┴─────────┴──────────┴──────────┴──────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. MODULE BREAKDOWN

### 2.1 Authentication Module
**Purpose:** Secure user identification and session management

**What it does:**
- User registration (Candidate & HR separate)
- Email/password login with JWT tokens
- Role-based access control (RBAC)
- Session management
- Password hashing with bcrypt

**Frontend Components:**
- Sign Up page (role selection)
- Login page
- Forgot Password page

**Backend Endpoints:**
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login & get JWT token
- POST `/api/auth/refresh` - Refresh JWT token
- GET `/api/auth/me` - Get current user info
- POST `/api/auth/logout` - Logout

**Database Tables:**
- `users` (id, email, password_hash, full_name, role, created_at)

**Access Control:**
- Both Candidates & HR can access auth endpoints
- JWT token required for all subsequent requests
- Role embedded in JWT for authorization

---

### 2.2 Job Management Module
**Purpose:** HR creates and manages job openings

**What it does:**
- HR creates job postings
- Define job title, description, required skills, experience level
- Update job status (Open, Closed, On Hold)
- View all published jobs

**Frontend Components:**
- Job Creation Form (HR only)
- Job List Page (HR Dashboard)
- Job Edit Page (HR only)
- Job Detail Page (Candidates - read only)

**Backend Endpoints:**
- POST `/api/jobs/create` - Create new job (HR only)
- GET `/api/jobs` - List all jobs (filtered by role)
- GET `/api/jobs/{id}` - Get job details
- PUT `/api/jobs/{id}` - Update job (HR only)
- DELETE `/api/jobs/{id}` - Close job (HR only)
- GET `/api/jobs/{id}/skills` - Get required skills for job

**Database Tables:**
- `jobs` (id, title, description, required_skills, experience_level, status, hr_id, created_at, updated_at)

**Access Control:**
- HR can create, read, update, delete jobs
- Candidates can only read open jobs

---

### 2.3 Job Application Module
**Purpose:** Candidates apply for jobs with resume upload

**What it does:**
- Candidates view available jobs
- Submit job applications
- Upload resume (PDF/DOC)
- Track application status

**Frontend Components:**
- Job Listing Page (Candidates)
- Job Detail View (Candidates)
- Application Form Modal (Candidates)
- My Applications Page (Candidates)
- Application Review Page (HR)

**Backend Endpoints:**
- POST `/api/applications/apply` - Submit application (Candidates only)
- GET `/api/applications/my-applications` - Get candidate's applications
- GET `/api/applications/{id}` - Get application details
- GET `/api/applications` - List all applications (HR only)
- PUT `/api/applications/{id}/status` - Update status (HR only)

**Database Tables:**
- `applications` (id, job_id, candidate_id, resume_file, status, applied_at, updated_at)
- `application_skills` (id, app_id, skill_name, matched_percentage)

**Access Control:**
- Candidates can create applications & view their own
- HR can view all applications & update status
- Candidates cannot apply without a resume

---

### 2.4 Resume Screening Module
**Purpose:** AI parses resume and extracts skills for matching

**What it does:**
- AI reads candidate's resume
- Extracts skills, experience, education
- Scores resume against job requirements
- Provides skill match percentage

**Frontend Components:**
- Resume Upload Component
- Skill Extraction Display (HR Dashboard)

**Backend Endpoints:**
- POST `/api/resume/parse` - Parse resume with AI
- GET `/api/resume/{app_id}/extracted-skills` - Get extracted skills

**Database Tables:**
- `resume_extractions` (id, app_id, extracted_text, extracted_skills, score, created_at)

**AI Integration:**
- Use OpenAI GPT-4o to parse resume text
- Extract: skills, years of experience, education, previous roles
- Score against job requirements

**Access Control:**
- Only HR can trigger resume parsing
- Candidates cannot see resume analysis details

---

### 2.5 Automatic AI Interview Module (CORE)
**Purpose:** Conduct adaptive AI-driven interviews

**What it does:**
- Create interview record after application approval
- AI generates first question from resume + job requirements
- Candidate answers questions
- AI generates next question dynamically based on previous answer
- Continue until interview is complete (e.g., 5-7 questions)
- Candidate gets real-time feedback on performance

**Frontend Components:**
- Interview Invitation Page (Candidates)
- Interview Live Chat Interface (Candidates)
- Interview Status Page (Candidates)

**Backend Endpoints:**
- POST `/api/interviews/start` - Start interview session (Candidate only)
- POST `/api/interviews/{id}/submit-answer` - Submit answer to current question
- GET `/api/interviews/{id}/current-question` - Get next question
- GET `/api/interviews/{id}/status` - Get interview progress
- POST `/api/interviews/{id}/end` - End interview

**Database Tables:**
- `interviews` (id, app_id, status, started_at, ended_at, score)
- `interview_questions` (id, interview_id, question_num, question_text, ai_generated_at)
- `interview_answers` (id, question_id, answer_text, submitted_at)

**AI Integration (Main):**
1. **Initial Question Generation:**
   - Input: Resume + Job Description + Job Skills
   - Output: First interview question (behavioral or technical)
   
2. **Adaptive Question Generation:**
   - Input: Previous answer + Job requirements + Interview context
   - Output: Next question (may follow up or shift direction)
   - Logic: If candidate struggled with skill X, ask more about it
   
3. **Answer Evaluation:**
   - Input: Candidate answer + Expected competencies
   - Output: Score (1-10), relevance assessment, skill alignment

4. **Interview Completion:**
   - Auto-end after 5-7 questions or candidate selects "End Interview"

**Access Control:**
- Candidates can only start interview AFTER application is approved by HR
- Candidates cannot start interview twice
- HR cannot interfere during interview
- AI questions based on job requirements

---

### 2.6 Interview Evaluation & Report Module
**Purpose:** AI generates comprehensive evaluation report

**What it does:**
- Analyzes all interview answers
- Generates explainable report with scores
- Highlights strengths and weaknesses
- Provides hiring recommendation

**Frontend Components:**
- Interview Report Page (HR Dashboard)
- Candidate Evaluation Summary (HR)

**Backend Endpoints:**
- GET `/api/interviews/{id}/report` - Get AI-generated report
- POST `/api/interviews/{id}/evaluate` - Trigger AI evaluation

**Database Tables:**
- `interview_reports` (id, interview_id, overall_score, summary, strengths, weaknesses, recommendation, created_at)
- `skill_evaluations` (id, report_id, skill_name, score, assessment)

**AI Integration:**
- GPT-4o analyzes all Q&A pairs
- Scores: Technical Skills (1-10), Communication (1-10), Problem Solving (1-10)
- Generates narrative report: "Candidate demonstrated strong X, needs improvement in Y"
- Recommendation: "RECOMMENDED", "CONSIDER", "NOT RECOMMENDED"

**Access Control:**
- Only HR can view reports
- Report auto-generated after interview ends

---

### 2.7 HR Review & Decision Module
**Purpose:** HR makes final hiring decisions

**What it does:**
- HR reviews all candidate data (resume, interview report, scores)
- HR makes hire/reject decision
- Candidates notified of decision
- Data archived for future reference

**Frontend Components:**
- Candidate Review Dashboard (HR)
- Candidate Full Profile (HR)
- Decision Modal (Accept/Reject)
- Notification Page (Candidates)

**Backend Endpoints:**
- GET `/api/candidates/{id}/full-profile` - Get all candidate data
- PUT `/api/candidates/{id}/decision` - HR makes hire/reject decision
- GET `/api/candidates/pipeline` - Get all candidates at each stage
- POST `/api/notifications/send` - Send decision notification

**Database Tables:**
- `hiring_decisions` (id, app_id, hr_id, decision, comments, decided_at)
- `notifications` (id, user_id, type, message, read, created_at)

**Access Control:**
- Only HR can make hiring decisions
- Candidates can view their own status & notifications
- HR cannot see candidates until they apply

---

## 3. DATABASE SCHEMA DESIGN

### 3.1 Table Relationships

```
users (1) ─── (M) applications
           ├── (M) jobs (if HR)
           └── (M) interviews

jobs (1) ─── (M) applications
         └── (M) interview_questions

applications (1) ─── (M) interviews
               ├── (1) resume_extractions
               └── (1) hiring_decisions

interviews (1) ─── (M) interview_questions
           └── (1) interview_reports

interview_questions (1) ─── (M) interview_answers
                       └── (M) skill_evaluations
```

### 3.2 Enforcement Rules

1. **No Interview Without Application:**
   - Foreign key: `interviews.application_id` → `applications.id`
   - Constraint: Interview can only be created if application exists
   
2. **No Interview Without Resume:**
   - Check: `interview` can only start if `application.resume_file` is not null
   
3. **Role-Based Data Isolation:**
   - HR can only see candidates who applied for their jobs
   - Candidates can only see their own data
   
4. **Status Progression:**
   - Application → (HR approves) → Interview → Report → Decision

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1 JWT Token Structure

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "candidate|hr",
  "exp": 1704067200,
  "iat": 1704050800
}
```

### 4.2 Role-Based Access Control (RBAC)

| Endpoint | Candidate | HR | Unauthenticated |
|----------|-----------|----|----|
| POST /auth/register | ✓ | ✓ | ✓ |
| POST /auth/login | ✓ | ✓ | ✓ |
| GET /jobs | ✓ | ✓ | ✗ |
| POST /jobs/create | ✗ | ✓ | ✗ |
| POST /applications/apply | ✓ | ✗ | ✗ |
| GET /applications | ✗ | ✓ | ✗ |
| POST /interviews/start | ✓ | ✗ | ✗ |
| GET /interviews/{id}/report | ✗ | ✓ | ✗ |

---

## 5. STEP-BY-STEP WORKFLOW

### 5.1 Candidate Workflow

1. **Sign Up & Login**
   - Candidate registers with email & password
   - Role = "candidate"
   - JWT token issued on login

2. **Browse Jobs**
   - Candidate views available job openings
   - Can see job title, description, required skills
   - Can view only open jobs

3. **Apply for Job**
   - Candidate clicks "Apply" on a job
   - Uploads resume (PDF/DOC)
   - Application status = "submitted"
   - AI immediately parses resume

4. **Wait for HR Review**
   - HR reviews resume & application
   - HR sets status = "approved_for_interview" or "rejected"
   - Candidate notified via email/dashboard

5. **AI Interview (if approved)**
   - Candidate clicks "Start Interview" button
   - AI generates first question from resume + job description
   - Candidate types answer
   - AI evaluates answer & generates next question
   - Process repeats 5-7 questions
   - Candidate clicks "End Interview"
   - System auto-evaluates all answers

6. **Wait for Decision**
   - HR reviews interview report
   - HR makes final decision: HIRE or REJECT
   - Candidate notified

### 5.2 HR Workflow

1. **Login to Dashboard**
   - HR logs in with role = "hr"
   - Access HR dashboard

2. **Create Job Opening**
   - HR fills job creation form
   - Specify: Title, Description, Required Skills, Experience Level
   - Job status = "open"

3. **Review Applications**
   - HR sees all applications for their jobs
   - Views resume + extracted skills
   - Can approve or reject application

4. **Monitor Interviews**
   - Can see interview status (in progress, completed)
   - Cannot view interview in real-time
   - Cannot ask questions or interfere

5. **Review Interview Reports**
   - AI-generated report available after interview ends
   - Report includes scores, strengths, weaknesses, recommendation
   - HR can add comments

6. **Make Hiring Decision**
   - HR clicks "Hire" or "Reject"
   - Decision is final
   - Candidate notified immediately

---

## 6. SECURITY CONSIDERATIONS

### 6.1 Backend Security

1. **Password Storage:**
   - Use bcrypt with salt rounds = 10
   - Never store plain-text passwords

2. **JWT Security:**
   - Use HS256 or RS256 algorithm
   - Short expiration (15 minutes)
   - Refresh token mechanism (7 days)

3. **API Security:**
   - All endpoints except /auth/* require JWT
   - Validate role before allowing action
   - Use parameterized queries (SQLAlchemy prevents SQL injection)

4. **File Upload Security:**
   - Validate file type (only PDF, DOC, DOCX)
   - Scan for malware (optional)
   - Store in secure location with access control

### 6.2 Frontend Security

1. **Token Storage:**
   - Store JWT in httpOnly cookie (not localStorage)
   - Automatic inclusion in all API requests

2. **CORS:**
   - Configure CORS for Next.js frontend origin only

3. **Input Validation:**
   - Validate all form inputs before sending
   - Sanitize user-provided text

---

## 7. AI INTEGRATION DETAILS

### 7.1 OpenAI GPT-4o Usage

**Endpoint:** https://api.openai.com/v1/chat/completions

**Use Cases:**

1. **Resume Parsing**
   ```
   Prompt: "Extract skills from this resume: [resume_text]"
   Response: ["Python", "FastAPI", "PostgreSQL", ...]
   ```

2. **Interview Question Generation (Initial)**
   ```
   Prompt: "Generate an interview question for a [job_title] position. 
   Required skills: [skills]. 
   Candidate background: [resume_summary].
   Question type: behavioral"
   Response: "Tell me about a time you led a project..."
   ```

3. **Adaptive Question Generation**
   ```
   Prompt: "Previous answer: [answer]. 
   Candidate demonstrated [skill_level]. 
   Generate follow-up question on [skill_name]."
   Response: "Can you explain your approach to..."
   ```

4. **Answer Evaluation**
   ```
   Prompt: "Evaluate this interview answer for a [job_title] position.
   Question: [question]
   Answer: [answer]
   Rate from 1-10 and explain."
   Response: {"score": 7, "assessment": "Good understanding of basics..."}
   ```

5. **Report Generation**
   ```
   Prompt: "Generate hiring report based on:
   Resume score: [score]
   Interview answers: [all Q&A pairs]
   Overall assessment and recommendation."
   Response: Structured report with scores & recommendation
   ```

### 7.2 Cost Optimization

- Use GPT-4o mini for resume parsing (cheaper)
- Use GPT-4o for interview evaluation (more accurate)
- Cache common prompts to reduce API calls
- Batch process non-real-time requests

---

## 8. DATA FLOW EXAMPLES

### 8.1 Candidate Application Flow

```
1. Candidate fills application form with resume
   ↓
2. POST /api/applications/apply
   - Backend validates application
   - Stores resume file
   - Creates application record
   ↓
3. POST /api/resume/parse (async)
   - OpenAI parses resume
   - Extracts skills
   - Stores in resume_extractions table
   ↓
4. HR reviews application (next day)
   - Views candidate profile + resume analysis
   - Approves or rejects
   ↓
5. PUT /api/applications/{id}/status = "approved_for_interview"
   - Candidate notified
```

### 8.2 Interview Flow

```
1. Candidate clicks "Start Interview"
   - POST /api/interviews/start
   - Interview record created with status = "in_progress"
   ↓
2. GET /api/interviews/{id}/current-question
   - First time: AI generates first question
   - Input: resume + job description
   - Response: Question 1
   ↓
3. Candidate types answer
   - POST /api/interviews/{id}/submit-answer
   - Answer stored in interview_answers table
   ↓
4. AI evaluates answer (async)
   - OpenAI scores answer 1-10
   - Determines if candidate understood skill
   ↓
5. Generate next question
   - GET /api/interviews/{id}/current-question
   - AI generates Question 2 (adaptive)
   ↓
6. Repeat steps 3-5 until 7 questions or candidate ends
   ↓
7. Interview ends
   - POST /api/interviews/{id}/end
   - status = "completed"
   - Trigger full evaluation
   ↓
8. POST /api/interviews/{id}/evaluate
   - AI analyzes all Q&A pairs
   - Generates comprehensive report
   - Report stored in interview_reports table
   ↓
9. HR reviews report
   - GET /api/interviews/{id}/report
   - Makes hire/reject decision
```

---

## 9. DATABASE INTEGRITY CONSTRAINTS

### 9.1 Foreign Keys

```sql
ALTER TABLE applications ADD CONSTRAINT fk_app_job
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE applications ADD CONSTRAINT fk_app_user
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE interviews ADD CONSTRAINT fk_interview_app
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

ALTER TABLE interview_questions ADD CONSTRAINT fk_iq_interview
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

ALTER TABLE interview_answers ADD CONSTRAINT fk_ia_question
  FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE;

ALTER TABLE interview_reports ADD CONSTRAINT fk_ir_interview
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;
```

### 9.2 Check Constraints

```sql
-- No interview without approved application
ALTER TABLE interviews ADD CONSTRAINT check_app_approved
  CHECK (application_id IN (SELECT id FROM applications WHERE status = 'approved_for_interview'));

-- Status progression
ALTER TABLE applications ADD CONSTRAINT check_app_status
  CHECK (status IN ('submitted', 'approved_for_interview', 'rejected', 'hired', 'rejected_post_interview'));

ALTER TABLE interviews ADD CONSTRAINT check_interview_status
  CHECK (status IN ('in_progress', 'completed', 'cancelled'));
```

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React + TypeScript | UI/UX for candidates & HR |
| Frontend Styling | Tailwind CSS | Responsive design |
| Frontend State | React Hooks + SWR | State management & data fetching |
| Backend | Python + FastAPI | REST API |
| Backend ORM | SQLAlchemy | Database abstraction |
| Database | PostgreSQL | Data persistence |
| Authentication | JWT (HS256) | Session management |
| File Storage | Local filesystem / Cloud | Resume storage |
| AI | OpenAI GPT-4o API | Interview logic & evaluation |

### 10.2 Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Backend (.env):**
```
DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION=900
```

---

## 11. VIVA / EXAM-READY SUMMARY

### Key Points to Remember:

1. **Two Roles:**
   - Candidates: Apply, Interview, Wait for decision
   - HR: Create jobs, Review applications, Review reports, Make decisions

2. **Core Automation:**
   - Interviews fully automated with AI
   - Questions are adaptive (follow-up based on previous answer)
   - Candidates never interact with HR directly

3. **Database Integrity:**
   - Candidate can only interview after applying
   - Interview can only start after HR approval
   - Foreign keys enforce this automatically

4. **AI Workflow:**
   - Resume parsing → Interview Q&A generation → Answer evaluation → Report generation

5. **Security:**
   - JWT for authentication
   - bcrypt for passwords
   - Role-based access control at backend

6. **Modules (7 total):**
   - Auth → Jobs → Applications → Resume Screening → AI Interview → Evaluation → HR Decision

7. **Process Flow:**
   - Candidate applies → Resume parsed by AI → HR approves/rejects → Interview with AI → Report generated → HR decides

---

## 12. NEXT STEPS

1. Create PostgreSQL schema (Task 2)
2. Build Python FastAPI backend (Task 3)
3. Build Next.js frontend components (Tasks 4-6)
4. Integrate AI and test end-to-end (Task 7)
