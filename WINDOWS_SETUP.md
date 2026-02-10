# Windows Setup Guide for HR Recruitment System

## Project Structure
```
hr_system/
├── backend/
│   ├── .env              ← CREATE THIS FILE HERE
│   ├── .env.example      (template - copy this)
│   ├── app/
│   ├── requirements.txt
│   └── init_db.py
├── app/
├── lib/
└── package.json
```

## Step 1: Install PostgreSQL & Backend Dependencies

### Option A: Using Docker (Recommended for Windows)
1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Open PowerShell and run:
```powershell
docker run --name hr_db -e POSTGRES_PASSWORD=8765 -e POSTGRES_DB=hr_system -e POSTGRES_USER=postgres -p 5432:5432 -d postgres:14
```

### Option B: Install PostgreSQL Directly
1. Download [PostgreSQL 14](https://www.postgresql.org/download/windows/)
2. Run installer with:
   - Username: `postgres`
   - Password: `8765`
   - Database: `hr_system`
3. Ensure port 5432 is available

## Step 2: Set Up Backend Environment

### Create .env file in `backend/` folder:

**Location:** `hr_system/backend/.env`

**Copy this content:**
```
# Database Configuration
DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system

# JWT Settings
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI API Key (Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key-here

# CORS Settings
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]

# Environment
DEBUG=True
```

**IMPORTANT:** Replace `sk-your-openai-api-key-here` with your actual OpenAI API key!

## Step 3: Install Python Dependencies

```powershell
cd backend
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# If you still get Rust errors, try:
pip install --only-binary :all: -r requirements.txt
```

## Step 4: Initialize Database

```powershell
# Make sure you're in backend folder with venv activated
python init_db.py
```

You should see:
```
Database tables created successfully!
Test data inserted successfully!
```

## Step 5: Start Backend Server

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Uvicorn running on http://127.0.0.1:8000
Press CTRL+C to quit
```

## Step 6: Start Frontend (New PowerShell Window)

```powershell
# Go to root folder (NOT backend)
cd ..

npm install
npm run dev
```

## Step 7: Access Application

Visit: `http://localhost:3000`

### Test Credentials:
- **Email:** test@example.com
- **Password:** password123
- **Role:** Job Seeker

## Troubleshooting

### ❌ "Failed to fetch" error
- Make sure backend is running on `http://localhost:8000`
- Check if port 8000 is already in use: `netstat -ano | findstr :8000`

### ❌ Database connection error
- Verify PostgreSQL is running (Docker or local)
- Check DATABASE_URL in `.env` file
- Make sure password is exactly `8765`

### ❌ OpenAI API error
- Get your key from: https://platform.openai.com/api-keys
- Add it to `backend/.env` as `OPENAI_API_KEY=sk-...`

### ❌ Port 5432 already in use
```powershell
# Kill process using port 5432
netstat -ano | findstr :5432
taskkill /PID <PID> /F
```

### ❌ Still getting Rust errors
Try installing pre-built binaries:
```powershell
pip install --only-binary :all: pydantic
pip install --only-binary :all: -r requirements.txt
```

## Environment Variables Location Reference

**Backend .env:**
```
backend/.env        ← Add OPENAI_API_KEY here
```

**Frontend .env (already configured):**
```
.env.local          ← Already set to http://localhost:8000
```

## Next Steps
Once everything is running:
1. Register as a Job Seeker
2. Create a job posting as HR Manager
3. Apply to jobs
4. Take an AI-powered interview
5. Review results in HR dashboard
