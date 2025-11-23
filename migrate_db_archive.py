import sqlite3
import os

DB_NAME = "cases.db"

def migrate_add_is_archived():
    """
    為 cases 表新增 is_archived 欄位
    用於支援案件封存功能
    """
    if not os.path.exists(DB_NAME):
        print(f"❌ 資料庫檔案 {DB_NAME} 不存在！")
        return False
    
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        
        # 檢查欄位是否已存在
        c.execute("PRAGMA table_info(cases)")
        columns = [column[1] for column in c.fetchall()]
        
        if 'is_archived' in columns:
            print("✅ is_archived 欄位已存在，無需遷移")
            return True
        
        # 新增欄位
        print("⚠️ 正在新增 is_archived 欄位...")
        c.execute("ALTER TABLE cases ADD COLUMN is_archived INTEGER DEFAULT 0")
        conn.commit()
        print("✅ 成功新增 is_archived 欄位！")
        
        # 驗證欄位已新增
        c.execute("PRAGMA table_info(cases)")
        columns_after = [column[1] for column in c.fetchall()]
        
        if 'is_archived' in columns_after:
            print("✅ 驗證通過：is_archived 欄位已成功加入資料庫")
            return True
        else:
            print("❌ 驗證失敗：欄位未成功加入")
            return False
            
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("✅ is_archived 欄位已存在（通過例外捕獲確認）")
            return True
        else:
            print(f"❌ 資料庫操作錯誤: {e}")
            return False
    except Exception as e:
        print(f"❌ 未預期的錯誤: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("📁 資料庫連線已關閉")

if __name__ == "__main__":
    print("=" * 50)
    print("案件封存功能 - 資料庫遷移腳本")
    print("=" * 50)
    print(f"目標資料庫: {DB_NAME}")
    print()
    
    success = migrate_add_is_archived()
    
    print()
    print("=" * 50)
    if success:
        print("✅ 遷移完成！您現在可以重新啟動系統。")
    else:
        print("❌ 遷移失敗，請檢查錯誤訊息。")
    print("=" * 50)
