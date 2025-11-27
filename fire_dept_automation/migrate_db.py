import sqlite3
import os

DB_NAME = "cases.db"

def migrate():
    if not os.path.exists(DB_NAME):
        print(f"Database {DB_NAME} not found. No migration needed.")
        return

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    print("Starting migration...")
    
    # Add place_name column
    try:
        c.execute("ALTER TABLE cases ADD COLUMN place_name TEXT")
        print("Added column: place_name")
    except sqlite3.OperationalError as e:
        print(f"Column place_name might already exist: {e}")

    # Add place_address column
    try:
        c.execute("ALTER TABLE cases ADD COLUMN place_address TEXT")
        print("Added column: place_address")
    except sqlite3.OperationalError as e:
        print(f"Column place_address might already exist: {e}")

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
