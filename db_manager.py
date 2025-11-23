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
        
        # 重新取得欄位列表
        c.execute("PRAGMA table_info(cases)")
        columns = [column[1] for column in c.fetchall()]
        
        # 檢查 cases 表是否有 line_id 欄位（使用者自訂 ID）
        if 'line_id' not in columns:
            print("⚠️ 正在新增 line_id 欄位...")
            c.execute("ALTER TABLE cases ADD COLUMN line_id TEXT")
            conn.commit()
            print("✅ 已新增 line_id 欄位")
        
        # 重新取得欄位列表
        c.execute("PRAGMA table_info(cases)")
        columns = [column[1] for column in c.fetchall()]
        
        # 檢查 cases 表是否有 line_user_id 欄位（LINE Messaging API 用）
        if 'line_user_id' not in columns:
            print("⚠️ 正在新增 line_user_id 欄位（LINE Messaging API）...")
            c.execute("ALTER TABLE cases ADD COLUMN line_user_id TEXT")
            conn.commit()
            print("✅ 已新增 line_user_id 欄位")
        
        # 重新取得欄位列表
        c.execute("PRAGMA table_info(cases)")
        columns = [column[1] for column in c.fetchall()]
        
        # 檢查 cases 表是否有 is_archived 欄位（封存功能）
        if 'is_archived' not in columns:
            print("⚠️ 正在新增 is_archived 欄位（封存功能）...")
            c.execute("ALTER TABLE cases ADD COLUMN is_archived INTEGER DEFAULT 0")
            conn.commit()
            print("✅ 已新增 is_archived 欄位")

        # 檢查 elderly_profiles 表是否有 sequence 欄位
        c.execute("PRAGMA table_info(elderly_profiles)")
        columns = [column[1] for column in c.fetchall()]
        if columns and 'sequence' not in columns:
            print("⚠️ 正在新增 sequence 欄位 (elderly_profiles)...")
            c.execute("ALTER TABLE elderly_profiles ADD COLUMN sequence INTEGER DEFAULT 0")
            conn.commit()
            print("✅ 已新增 sequence 欄位")

        # 檢查 delivery_records 表是否有 volunteer_id 欄位
        c.execute("PRAGMA table_info(delivery_records)")
        columns = [column[1] for column in c.fetchall()]
        if columns and 'volunteer_id' not in columns:
            print("⚠️ 正在新增 volunteer_id 欄位 (delivery_records)...")
            c.execute("ALTER TABLE delivery_records ADD COLUMN volunteer_id TEXT")
            conn.commit()
            print("✅ 已新增 volunteer_id 欄位")

        # 檢查 delivery_records 表是否有 abnormal_reason 欄位
        c.execute("PRAGMA table_info(delivery_records)")
        columns = [column[1] for column in c.fetchall()]
        if columns and 'abnormal_reason' not in columns:
            print("⚠️ 正在新增 abnormal_reason 欄位 (delivery_records)...")
            c.execute("ALTER TABLE delivery_records ADD COLUMN abnormal_reason TEXT")
            conn.commit()
            print("✅ 已新增 abnormal_reason 欄位")
    
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

def archive_cases(case_ids):
    """
    封存指定案件
    
    Args:
        case_ids: 要封存的案件 ID 列表
    
    Returns:
        (success: bool, message: str)
    """
    if not case_ids:
        return False, "未選擇任何案件"
    
    conn = get_connection()
    c = conn.cursor()
    try:
        # 使用參數化查詢防止 SQL 注入
        placeholders = ','.join(['?' for _ in case_ids])
        c.execute(f"UPDATE cases SET is_archived = 1 WHERE id IN ({placeholders})", case_ids)
        conn.commit()
        return True, f"成功封存 {len(case_ids)} 筆案件"
    except Exception as e:
        return False, f"封存失敗: {e}"
    finally:
        conn.close()

def seed_meal_data():
    """若資料表為空，寫入測試資料"""
    conn = get_connection()
    c = conn.cursor()
    
    try:
        # Check if routes exist
        c.execute("SELECT count(*) FROM delivery_routes")
        if c.fetchone()[0] > 0:
            return

        print("🌱 正在寫入送餐系統測試資料...")
        
        # 1. Routes
        routes = [
            ("建和線", "建和社區方向", "admin"),
            ("溫泉線", "知本溫泉方向", "josh"),
            ("市區線", "台東市區", None)
        ]
        
        route_ids = []
        for name, desc, volunteer in routes:
            c.execute("INSERT INTO delivery_routes (route_name, description, default_volunteer_id) VALUES (?, ?, ?)", (name, desc, volunteer))
            route_ids.append(c.lastrowid)
        
        # 2. Elderly
        elderly_data = [
            ("張爺爺", "台東市建和路1號", "一般", route_ids[0], 1),
            ("李奶奶", "台東市建和路20號", "素食", route_ids[0], 2),
            ("王伯伯", "台東市溫泉路5號", "切碎", route_ids[1], 1),
            ("陳阿姨", "台東市溫泉路18號", "低鹽", route_ids[1], 2),
            ("林爺爺", "台東市中華路一段100號", "一般", route_ids[2], 1)
        ]
        
        for name, addr, diet, rid, seq in elderly_data:
            c.execute("INSERT INTO elderly_profiles (name, address, diet_type, route_id, sequence) VALUES (?, ?, ?, ?, ?)", (name, addr, diet, rid, seq))
            
        # 3. Today's Tasks
        today = datetime.date.today().strftime("%Y-%m-%d")
        
        # Create tasks for all routes
        for i, (name, desc, volunteer) in enumerate(routes):
            route_id = route_ids[i]
            # Use default volunteer if available
            assigned = volunteer
            c.execute("INSERT INTO daily_tasks (date, route_id, assigned_volunteer, status) VALUES (?, ?, ?, ?)", 
                      (today, route_id, assigned, "待執行"))
                      
        conn.commit()
        print("✅ 測試資料寫入完成")
    except Exception as e:
        print(f"❌ 寫入測試資料失敗: {e}")
    finally:
        conn.close()

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
            line_user_id TEXT,
            is_archived INTEGER DEFAULT 0
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
    
    # Create elderly_profiles table (送餐系統：長者資料)
    c.execute('''
        CREATE TABLE IF NOT EXISTS elderly_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            gps_lat REAL,
            gps_lon REAL,
            phone TEXT,
            diet_type TEXT,
            special_notes TEXT,
            route_id INTEGER,
            sequence INTEGER DEFAULT 0,
            status TEXT DEFAULT '啟用',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create delivery_routes table (送餐系統：送餐路線)
    c.execute('''
        CREATE TABLE IF NOT EXISTS delivery_routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_name TEXT NOT NULL,
            description TEXT,
            default_volunteer_id TEXT,
            num_stops INTEGER DEFAULT 0,
            estimated_time INTEGER DEFAULT 60,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create daily_tasks table (送餐系統：每日排班)
    c.execute('''
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            route_id INTEGER NOT NULL,
            assigned_volunteer TEXT,
            status TEXT DEFAULT '待執行',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (route_id) REFERENCES delivery_routes(id)
        )
    ''')
    
    # Create delivery_records table (送餐系統：送達紀錄)
    c.execute('''
        CREATE TABLE IF NOT EXISTS delivery_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            elderly_id INTEGER NOT NULL,
            delivery_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT '已送達',
            abnormal_reason TEXT,
            photo_path TEXT,
            notes TEXT,
            volunteer_id TEXT,
            FOREIGN KEY (task_id) REFERENCES daily_tasks(id),
            FOREIGN KEY (elderly_id) REFERENCES elderly_profiles(id)
        )
    ''')
    
    # Create museum_bookings table (防災館預約系統)
    c.execute('''
        CREATE TABLE IF NOT EXISTS museum_bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visit_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            applicant_name TEXT NOT NULL,
            applicant_phone TEXT NOT NULL,
            visitor_count INTEGER NOT NULL,
            organization TEXT,
            email TEXT,
            status TEXT DEFAULT '已預約',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    
    # Execute database migration for existing databases
    migrate_database()
    
    # Seed meal data if empty
    seed_meal_data()
    
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

def get_all_cases(status_filter=None, include_archived=False):
    """取得所有案件 (管理者用)"""
    conn = get_connection()
    c = conn.cursor()
    
    # 建構查詢條件
    if include_archived:
        # 只顯示已封存案件
        archived_condition = "is_archived = 1"
    else:
        # 預設只顯示未封存案件
        archived_condition = "is_archived = 0"
    
    if status_filter and status_filter != "全部":
        c.execute(f'SELECT * FROM cases WHERE {archived_condition} AND status = ? ORDER BY submission_date DESC', (status_filter,))
    else:
        c.execute(f'SELECT * FROM cases WHERE {archived_condition} ORDER BY submission_date DESC')
        
    cases = c.fetchall()
    conn.close()
    return cases

def get_cases_by_assignee(username, status_filter=None, include_archived=False):
    """取得指派給特定同仁的案件 (用於權限控管)"""
    conn = get_connection()
    c = conn.cursor()
    
    # 建構查詢條件
    if include_archived:
        # 只顯示已封存案件
        archived_condition = "is_archived = 1"
    else:
        # 預設只顯示未封存案件
        archived_condition = "is_archived = 0"
    
    if status_filter and status_filter != "全部":
        c.execute(f'SELECT * FROM cases WHERE assigned_to = ? AND {archived_condition} AND status = ? ORDER BY submission_date DESC', 
                  (username, status_filter))
    else:
        c.execute(f'SELECT * FROM cases WHERE assigned_to = ? AND {archived_condition} ORDER BY submission_date DESC', 
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

# ==========================================
# 送餐系統資料庫函式 (Meal Delivery System)
# ==========================================

# --- 長者資料管理 ---
def create_elderly_profile(name, address, phone, gps_lat=None, gps_lon=None, diet_type="", special_notes="", route_id=None, sequence=0):
    """建立長者資料"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO elderly_profiles (name, address, phone, gps_lat, gps_lon, diet_type, special_notes, route_id, sequence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (name, address, phone, gps_lat, gps_lon, diet_type, special_notes, route_id, sequence))
    elderly_id = c.lastrowid
    conn.commit()
    conn.close()
    return elderly_id

def get_all_elderly():
    """取得所有啟用中的長者資料"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM elderly_profiles WHERE status = "啟用" ORDER BY route_id, name')
    profiles = c.fetchall()
    conn.close()
    return profiles

def get_elderly_by_route(route_id):
    """取得特定路線的長者名單"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM elderly_profiles WHERE route_id = ? AND status = "啟用" ORDER BY id', (route_id,))
    profiles = c.fetchall()
    conn.close()
    return profiles

def update_elderly_profile_fields(profile_id, updates):
    """
    更新長者資料 (用於 st.data_editor)
    updates: dict, e.g. {'name': 'New Name', 'route_id': 2}
    """
    if not updates:
        return
        
    conn = get_connection()
    c = conn.cursor()
    
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values())
    values.append(profile_id)
    
    try:
        c.execute(f"UPDATE elderly_profiles SET {set_clause} WHERE id = ?", values)
        conn.commit()
    except Exception as e:
        print(f"Error updating profile: {e}")
    finally:
        conn.close()

def delete_elderly_profile(profile_id):
    """刪除長者資料 (軟刪除)"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE elderly_profiles SET status = "停用" WHERE id = ?', (profile_id,))
    conn.commit()
    conn.close()

# --- 送餐路線管理 ---
def create_delivery_route(route_name, description="", default_volunteer_id=None):
    """建立送餐路線"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO delivery_routes (route_name, description, default_volunteer_id)
        VALUES (?, ?, ?)
    ''', (route_name, description, default_volunteer_id))
    route_id = c.lastrowid
    conn.commit()
    conn.close()
    return route_id

def get_all_routes():
    """取得所有路線"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM delivery_routes ORDER BY route_name')
    routes = c.fetchall()
    conn.close()
    return routes

def update_route_stop_count(route_id):
    """更新路線的站點數量"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT COUNT(*) FROM elderly_profiles WHERE route_id = ? AND status = "啟用"', (route_id,))
    count = c.fetchone()[0]
    c.execute('UPDATE delivery_routes SET num_stops = ? WHERE id = ?', (count, route_id))
    conn.commit()
    conn.close()

# --- 每日任務管理 ---
def create_daily_task(date, route_id, assigned_volunteer=None):
    """建立每日送餐任務"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO daily_tasks (date, route_id, assigned_volunteer, status)
        VALUES (?, ?, ?, "待執行")
    ''', (date, route_id, assigned_volunteer))
    task_id = c.lastrowid
    conn.commit()
    conn.close()
    return task_id

def get_tasks_by_date(date):
    """取得特定日期的所有任務"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT dt.*, dr.route_name, dr.num_stops
        FROM daily_tasks dt
        JOIN delivery_routes dr ON dt.route_id = dr.id
        WHERE dt.date = ?
        ORDER BY dr.route_name
    ''', (date,))
    tasks = c.fetchall()
    conn.close()
    return tasks

def get_tasks_by_date_range(start_date, end_date):
    """取得指定日期範圍內的所有任務 (用於行事曆)"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT dt.*, dr.route_name, dr.description
        FROM daily_tasks dt
        JOIN delivery_routes dr ON dt.route_id = dr.id
        WHERE dt.date BETWEEN ? AND ?
        ORDER BY dt.date, dr.route_name
    ''', (start_date, end_date))
    tasks = c.fetchall()
    conn.close()
    return tasks

def get_my_tasks_today(username, date):
    """取得當前使用者今日的任務"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT dt.*, dr.route_name, dr.num_stops
        FROM daily_tasks dt
        JOIN delivery_routes dr ON dt.route_id = dr.id
        WHERE dt.assigned_volunteer = ? AND dt.date = ?
    ''', (username, date))
    tasks = c.fetchall()
    conn.close()
    return tasks

def update_task_volunteer(task_id, new_volunteer):
    """更改任務的志工"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE daily_tasks SET assigned_volunteer = ? WHERE id = ?', (new_volunteer, task_id))
    conn.commit()
    conn.close()

def update_task_status(task_id, status):
    """更新任務狀態"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('UPDATE daily_tasks SET status = ? WHERE id = ?', (status, task_id))
    conn.commit()
    conn.close()

def claim_task(task_id, username):
    """認領任務 (包裝器函式供測試使用)"""
    update_task_volunteer(task_id, username)

def release_task(task_id):
    """釋出任務 (包裝器函式供測試使用)"""
    update_task_volunteer(task_id, None)

def get_task_events(start_date, end_date, current_user=None):
    """
    獲取日曆事件格式的任務資料 (用於streamlit-calendar)
    
    Args:
        start_date: 開始日期 (YYYY-MM-DD)
        end_date: 結束日期 (YYYY-MM-DD)
        current_user: 當前使用者帳號 (用於顏色區分), 可為 None
        
    Returns:
        list: 日曆事件列表, 每個事件包含 title, start, backgroundColor 等欄位
    """
    tasks = get_tasks_by_date_range(start_date, end_date)
    events = []
    
    for task in tasks:
        volunteer = task['assigned_volunteer']
        route_name = task['route_name']
        task_date = task['date']
        task_id = task['id']
        
        # 顏色邏輯
        if not volunteer:
            # 缺人 -> 紅色
            color = "#FF4B4B"
            title = f"🔴 {route_name} (缺人)"
        elif current_user and volunteer == current_user:
            # 自己 -> 綠色
            color = "#3DD598"
            title = f"🟢 {route_name} (我)"
        else:
            # 別人 -> 藍色
            color = "#3788d8" 
            title = f"👤 {route_name} ({volunteer})"
            
        events.append({
            "title": title,
            "start": task_date,
            "allDay": True,
            "backgroundColor": color,
            "borderColor": color,
            "extendedProps": {
                "taskId": task_id,
                "currentVolunteer": volunteer,
                "routeId": task['route_id'],
                "routeName": route_name
            }
        })
        
    return events

# --- 送達紀錄管理 ---
def create_delivery_record(task_id, elderly_id, status="已送達", notes="", photo_path=None, volunteer_id=None, abnormal_reason=None):
    """建立送達紀錄"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO delivery_records (task_id, elderly_id, status, notes, photo_path, volunteer_id, abnormal_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (task_id, elderly_id, status, notes, photo_path, volunteer_id, abnormal_reason))
    record_id = c.lastrowid
    conn.commit()
    conn.close()
    return record_id

def get_delivery_records_by_task(task_id):
    """取得特定任務的所有送達紀錄"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT dr.*, ep.name as elderly_name, ep.address
        FROM delivery_records dr
        JOIN elderly_profiles ep ON dr.elderly_id = ep.id
        WHERE dr.task_id = ?
        ORDER BY dr.delivery_time
    ''', (task_id,))
    records = c.fetchall()
    conn.close()
    return records

def check_delivery_status(task_id, elderly_id):
    """檢查是否已送達"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT id FROM delivery_records WHERE task_id = ? AND elderly_id = ?', (task_id, elderly_id))
    record = c.fetchone()
    conn.close()
    return record is not None

def get_delivery_reports(start_date, end_date):
    """
    取得送餐報表
    Returns: list of dicts (Date, Route, Elderly, Volunteer, Status, Notes, Photo)
    """
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT 
            dt.date,
            dr.route_name,
            ep.name as elderly_name,
            rec.volunteer_id,
            rec.status,
            rec.abnormal_reason,
            rec.notes,
            rec.photo_path,
            rec.delivery_time
        FROM delivery_records rec
        JOIN daily_tasks dt ON rec.task_id = dt.id
        JOIN elderly_profiles ep ON rec.elderly_id = ep.id
        JOIN delivery_routes dr ON dt.route_id = dr.id
        WHERE dt.date BETWEEN ? AND ?
        ORDER BY dt.date DESC, dr.route_name, ep.sequence
    ''', (start_date, end_date))
    
    rows = c.fetchall()
    conn.close()
    return rows

# ==========================================
# 防災館預約系統資料庫函式 (Museum Booking System)
# ==========================================

def create_museum_booking(visit_date, time_slot, applicant_name, applicant_phone, visitor_count, organization="", email=""):
    """建立防災館參觀預約"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO museum_bookings (visit_date, time_slot, applicant_name, applicant_phone, visitor_count, organization, email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (visit_date, time_slot, applicant_name, applicant_phone, visitor_count, organization, email))
    booking_id = c.lastrowid
    conn.commit()
    conn.close()
    return booking_id

def get_bookings_by_date(visit_date):
    """取得特定日期的所有預約"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM museum_bookings WHERE visit_date = ? AND status != "已取消" ORDER BY time_slot', (visit_date,))
    bookings = c.fetchall()
    conn.close()
    return bookings

def get_bookings_by_phone(phone):
    """依電話號碼查詢預約記錄"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM museum_bookings WHERE applicant_phone = ? ORDER BY visit_date DESC, time_slot', (phone,))
    bookings = c.fetchall()
    conn.close()
    return bookings

def get_booking_count_by_slot(visit_date, time_slot):
    """取得特定時段的預約人數總計"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        SELECT COALESCE(SUM(visitor_count), 0) as total_count
        FROM museum_bookings
        WHERE visit_date = ? AND time_slot = ? AND status != "已取消"
    ''', (visit_date, time_slot))
    result = c.fetchone()
    conn.close()
    return result['total_count'] if result else 0

def cancel_museum_booking(booking_id):
    """取消預約"""
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        UPDATE museum_bookings
        SET status = "已取消"
        WHERE id = ?
    ''', (booking_id,))
    conn.commit()
    success = c.rowcount > 0
    conn.close()
    return success
