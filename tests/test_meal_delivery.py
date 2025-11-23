"""
社區送餐系統自動化邏輯測試
測試範圍：資料庫結構、排班認領邏輯、打卡紀錄
"""
import unittest
import sys
import os
import sqlite3
import datetime
import io

# 強制 stdout/stderr 使用 UTF-8 編碼
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 設定路徑以便導入模組
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# 嘗試導入 db_manager
try:
    import db_manager
except ImportError:
    print("❌ 無法導入 db_manager，請檢查路徑設定")
    sys.exit(1)

class TestMealDeliverySystem(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """測試開始前的準備工作"""
        print("\n" + "="*50)
        print("開始執行送餐系統邏輯測試")
        print("="*50)
        
        # 確保資料庫已初始化
        # 確保資料庫已初始化並執行遷移
        print("🔄 執行資料庫初始化與遷移...")
        db_manager.init_db()
            
    def setUp(self):
        """每個測試前的準備"""
        self.conn = db_manager.get_connection()
        self.cursor = self.conn.cursor()
        
    def tearDown(self):
        """每個測試後的清理"""
        self.conn.close()

    def test_1_database_structure(self):
        """測試 1: 資料庫結構檢查"""
        print("\n🧪 測試 1: 檢查資料庫結構...")
        
        # 檢查 elderly_profiles 表
        self.cursor.execute("PRAGMA table_info(elderly_profiles)")
        columns = {row['name'] for row in self.cursor.fetchall()}
        required_cols = {'id', 'name', 'address', 'diet_type', 'route_id', 'sequence'}
        
        missing = required_cols - columns
        self.assertTrue(len(missing) == 0, f"elderly_profiles 缺少欄位: {missing}")
        print("   ✅ elderly_profiles 表結構正確")
        
        # 檢查 delivery_records 表
        self.cursor.execute("PRAGMA table_info(delivery_records)")
        columns = {row['name'] for row in self.cursor.fetchall()}
        required_cols = {'id', 'task_id', 'elderly_id', 'status', 'photo_path', 'volunteer_id'}
        
        missing = required_cols - columns
        self.assertTrue(len(missing) == 0, f"delivery_records 缺少欄位: {missing}")
        print("   ✅ delivery_records 表結構正確")

    def test_2_task_assignment_logic(self):
        """測試 2: 排班與認領邏輯"""
        print("\n🧪 測試 2: 排班認領邏輯...")
        
        # 1. 建立測試路線
        route_id = db_manager.create_delivery_route(
            route_name="測試路線_A",
            description="自動化測試用"
        )
        self.assertTrue(route_id > 0, "建立路線失敗")
        
        # 2. 建立今日任務
        today = datetime.date.today().isoformat()
        task_id = db_manager.create_daily_task(
            date=today,
            route_id=route_id,
            assigned_volunteer=None  # 初始無人認領
        )
        self.assertTrue(task_id > 0, "建立任務失敗")
        
        # 3. 模擬認領 (更新 assigned_volunteer)
        test_user = "test_volunteer_001"
        db_manager.update_task_volunteer(task_id, test_user)
        
        # 4. 驗證
        self.cursor.execute("SELECT assigned_volunteer FROM daily_tasks WHERE id = ?", (task_id,))
        result = self.cursor.fetchone()
        self.assertEqual(result['assigned_volunteer'], test_user, "任務認領失敗：志工未更新")
        print(f"   ✅ 任務 {task_id} 成功指派給 {test_user}")
        
        # 清理測試資料
        self.cursor.execute("DELETE FROM daily_tasks WHERE id = ?", (task_id,))
        self.cursor.execute("DELETE FROM delivery_routes WHERE id = ?", (route_id,))
        self.conn.commit()

    def test_3_delivery_record_logic(self):
        """測試 3: 打卡紀錄邏輯"""
        print("\n🧪 測試 3: 打卡紀錄邏輯...")
        
        # 1. 準備測試資料
        route_id = db_manager.create_delivery_route("測試路線_B")
        elderly_id = db_manager.create_elderly_profile(
            name="測試長者", 
            address="測試地址", 
            phone="0900000000",
            route_id=route_id
        )
        task_id = db_manager.create_daily_task(
            date=datetime.date.today().isoformat(),
            route_id=route_id
        )
        
        # 2. 模擬打卡 (寫入紀錄)
        record_id = db_manager.create_delivery_record(
            task_id=task_id,
            elderly_id=elderly_id,
            status="已送達",
            notes="測試備註",
            photo_path="/tmp/test_photo.jpg"
        )
        self.assertTrue(record_id > 0, "建立打卡紀錄失敗")
        
        # 3. 驗證
        self.cursor.execute("SELECT * FROM delivery_records WHERE id = ?", (record_id,))
        record = self.cursor.fetchone()
        self.assertIsNotNone(record, "找不到打卡紀錄")
        self.assertEqual(record['status'], "已送達", "狀態錯誤")
        self.assertEqual(record['notes'], "測試備註", "備註錯誤")
        print(f"   ✅ 成功建立打卡紀錄 ID: {record_id}")
        
        # 驗證 check_delivery_status 函式
        is_delivered = db_manager.check_delivery_status(task_id, elderly_id)
        self.assertTrue(is_delivered, "check_delivery_status 判斷錯誤")
        print("   ✅ check_delivery_status 驗證通過")
        
        # 清理測試資料
        self.cursor.execute("DELETE FROM delivery_records WHERE id = ?", (record_id,))
        self.cursor.execute("DELETE FROM daily_tasks WHERE id = ?", (task_id,))
        self.cursor.execute("DELETE FROM elderly_profiles WHERE id = ?", (elderly_id,))
        self.cursor.execute("DELETE FROM delivery_routes WHERE id = ?", (route_id,))
        self.conn.commit()

if __name__ == '__main__':
    unittest.main(verbosity=2)
