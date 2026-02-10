import sqlite3
import os

def check_resumes():
    db_path = "backend/sql_app.db"
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print(f"{'ID':<5} | {'Candidate ID':<12} | {'Status':<20} | {'Resume Path'}")
        print("-" * 80)
        cursor.execute("SELECT id, candidate_id, status, resume_file_path FROM applications ORDER BY id DESC LIMIT 10")
        rows = cursor.fetchall()
        for row in rows:
            print(f"{row[0]:<5} | {row[1]:<12} | {row[2]:<20} | {row[3]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_resumes()
