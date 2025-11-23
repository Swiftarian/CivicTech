"""
社區送餐系統後端邏輯測試
測試範圍：種子資料、日曆事件格式、排班認領邏輯
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

# 導入 db_manager
try:
    import db_manager
except ImportError:
    print("❌ 無法導入 db_manager，請檢查路徑設定")
    sys.exit(1)

class TestMealBackend(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """測試開始前的準備工作"""
        print("\n" + "="*50)
        print("開始執行送餐系統後端邏輯測試")
        print("="*50)
        
        # 初始化資料庫
        print("🔄 執行資料庫初始化...")
        db_manager.init_db()
            
    def setUp(self):
        """每個測試前的準備"""
        self.conn = db_manager.get_connection()
        self.cursor = self.conn.cursor()
        
    def tearDown(self):
        """每個測試後的清理"""
        self.conn.close()

    def test_1_seed_data(self):
        """測試 1: 測試資料種子"""
        print("\n🧪 測試 1: 檢查種子資料...")
        
        # 檢查路線是否有資料
        self.cursor.execute("SELECT COUNT(*) FROM delivery_routes")
        route_count = self.cursor.fetchone()[0]
        self.assertGreater(route_count, 0, "delivery_routes 表應該有資料")
        print(f"   ✅ 路線數量: {route_count}")
        
        # 檢查今日任務是否有產生
        today = datetime.date.today().strftime("%Y-%m-%d")
        self.cursor.execute("SELECT COUNT(*) FROM daily_tasks WHERE date = ?", (today,))
        task_count = self.cursor.fetchone()[0]
        self.assertGreater(task_count, 0, "今日應該有排班任務")
        print(f"   ✅ 今日任務數量: {task_count}")

    def test_2_calendar_event_format(self):
        """測試 2: 日曆事件格式"""
        print("\n🧪 測試 2: 日曆事件格式...")
        
        # 取得事件
        today = datetime.date.today()
        start_date = (today - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (today + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
        
        events = db_manager.get_task_events(start_date, end_date, current_user="admin")
        
        # 驗證格式
        self.assertIsInstance(events, list, "應該返回列表")
        
        if len(events) > 0:
            event = events[0]
            # 檢查必要欄位
            required_fields = ["title", "start", "backgroundColor", "extendedProps"]
            for field in required_fields:
                self.assertIn(field, event, f"事件應該包含 {field} 欄位")
            
            # 檢查 extendedProps
            props = event["extendedProps"]
            self.assertIn("taskId", props, "extendedProps 應該包含 taskId")
            self.assertIn("routeName", props, "extendedProps 應該包含 routeName")
            
            print(f"   ✅ 事件數量: {len(events)}")
            print(f"   ✅ 事件格式正確: {event['title']}")
        else:
            print("   ⚠️ 沒有事件資料 (可能正常)")

    def test_3_claim_release_logic(self):
        """測試 3: 認領與釋出邏輯"""
        print("\n🧪 測試 3: 認領與釋出邏輯...")
        
        # 1. 建立測試路線和任務
        route_id = db_manager.create_delivery_route("測試路線_Backend")
        today = datetime.date.today().strftime("%Y-%m-%d")
        task_id = db_manager.create_daily_task(today, route_id, assigned_volunteer=None)
        
        # 2. 確認初始狀態：無人認領
        self.cursor.execute("SELECT assigned_volunteer FROM daily_tasks WHERE id = ?", (task_id,))
        result = self.cursor.fetchone()
        self.assertIsNone(result['assigned_volunteer'], "初始狀態應該無人認領")
        print("   ✅ 初始狀態: 無人認領")
        
        # 3. 認領任務
        test_user = "Josh2"
        db_manager.claim_task(task_id, test_user)
        
        # 驗證
        self.cursor.execute("SELECT assigned_volunteer FROM daily_tasks WHERE id = ?", (task_id,))
        result = self.cursor.fetchone()
        self.assertEqual(result['assigned_volunteer'], test_user, f"應該被 {test_user} 認領")
        print(f"   ✅ 認領成功: {test_user}")
        
        # 4. 釋出任務
        db_manager.release_task(task_id)
        
        # 驗證
        self.cursor.execute("SELECT assigned_volunteer FROM daily_tasks WHERE id = ?", (task_id,))
        result = self.cursor.fetchone()
        self.assertIsNone(result['assigned_volunteer'], "釋出後應該變回 None")
        print("   ✅ 釋出成功: 已變回無人認領")
        
        # 清理測試資料
        self.cursor.execute("DELETE FROM daily_tasks WHERE id = ?", (task_id,))
        self.cursor.execute("DELETE FROM delivery_routes WHERE id = ?", (route_id,))
        self.conn.commit()

if __name__ == '__main__':
    unittest.main(verbosity=2)
