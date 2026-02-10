# Troubleshooting Guide

## Problem: "Server error (404): Not Found"

This means the backend is running but the endpoint isn't being found. Follow these steps:

### Step 1: Verify Database Connection

Make sure PostgreSQL is running with the correct database:

```bash
# Windows - test connection
psql -U postgres -d hr_system -h localhost
```

If it fails, create the database:
```sql
CREATE DATABASE hr_system;
```

### Step 2: Initialize the Database

From the `backend` folder, run:

```bash
# Activate virtual environment first
venv\Scripts\activate

# Initialize database and create tables
python init_db.py
```

You should see:
```
Creating database tables...
✓ Tables created successfully

Seeding initial data...
✓ Created candidate user: candidate@example.com
✓ Created HR user: hr@company.com

✓ Database initialization completed successfully!

Test credentials:
  Candidate: candidate@example.com / password123
  HR Manager: hr@company.com / password123
```

### Step 3: Restart the Backend Server

```bash
# Kill the old process (Ctrl+C if running)
# Then restart:
python -m uvicorn app.main:app --reload
```

Should see:
```
Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Test the Backend Directly

Visit `http://localhost:8000/health` in your browser. You should see:
```json
{"status": "ok", "message": "HR Recruitment API is running"}
```

### Step 5: Try Registration Again

Go to `http://localhost:3000/auth/register` and try registering with:
- Full Name: Test User
- Email: test@example.com  
- Password: password123
- Role: Job Seeker

## Problem: "Failed to connect to PostgreSQL"

This means the database isn't running or credentials are wrong.

### Solution:

1. **Using Docker:**
```bash
docker run --name hr_db -e POSTGRES_PASSWORD=8765 -e POSTGRES_DB=hr_system -p 5432:5432 -d postgres:14
```

2. **Verify credentials in `.env`:**
```
DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system
```

3. **Test connection:**
```bash
psql -U postgres -d hr_system -h localhost -p 5432
```

## Problem: "ModuleNotFoundError" when running backend

Missing dependencies. Run:

```bash
pip install -r requirements.txt
```

If you get pydantic-core compilation error, try:
```bash
pip install --only-binary :all: -r requirements.txt
```

## Problem: Port 8000 is already in use

```bash
# On Windows, find process on port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Then restart backend
python -m uvicorn app.main:app --reload
```

## Problem: Frontend can't find `.env.example`

The file wasn't included in the download. Create `.env` manually in the `backend` folder with:

```
DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=15
JWT_REFRESH_EXPIRATION_DAYS=7
OPENAI_API_KEY=sk-your-openai-api-key-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

## Problem: Still getting 404 errors

1. Check backend console for errors
2. Verify routes are registered: Visit `http://localhost:8000/docs` to see Swagger UI
3. Make sure backend was restarted after init_db.py
4. Try logging in with test credentials: `candidate@example.com` / `password123`

## Quick Checklist

- [ ] PostgreSQL running (test with `psql -U postgres`)
- [ ] `.env` file created in `backend/` folder
- [ ] `OPENAI_API_KEY` added to `.env`
- [ ] `python init_db.py` completed successfully
- [ ] Backend running with `python -m uvicorn app.main:app --reload`
- [ ] Backend shows "Uvicorn running on http://127.0.0.1:8000"
- [ ] Health check works: `http://localhost:8000/health`
- [ ] Frontend running with `npm run dev`
- [ ] Frontend at `http://localhost:3000`

If all checks pass and you still have issues, check the backend console for specific error messages.
