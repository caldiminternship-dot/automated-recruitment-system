# Environment Variables Setup Guide

## Where to Put .env Files

### Backend .env File
**Location:** `backend/.env`

**Create this file by copying from template:**
```bash
cd backend
copy .env.example .env
```

**Edit the .env file and add your OpenAI API Key:**

```
DATABASE_URL=postgresql+psycopg2://postgres:8765@localhost:5432/hr_system
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=15
JWT_REFRESH_EXPIRATION_DAYS=7
OPENAI_API_KEY=sk-your-actual-key-from-openai
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### Frontend .env.local File
**Location:** `.env.local` (Root folder, already created)

This is pre-configured and should already contain:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## How to Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key starting with `sk-`
5. Paste it in `backend/.env` file:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxx
   ```

## File Structure Reference

```
hr_system/
├── backend/
│   ├── .env                 ← CREATE & EDIT THIS (add OPENAI_API_KEY)
│   ├── .env.example         (template - DO NOT EDIT)
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   └── ...
│   └── init_db.py
│
├── .env.local               ← Already configured (DO NOT EDIT)
├── app/
├── lib/
├── package.json
└── README.md
```

## Step-by-Step Setup

1. **Extract the downloaded project**

2. **Create backend/.env:**
   ```bash
   cd backend
   copy .env.example .env
   ```

3. **Edit backend/.env** with your text editor:
   - Replace `sk-your-openai-api-key-here` with actual key from OpenAI

4. **Install dependencies:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or: source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   ```

5. **Start PostgreSQL:**
   ```bash
   docker run --name hr_db -e POSTGRES_PASSWORD=8765 -e POSTGRES_DB=hr_system -p 5432:5432 -d postgres:14
   ```

6. **Initialize database:**
   ```bash
   python init_db.py
   ```

7. **Start backend:**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

8. **In new terminal, start frontend:**
   ```bash
   npm install
   npm run dev
   ```

## Verification Checklist

- [ ] Backend .env file created in `backend/` folder
- [ ] `OPENAI_API_KEY` added to backend/.env
- [ ] PostgreSQL running (check Docker or local service)
- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] Can register user at `http://localhost:3000/auth/register`

## Common Issues

**"OPENAI_API_KEY not set"**
- Make sure .env file is in `backend/` folder (not root)
- Make sure you added actual API key, not placeholder text

**"Cannot connect to database"**
- Verify PostgreSQL is running
- Check DATABASE_URL matches your setup
- For Docker: `docker ps` should show `hr_db` running

**"Failed to fetch"**
- Backend not running on port 8000
- Check backend console for errors
- Frontend .env.local should point to `http://localhost:8000`
