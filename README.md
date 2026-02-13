# Automated Recruitment System - Complete Setup Guide

An AI-powered, fully automated recruitment platform with intelligent interviews, resume screening, and data-driven hiring decisions.

## Project Overview

This is a production-ready recruitment system consisting of:

1. **PostgreSQL Database** - Relational database with 11 tables
2. **Python FastAPI Backend** - RESTful API with AI integration
3. **Next.js 16 Frontend** - Modern React UI for candidates and HR

### Key Features

- **AI-Powered Interviews**: Adaptive, intelligent interviews that adjust questions based on responses
- **Resume Screening**: Automatic parsing and skill matching against job requirements
- **Role-Based Access**: Separate interfaces for candidates and HR managers
- **Real-Time Pipeline**: Track applications through the hiring funnel
- **Interview Reports**: Comprehensive AI-generated assessments with recommendations
- **Data-Driven Decisions**: Detailed analytics and candidate scoring

---

## Directory Structure

```
├── /
│   ├── app/                          # Next.js frontend
│   │   ├── auth/                     # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/                # Protected dashboard
│   │   │   ├── candidate/            # Candidate views
│   │   │   └── hr/                   # HR views
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── lib/
│   │   ├── auth-context.tsx          # Auth state management
│   │   ├── api-client.ts             # API client utility
│   │   └── utils.ts                  # Helper functions
│   ├── components/                   # shadcn/ui components
│   ├── .env.local                    # Frontend env vars
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                          # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                   # FastAPI application
│   │   ├── config.py                 # Settings
│   │   ├── database.py               # Database connection
│   │   ├── models.py                 # SQLAlchemy models
│   │   ├── auth.py                   # JWT authentication
│   │   ├── schemas.py                # Pydantic schemas
│   │   ├── routes/                   # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── jobs.py
│   │   │   ├── applications.py
│   │   │   ├── interviews.py
│   │   │   └── decisions.py
│   │   └── services/
│   │       └── ai_service.py         # OpenAI integration
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Example env vars
│   ├── .env                          # Actual env vars (create from example)
│   └── SETUP.md                      # Backend setup guide
│
├── DATABASE_SCHEMA.sql               # PostgreSQL schema
├── SYSTEM_ARCHITECTURE.md            # Detailed architecture docs
└── README.md                         # This file
```

---

## System Architecture

```
┌─────────────────────────────────────────┐
│  Next.js Frontend (React + TypeScript)  │
│  - Candidate Portal                     │
│  - HR Dashboard                         │
└──────────────┬──────────────────────────┘
               │ (REST API with JWT)
┌──────────────▼──────────────────────────┐
│  Python FastAPI Backend                 │
│  - Authentication                       │
│  - Job Management                       │
│  - Application Handling                 │
│  - AI Interview Engine                  │
│  - Report Generation                    │
│  - Decision Making                      │
└──────────────┬──────────────────────────┘
               │ (SQLAlchemy ORM)
┌──────────────▼──────────────────────────┐
│  PostgreSQL Database (hr_system)        │
│  - Users, Jobs, Applications            │
│  - Interviews, Reports, Decisions       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  OpenAI GPT-4o (External AI Service)     │
│  - Resume Parsing                        │
│  - Question Generation                   │
│  - Answer Evaluation                     │
│  - Report Generation                     │
└──────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+ (for Next.js)
- Python 3.9+ (for FastAPI)
- PostgreSQL 12+ (database)
- OpenAI API key (for AI features)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb -U postgres -h localhost hr_system

# OR via psql
psql -U postgres -c "CREATE DATABASE hr_system;"

# Run schema (PostgreSQL will auto-create tables via FastAPI, or run manually)
# psql -U postgres -h localhost -d hr_system -f DATABASE_SCHEMA.sql
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows: venv\Scripts\activate)
source venv/bin/activate

# Copy env file
cp .env.example .env

# Edit .env with your settings
# DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system
# OPENAI_API_KEY=sk-your-api-key-here

# Install dependencies
pip install -r requirements.txt

# Run server (tables auto-created)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# From root directory

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Run dev server
npm run dev
```

Frontend: `http://localhost:3000`

### 4. Test the System

**Test Credentials** (created automatically by backend):

Candidate:

- Email: `candidate@example.com`
- Password: `password123`

HR Manager:

- Email: `hr@company.com`
- Password: `password123`

---

## Key Components

### Frontend (`/app`)

**Authentication & Layout:**

- `/lib/auth-context.tsx` - Auth state management with useAuth hook
- `/lib/api-client.ts` - Centralized API client with JWT handling
- `/app/auth/login` - Login page
- `/app/auth/register` - Registration page

**Candidate Interface:**

- `/app/dashboard/candidate` - Candidate dashboard
- Browse jobs
- Submit applications
- View interview invitations
- Take AI interviews

**HR Interface:**

- `/app/dashboard/hr` - HR dashboard
- Create job postings
- Review applications
- View interview reports
- Make hiring decisions

### Backend (`/backend`)

**Core Modules:**

1. **Authentication** (`routes/auth.py`)
   - User registration
   - Login with JWT token
   - Current user info

2. **Job Management** (`routes/jobs.py`)
   - Create/update/delete jobs (HR only)
   - List jobs with filtering
   - Job details

3. **Applications** (`routes/applications.py`)
   - Apply for jobs with resume
   - Resume parsing with AI
   - Application status tracking

4. **Interviews** (`routes/interviews.py`)
   - Start interview (after approval)
   - Generate questions (adaptive, AI-powered)
   - Submit answers
   - End interview and trigger evaluation

5. **Hiring Decisions** (`routes/decisions.py`)
   - Make hiring decisions (hire/reject)
   - View decision history
   - Hiring pipeline

6. **AI Service** (`services/ai_service.py`)
   - Resume parsing
   - Question generation (initial & adaptive)
   - Answer evaluation
   - Report generation

### Database Schema

**Core Tables:**

| Table                 | Purpose                         |
| --------------------- | ------------------------------- |
| `users`               | User accounts (candidates & HR) |
| `jobs`                | Job postings                    |
| `applications`        | Job applications                |
| `resume_extractions`  | Parsed resume data              |
| `interviews`          | Interview sessions              |
| `interview_questions` | AI-generated questions          |
| `interview_answers`   | Candidate responses             |
| `interview_reports`   | AI evaluation reports           |
| `hiring_decisions`    | Final hiring decisions          |
| `notifications`       | User notifications              |
| `activity_logs`       | Audit trail                     |

**Key Constraints:**

- Interview can only exist with approved application
- Resume must be uploaded before interview
- One application per candidate per job
- Foreign keys enforce referential integrity

---

## API Endpoints Reference

### Authentication

```
POST /api/auth/register          # Register user
POST /api/auth/login             # Login & get token
GET  /api/auth/me                # Get current user
```

### Jobs

```
POST /api/jobs                   # Create job (HR)
GET  /api/jobs                   # List jobs
GET  /api/jobs/{id}              # Get job details
PUT  /api/jobs/{id}              # Update job (HR)
DELETE /api/jobs/{id}            # Close job (HR)
```

### Applications

```
POST /api/applications/apply             # Apply for job
GET  /api/applications/my-applications   # My applications
GET  /api/applications/{id}              # Application details
GET  /api/applications                   # List applications (HR)
PUT  /api/applications/{id}/status       # Update status (HR)
```

### Interviews

```
POST /api/interviews/start                    # Start interview
GET  /api/interviews/{id}/current-question    # Get current question
POST /api/interviews/{id}/submit-answer       # Submit answer
POST /api/interviews/{id}/end                 # End interview
GET  /api/interviews/{id}                     # Interview details
GET  /api/interviews/{id}/report              # Get report (HR)
```

### Hiring Decisions

```
PUT /api/decisions/applications/{id}/decide   # Make decision (HR)
GET /api/decisions/applications/{id}/decision # Get decision
GET /api/decisions/pipeline                   # Hiring pipeline (HR)
```

---

## Workflow Examples

### Candidate Workflow

1. **Register** → Sign up as job seeker
2. **Browse Jobs** → View open job postings
3. **Apply** → Submit application with resume
4. **Wait for HR** → HR reviews resume (1-2 days)
5. **Interview Approval** → HR approves application
6. **Take Interview** → Answer AI questions (30 min)
7. **Get Decision** → Receive hiring decision (1-2 days)

### HR Workflow

1. **Register** → Sign up as HR manager
2. **Create Jobs** → Post job openings
3. **Review Applications** → Review resumes and parsed data
4. **Approve/Reject** → Set approval status
5. **Review Reports** → Read AI-generated interview reports
6. **Make Decision** → Approve or reject candidate

### AI Interview Workflow

1. Candidate applies for job
2. HR approves application
3. AI generates first question from resume + job description
4. Candidate answers
5. **AI evaluates answer** (score 1-10)
6. **AI generates next question** (adaptive based on answer)
7. Repeat steps 4-6 for 5-7 questions
8. Candidate ends interview
9. **AI generates comprehensive report** with scores and recommendation
10. HR reviews report and makes final decision

---

## Environment Variables

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (`backend/.env`)

```
# Database
DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=15

# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

---

## Development & Debugging

### Testing Endpoints with cURL

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "candidate"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Create Job (with token)
curl -X POST http://localhost:8000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Engineer",
    "description": "Looking for...",
    "required_skills": "Python,FastAPI,PostgreSQL",
    "experience_level": "mid"
  }'
```

### Swagger API Documentation

Backend: `http://localhost:8000/docs`

Swagger UI provides interactive API testing with all endpoints.

### Debug Logging

Enable in `backend/.env`:

```
DEBUG=True
```

Backend will log all SQL queries and HTTP requests.

---

## Production Deployment

### Before Deploying:

1. **Change JWT_SECRET** to a strong random key
2. **Use environment variables** for all secrets
3. **Enable HTTPS** in production
4. **Configure CORS** to your domain
5. **Setup database backups**
6. **Monitor OpenAI API usage**
7. **Enable rate limiting**

### Deployment Options:

**Frontend (Vercel):**

```bash
# Push to GitHub and connect to Vercel
git push origin main
```

**Backend (Railway, Heroku, AWS):**

```bash
# Set environment variables in platform
# Deploy Python FastAPI application
```

---

## Troubleshooting

### Database Connection Error

```
Solution: Verify PostgreSQL is running and credentials are correct
- psql -U postgres -h localhost -d hr_system -c "SELECT 1;"
```

### OpenAI API Key Error

```
Solution: Set OPENAI_API_KEY in backend/.env
- Verify key format: sk-...
- Check OpenAI account has active API access
```

### CORS Error in Frontend

```
Solution: Update CORS settings in backend app/main.py
- Add frontend URL to allowed_origins
- Restart backend server
```

### Auth Token Expired

```
Solution: Login again to get new token
- JWT expires after JWT_EXPIRATION_MINUTES (default 15 min)
- Implement refresh token logic if needed
```

---

## File Modifications Guide

### To Add New API Endpoint:

1. Create/edit route file in `backend/app/routes/`
2. Define Pydantic schema in `backend/app/schemas.py`
3. Use models from `backend/app/models.py`
4. Include router in `backend/app/main.py`

### To Add New Frontend Page:

1. Create page in `app/[section]/page.tsx`
2. Use `useAuth()` hook for authentication
3. Use `APIClient` for API calls
4. Import shadcn/ui components

### To Modify Database:

1. Update `backend/app/models.py`
2. SQLAlchemy creates tables automatically
3. OR create migration script and run manually

---

## Support & Documentation

- **System Architecture**: See `SYSTEM_ARCHITECTURE.md`
- **Database Schema**: See `DATABASE_SCHEMA.sql`
- **Backend Setup**: See `backend/SETUP.md`
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)

---

## License

This project is created with v0 and is ready for production use.

## Next Steps

1. ✅ Setup PostgreSQL database
2. ✅ Run FastAPI backend
3. ✅ Run Next.js frontend
4. ✅ Test with credentials
5. 📝 Customize job categories and required skills
6. 🚀 Deploy to production

---

**Happy Hiring! 🚀**
