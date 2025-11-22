import sqlite3
import datetime
import uuid
import os

DB_NAME = "cases.db"

def get_connection():
    """建立資料庫連線"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # 讓回傳結果可以用欄位名稱存取
    return conn

def migrate_database():
    """
    資料庫遷移：檢查並新增缺少的欄位
    用於舊資料庫向新版本平滑升級
    """
    conn = get_connection()
    c = conn.cursor()
    
    try:
        # 檢查 cases 表是否有 assigned_to 欄位
        c.execute("PRAGMA table_info(cases)")
        columns = [column[1] for column in c.fetchall()]
        
        if 'assigned_to' not in columns:
            print("⚠️ 偵測到舊資料庫，正在執行遷移...")
            c.execute("ALTER TABLE cases ADD COLUMN assigned_to TEXT")
            conn.commit()
            print("✅ 已新增 assigned_to 欄位")
        
        # 檢查 cases 表是否有 line_id 欄位
        if 'line_id' not in columns:
            print("⚠️ 正在新增 line_id 欄位...")
            c.execute("ALTER TABLE cases ADD COLUMN line_id TEXT")
            conn.commit()
            print("✅ 已新增 line_id 欄位")
    
    except Exception as e:
        print(f"❌ 資料庫遷移失敗: {e}")
    finally:
        conn.close()

def init_db():
    """初始化資料庫：建立案件資料表"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            applicant_name TEXT NOT NULL,
            applicant_email TEXT NOT NULL,
            applicant_phone TEXT NOT NULL,
            place_name TEXT,
            place_address TEXT,
            file_path TEXT,
            status TEXT DEFAULT '待處理',
            submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            review_notes TEXT,
            assigned_to TEXT,
            line_id TEXT
        )
    ''')

    # Create users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')

    # Create audit_logs table
    c.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    
    # Execute database migration for existing databases
    migrate_database()
    
    # Initialize default admin if no users exist
    init_admin_user()

def init_admin_user():
    """Initialize default admin user if users table is empty"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT count(*) FROM users')
    if c.fetchone()[0] == 0:
        import auth
        salt, pwd_hash = auth.hash_password("admin123")
        c.execute('''
            INSERT INTO users (username, password_salt, password_hash, role, email)
            VALUES (?, ?, ?, ?, ?)
        ''', ("admin", salt, pwd_hash, "admin", "admin@example.com"))
        conn.commit()
        print("Default admin user created: admin / admin123")
    conn.close()

# --- User Management ---

def create_user(username, password, role, email):
    import auth
    conn = get_connection()
    c = conn.cursor()
    salt, pwd_hash = auth.hash_password(password)
    try:
        c.execute('''
            INSERT INTO users (username, password_salt, password_hash, role, email)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, salt, pwd_hash, role, email))
        conn.commit()
        return True, "User created successfully"
    except sqlite3.IntegrityError:
        return False, "Username already exists"
    finally:
        conn.close()

def get_user(username):
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username = ?', (username,))
    user = c.fetchone()
    conn.close()
    return user

def update_user_password(username, new_password):
    import auth
    conn = get_connection()
    c = conn.cursor()
    salt, pwd_hash = auth.hash_password(new_password)
    c.execute('UPDATE users SET password_salt = ?, password_hash = ? WHERE username = ?', (salt, pwd_hash, username))
    conn.commit()
    conn.close()

def update_last_login(username):
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ?', (username,))
    conn.commit()
    conn.close()

def get_all_users():
    """取得所有使用者資料（完整資訊）"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT username, role, email, created_at, last_login FROM users ORDER BY created_at DESC')
    users = c.fetchall()
    conn.close()
    return users

def get_all_usernames():
    """
    取得所有使用者帳號列表（供派案下拉選單使用）
    
    Returns:
        list: 帳號列表，例如 ['admin', 'josh', 'staff1']
    """
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT username FROM users ORDER BY username ASC')
    users = [row[0] for row in c.fetchall()]
    conn.close()
    return users

# --- Audit Logs ---

def add_log(username, action, details=""):
    conn = get_connection()
    c = conn.cursor()
    c.execute('INSERT INTO audit_logs (username, action, details) VALUES (?, ?, ?)', (username, action, details))
    conn.commit()
    conn.close()

def get_audit_logs():
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100') # Limit to last 100 logs for performance
    logs = c.fetchall()
    conn.close()
    return logs

# --- Case Management ---

def create_case(name, email, phone, place_name, place_address, file_path, line_id=None):
    """建立新案件，回傳案件單號"""
    conn = get_connection()
    c = conn.cursor()
    case_id = str(uuid.uuid4())[:8]  # 產生 8 位隨機單號
    try:
        c.execute('''
            INSERT INTO cases (id, applicant_name, applicant_email, applicant_phone, 
                             place_name, place_address, file_path, line_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (case_id, name, email, phone, place_name, place_address, file_path, line_id, '待處理'))
        conn.commit()
        return case_id
    except Exception as e:
        print(f"Error creating case: {e}")
        return None
    finally:
        conn.close()

def get_case_by_id(case_id):
    """依單號查詢案件"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM cases WHERE id = ?', (case_id,))
    case = c.fetchone()
    conn.close()
    return case

def get_cases_by_email(email):
    """依 Email 查詢案件"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM cases WHERE applicant_email = ? ORDER BY submission_date DESC', (email,))
    cases = c.fetchall()
    conn.close()
    return cases

def get_all_cases(status_filter=None):
    """取得所有案件 (管理者用)"""
    conn = get_connection()
    c = conn.cursor()
    
    if status_filter and status_filter != "全部":
        c.execute('SELECT * FROM cases WHERE status = ? ORDER BY submission_date DESC', (status_filter,))
    else:
        c.execute('SELECT * FROM cases ORDER BY submission_date DESC')
        
    cases = c.fetchall()
    conn.close()
    return cases

def update_case_status(case_id, new_status, notes=None):
    """更新案件狀態"""
    conn = get_connection()
    c = conn.cursor()
    
    if notes:
        c.execute('UPDATE cases SET status = ?, review_notes = ? WHERE id = ?', (new_status, notes, case_id))
    else:
        c.execute('UPDATE cases SET status = ? WHERE id = ?', (new_status, case_id))
        
    conn.commit()
    conn.close()

def update_case_info(case_id, place_name, applicant_name):
    """更新案件基本資料 (Inline Edit)"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE cases SET place_name = ?, applicant_name = ? WHERE id = ?', (place_name, applicant_name, case_id))
    conn.commit()
    conn.close()

def update_case_assignment(case_id_list, username):
    """
    批量更新案件的承辦人
    
    Args:
        case_id_list: 案件單號列表 (list)
        username: 承辦人帳號 (str)
    
    Returns:
        int: 成功更新的案件數量
    """
    conn = get_connection()
    c = conn.cursor()
    updated_count = 0
    
    try:
        for case_id in case_id_list:
            c.execute('UPDATE cases SET assigned_to = ? WHERE id = ?', (username, case_id))
            if c.rowcount > 0:
                updated_count += 1
        conn.commit()
    except Exception as e:
        print(f"Error updating case assignment: {e}")
        conn.rollback()
    finally:
        conn.close()
    
    return updated_count

def delete_case(case_id):
    """刪除案件"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('DELETE FROM cases WHERE id = ?', (case_id,))
    conn.commit()
    conn.close()
