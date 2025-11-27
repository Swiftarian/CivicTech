import sys
import os
import py_compile
import tempfile
import logging
import io

# 強制 stdout/stderr 使用 UTF-8 編碼
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 將當前工作目錄加入 sys.path (假設從專案根目錄執行)
if os.getcwd() not in sys.path:
    sys.path.insert(0, os.getcwd())

# 另外也嘗試加入 tests 的上一層目錄
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

print(f"DEBUG: sys.path[0]: {sys.path[0]}")

# ... (logging setup) ...

# ==========================================
# 測試 7: 設定檔測試
# ==========================================

def test_config_files():
    """檢查設定檔是否存在且可讀取"""
    import config_loader as cfg
    
    # 測試讀取設定
    try:
        # 檢查 CONFIG 字典是否存在
        if not hasattr(cfg, 'CONFIG'):
            raise AssertionError("config_loader 缺少 CONFIG 變數")
            
        config = cfg.CONFIG
        
        # 檢查關鍵設定
        assert "agency" in config, "缺少 agency 設定"
        assert "system" in config, "缺少 system 設定"
        
        print(f"   Agency: {config['agency'].get('name', 'Unknown')}")
        
    except Exception as e:
        raise AssertionError(f"設定檔讀取失敗: {e}")

# 設定日誌
logging.basicConfig(
    filename='tests/test_result.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)

# ==========================================
# 測試輔助函式
# ==========================================

def run_test(test_name, test_func):
    """執行單個測試並捕獲錯誤"""
    try:
        print(f"\n🧪 {test_name}...")
        logging.info(f"Starting test: {test_name}")
        test_func()
        print(f"✅ {test_name} - 通過")
        logging.info(f"Test passed: {test_name}")
        return True
    except AssertionError as e:
        print(f"❌ {test_name} - 失敗")
        print(f"   錯誤: {e}")
        logging.error(f"Test failed: {test_name} - {e}")
        return False
    except Exception as e:
        print(f"❌ {test_name} - 異常")
        print(f"   異常: {type(e).__name__}: {e}")
        logging.error(f"Test exception: {test_name} - {type(e).__name__}: {e}")
        return False

# ==========================================
# 測試 1: Python 語法檢查
# ==========================================

def test_python_syntax():
    """檢查所有 Python 檔案的語法是否正確"""
    files_to_check = [
        "Home.py",
        "db_manager.py",
        "utils.py",
        "auth.py",
        "config_loader.py",
    ]
    
    for filepath in files_to_check:
        if not os.path.exists(filepath):
            continue
        
        try:
            py_compile.compile(filepath, doraise=True)
        except py_compile.PyCompileError as e:
            raise AssertionError(f"{filepath} 語法錯誤: {e}")
    
    print(f"   已檢查 {len(files_to_check)} 個核心檔案")

# ==========================================
# 測試 2: 核心模組導入測試
# ==========================================

def test_core_imports():
    """測試核心模組是否可以正常導入"""
    modules = [
        ("db_manager", "資料庫管理"),
        ("utils", "工具函式"),
        ("auth", "認證系統"),
        ("config_loader", "設定載入"),
    ]
    
    imported = 0
    for module_name, description in modules:
        try:
            __import__(module_name)
            imported += 1
        except ImportError as e:
            raise AssertionError(f"{description} 模組導入失敗: {e}")
    
    print(f"   成功導入 {imported} 個核心模組")

# ==========================================
# 測試 3: 資料庫連線測試
# ==========================================

def test_database_connection():
    """測試資料庫連線是否正常"""
    import db_manager
    
    # 測試連線
    conn = db_manager.get_connection()
    assert conn is not None, "資料庫連線失敗"
    conn.close()
    
    # 測試基本查詢
    cases = db_manager.get_all_cases()
    assert isinstance(cases, list), "查詢結果格式錯誤"
    
    print(f"   資料庫查詢返回 {len(cases)} 筆案件")

# ==========================================
# 測試 4: 資料庫表結構測試
# ==========================================

def test_database_tables():
    """檢查所有必要的資料表是否存在"""
    import db_manager
    
    conn = db_manager.get_connection()
    cursor = conn.cursor()
    
    # 檢查必要的表
    required_tables = [
        "cases",
        "users",
        "audit_logs",
        "elderly_profiles",
        "delivery_routes",
        "daily_tasks",
        "delivery_records",
        "museum_bookings",
    ]
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing_tables = [row[0] for row in cursor.fetchall()]
    
    missing_tables = []
    for table in required_tables:
        if table not in existing_tables:
            missing_tables.append(table)
    
    conn.close()
    
    assert len(missing_tables) == 0, f"缺少資料表: {', '.join(missing_tables)}"
    
    print(f"   確認 {len(required_tables)} 個資料表存在")

# ==========================================
# 測試 5: 資料庫 CRUD 函式測試
# ==========================================

def test_database_crud_functions():
    """測試資料庫 CRUD 函式是否存在"""
    import db_manager
    
    # 檢查送餐系統函式
    meal_functions = [
        "create_elderly_profile",
        "get_all_elderly",
        "get_elderly_by_route",
        "create_delivery_route",
        "get_all_routes",
        "create_daily_task",
        "get_tasks_by_date",
        "get_my_tasks_today",
        "create_delivery_record",
    ]
    
    # 檢查防災館函式
    museum_functions = [
        "create_museum_booking",
        "get_bookings_by_date",
        "get_bookings_by_phone",
        "get_booking_count_by_slot",
        "cancel_museum_booking",
    ]
    
    all_functions = meal_functions + museum_functions
    
    missing_functions = []
    for func_name in all_functions:
        if not hasattr(db_manager, func_name):
            missing_functions.append(func_name)
        elif not callable(getattr(db_manager, func_name)):
            missing_functions.append(f"{func_name} (不可呼叫)")
    
    assert len(missing_functions) == 0, f"缺少函式: {', '.join(missing_functions)}"
    
    print(f"   確認 {len(all_functions)} 個 CRUD 函式存在")

# ==========================================
# 測試 6: 頁面檔案存在性測試
# ==========================================

def test_page_files_exist():
    """檢查所有頁面檔案是否存在"""
    pages = [
        ("Home.py", "平台入口"),
        ("pages/1_🚒_消防檢修申報.py", "消防申報系統"),
        ("pages/2_🍱_社區互助送餐.py", "送餐系統"),
        ("pages/3_📢_防災智慧導覽.py", "防災館導覽"),
        ("pages/3_案件審核.py", "案件審核"),
        ("pages/4_自動比對系統.py", "自動比對"),
    ]
    
    missing_files = []
    for rel_path, description in pages:
        # 使用專案根目錄組合絕對路徑
        full_path = os.path.join(project_root, rel_path)
        
        if not os.path.exists(full_path):
            # 嘗試替代路徑（反斜線）
            alt_path = full_path.replace("/", "\\")
            if not os.path.exists(alt_path):
                missing_files.append(f"{description} ({rel_path})")
    
    assert len(missing_files) == 0, f"缺少頁面: {', '.join(missing_files)}"
    
    print(f"   確認 {len(pages)} 個頁面檔案存在")

# ==========================================
# 測試 7: 設定檔測試
# ==========================================

def test_config_files():
    """檢查設定檔是否存在且可讀取"""
    import config_loader as cfg
    
    # 測試讀取設定
    try:
        tesseract_path = cfg.get_tesseract_path()
        excel_path = cfg.get_excel_path()
        
        # 不要求這些檔案必須存在，只要能讀取設定即可
        print(f"   Tesseract: {tesseract_path}")
        print(f"   Excel: {excel_path}")
        
    except Exception as e:
        raise AssertionError(f"設定檔讀取失敗: {e}")

# ==========================================
# 主執行函式
# ==========================================

if __name__ == "__main__":
    print("=" * 70)
    print("臺東縣消防局公私協力防災媒合平台 - 自動化測試（簡化版）")
    print("=" * 70)
    print("\n注意：此測試不包含完整頁面渲染測試（AppTest 不相容 emoji 檔名）")
    print("測試範圍：語法檢查、模組導入、資料庫功能、檔案存在性\n")
    
    # 測試列表
    tests = [
        ("Python 語法檢查", test_python_syntax),
        ("核心模組導入", test_core_imports),
        ("資料庫連線", test_database_connection),
        ("資料庫表結構", test_database_tables),
        ("資料庫 CRUD 函式", test_database_crud_functions),
        ("頁面檔案存在性", test_page_files_exist),
        ("設定檔讀取", test_config_files),
    ]
    
    # 執行所有測試
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        if run_test(test_name, test_func):
            passed += 1
        else:
            failed += 1
    
    # 輸出結果
    print("\n" + "=" * 70)
    if failed == 0:
        print(f"🎉 所有測試通過！✅ 通過: {passed} | ❌ 失敗: {failed}")
    else:
        print(f"⚠️ 部分測試失敗！✅ 通過: {passed} | ❌ 失敗: {failed}")
    print("=" * 70)
    
    # 返回退出碼
    sys.exit(0 if failed == 0 else 1)
