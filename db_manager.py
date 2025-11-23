import sqlite3
import datetime
import uuid
import os
import shutil
import time

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
        
        # 檢查 cases 表是否有 line_id 欄位（使用者自訂 ID）
        if 'line_id' not in columns:
            print("⚠️ 正在新增 line_id 欄位...")
            c.execute("ALTER TABLE cases ADD COLUMN line_id TEXT")
            conn.commit()
            print("✅ 已新增 line_id 欄位")
        
        # 檢查 cases 表是否有 line_user_id 欄位（LINE Messaging API 用）
        if 'line_user_id' not in columns:
            print("⚠️ 正在新增 line_user_id 欄位（LINE Messaging API）...")
            c.execute("ALTER TABLE cases ADD COLUMN line_user_id TEXT")
            conn.commit()
            print("✅ 已新增 line_user_id 欄位")
    
    except Exception as e:
        print(f"❌ 資料庫遷移失敗: {e}")
    finally:
        conn.close()

def backup_database():
    """
    資料庫自動備份
    - 建立 backups/ 資料夾（若不存在）
    - 產生備份檔名：cases_YYYYMMDD_HHMMSS.db
    - 複製當前資料庫檔案
    - 自動清理：保留最新 30 個備份，刪除舊備份
    """
    # 檢查資料庫檔案是否存在
    if not os.path.exists(DB_NAME):
        print(f"⚠️ 資料庫檔案 {DB_NAME} 不存在，跳過備份")
        return None
    
    # 建立備份資料夾
    backup_dir = "backups"
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        print(f"✅ 已建立備份資料夾：{backup_dir}")
    
    # 產生備份檔名
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    backup_filename = f"cases_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)
    
    try:
        # 複製資料庫檔案
        shutil.copy2(DB_NAME, backup_path)
        print(f"✅ 資料庫備份成功：{backup_path}")
        
        # 自動清理：保留最新 30 個備份
        cleanup_old_backups(backup_dir, max_backups=30)
        
        return backup_path
    except Exception as e:
        print(f"❌ 資料庫備份失敗: {e}")
        return None

def cleanup_old_backups(backup_dir, max_backups=30):
    """
    清理舊備份檔案
    只保留最新的 max_backups 個備份，刪除最舊的
    """
    try:
        # 取得所有備份檔案
        backup_files = [
            os.path.join(backup_dir, f) 
            for f in os.listdir(backup_dir) 
            if f.startswith("cases_") and f.endswith(".db")
        ]
        
        # 如果備份數量超過上限
        if len(backup_files) > max_backups:
            # 按修改時間排序（最舊的在前）
            backup_files.sort(key=lambda x: os.path.getmtime(x))
            
            # 計算需要刪除的數量
            files_to_delete = backup_files[:len(backup_files) - max_backups]
            
            # 刪除舊備份
            for old_file in files_to_delete:
                os.remove(old_file)
                print(f"🗑️  已刪除舊備份：{os.path.basename(old_file)}")
            
            print(f"✅ 備份清理完成，保留最新 {max_backups} 個備份")
    except Exception as e:
        print(f"⚠️ 備份清理失敗: {e}")

def init_db():
    """初始化資料庫：建立案件資料表"""
    # 在初始化之前先備份現有資料庫（如果存在）
    backup_database()
    
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
            status TEXT DEFAULT '待分案',
            submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            review_notes TEXT,
            assigned_to TEXT,
            line_id TEXT,
            line_user_id TEXT
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
        ''', (case_id, name, email, phone, place_name, place_address, file_path, line_id, '待分案'))
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

def get_cases_by_assignee(username, status_filter=None):
    """取得指派給特定同仁的案件 (用於權限控管)"""
    conn = get_connection()
    c = conn.cursor()
    
    if status_filter and status_filter != "全部":
        c.execute('SELECT * FROM cases WHERE assigned_to = ? AND status = ? ORDER BY submission_date DESC', 
                  (username, status_filter))
    else:
        c.execute('SELECT * FROM cases WHERE assigned_to = ? ORDER BY submission_date DESC', 
                  (username,))
    
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
            # 1. 更新承辦人
            # 2. 如果狀態是 '待分案'，自動改為 '審核中'
            c.execute('''
                UPDATE cases 
                SET assigned_to = ?,
                    status = CASE WHEN status = '待分案' THEN '審核中' ELSE status END
                WHERE id = ?
            ''', (username, case_id))
            
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
