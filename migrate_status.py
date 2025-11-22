"""
資料庫遷移腳本：將案件狀態 '待處理' 更名為 '待分案'
執行方式: python migrate_status.py
"""
import sqlite3
import sys
import os

def migrate_status():
    try:
        # 連接資料庫（使用與 db_manager.py 相同的路徑）
        db_path = os.path.join(os.path.dirname(__file__), 'cases.db')
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # 查詢現有「待處理」案件數量
        c.execute("SELECT COUNT(*) FROM cases WHERE status = '待處理'")
        count_before = c.fetchone()[0]
        
        print(f"📊 發現 {count_before} 筆「待處理」案件")
        
        if count_before == 0:
            print("✅ 沒有需要遷移的案件")
            conn.close()
            return
        
        # 執行更新
        c.execute("UPDATE cases SET status = '待分案' WHERE status = '待處理'")
        conn.commit()
        
        # 確認更新結果
        c.execute("SELECT COUNT(*) FROM cases WHERE status = '待分案'")
        count_after = c.fetchone()[0]
        
        print(f"✅ 成功將 {count_before} 筆案件狀態更新為「待分案」")
        print(f"📈 目前「待分案」案件總數：{count_after}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 遷移失敗: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 50)
    print("開始執行狀態遷移...")
    print("=" * 50)
    migrate_status()
    print("=" * 50)
    print("遷移完成！")
    print("=" * 50)
