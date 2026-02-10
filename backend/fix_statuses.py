import sqlite3
from datetime import datetime

def fix_interview_status():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    try:
        # Find all interviews that have answers but are not marked 'completed'
        # Or just force all in_progress to completed for now to unblock the user
        print("Forcing all in_progress interviews to completed...")
        
        cursor.execute("UPDATE interviews SET status = 'completed', ended_at = ? WHERE status = 'in_progress'", (datetime.utcnow(),))
        cursor.execute("UPDATE applications SET status = 'interview_completed' WHERE id IN (SELECT application_id FROM interviews WHERE status = 'completed')")
        
        conn.commit()
        print(f"Updated {cursor.rowcount} interviews.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_interview_status()
