# Quick Start Guide - HR Recruitment System

## Prerequisites
- Python 3.8+
- PostgreSQL 12+
- Node.js 16+
- npm or yarn

## Step 1: Setup PostgreSQL Database

### Option A: Using Docker (Recommended)
```bash
docker run --name hr_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=8765 \
  -e POSTGRES_DB=hr_system \
  -p 5432:5432 \
  -d postgres:14
```

### Option B: Manual PostgreSQL Installation
Create a database and user:
```sql
CREATE USER postgres WITH PASSWORD '8765';
CREATE DATABASE hr_system OWNER postgres;
```

## Step 2: Setup Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
CORS_ORIGINS=["http://localhost:3000"]
EOF

# Initialize database (creates tables)
python -c "from app.database import init_db; init_db()"

# Run the FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Step 3: Setup Frontend (Next.js)

```bash
# In a NEW terminal, from the root directory

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will start at `http://localhost:3000`

## Step 4: Access the Application

1. Open `http://localhost:3000` in your browser
2. Go to the register page
3. Create an account (select role: Job Seeker or HR Manager)
4. Log in with your credentials

## Test Credentials (if you seed the database)

### Candidate Account
- Email: `candidate@example.com`
- Password: `password123`

### HR Manager Account
- Email: `hr@company.com`
- Password: `password123`

## Troubleshooting

### "Failed to fetch" Error
This means the frontend cannot connect to the backend. Make sure:
1. ✅ Backend is running at `http://localhost:8000`
2. ✅ PostgreSQL database is running and accessible
3. ✅ `.env` file is configured in `/backend` folder with correct `DATABASE_URL`
4. ✅ Frontend `.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

### Database Connection Error
```
Error: unable to connect to server: Connection refused
```
Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Ubuntu/Debian
sudo systemctl start postgresql

# Docker
docker start hr_db
```

### Port Already in Use
- Backend port 8000: Change in the startup command: `--port 8001`
- Frontend port 3000: `npm run dev -- -p 3001`

## File Structure
```
/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py      # Main FastAPI app
│   │   ├── models.py    # SQLAlchemy models
│   │   ├── schemas.py   # Pydantic schemas
│   │   ├── auth.py      # Auth utilities
│   │   ├── database.py  # Database connection
│   │   ├── routes/      # API endpoints
│   │   └── services/    # Business logic
│   ├── requirements.txt
│   ├── .env.example
│   └── SETUP.md
├── app/                 # Next.js frontend
│   ├── auth/           # Auth pages
│   ├── dashboard/      # Protected pages
│   ├── globals.css
│   └── layout.tsx
├── lib/                # Frontend utilities
│   ├── auth-context.tsx
│   └── api-client.ts
└── DATABASE_SCHEMA.sql  # Database schema
```

## Next Steps

1. **Setup OpenAI API**: Get your API key from https://platform.openai.com
2. **Customize**: Update job categories, interview questions, and scoring in `backend/app/services/ai_service.py`
3. **Deploy**: See `IMPLEMENTATION_GUIDE.md` for production deployment
