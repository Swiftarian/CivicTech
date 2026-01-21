import sqlite3
import hashlib
import os
import secrets

# 設定資料庫名稱
DB_NAME = "cases.db"

# 設定要重設的目標資訊
TARGET_USERNAME = "admin"
# 從環境變數讀取，若無則動態生成安全的臨時密碼
NEW_PASSWORD = os.environ.get("ADMIN_RESET_PASSWORD") or secrets.token_urlsafe(12)
NEW_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")

def hash_password_pbkdf2(password, salt=None):
    """使用 PBKDF2-HMAC-SHA256 加密密碼（與 auth.py 完全相同）"""
    if salt is None:
        salt = os.urandom(32)  # 生成新的 salt
    else:
        # 確保 salt 是 bytes
        if isinstance(salt, str):
            salt = bytes.fromhex(salt)

    # PBKDF2 with SHA256, 100,000 iterations
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        100000
    )

    # 返回 salt 和 hash 的 hex 字串
    return salt.hex(), pwd_hash.hex()

def force_reset_admin():
    print(f"🚀 開始強制重設帳號 [{TARGET_USERNAME}]...")

    # 1. 使用正確的 PBKDF2 加密（與 auth.py 一致）
    salt_hex, password_hash = hash_password_pbkdf2(NEW_PASSWORD)
    print(f"✅ 已生成 PBKDF2 密碼雜湊")

    # 2. 連接資料庫
    if not os.path.exists(DB_NAME):
        print(f"❌ 錯誤：找不到資料庫檔案 {DB_NAME}，請確認您在正確的資料夾執行。")
        return

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    try:
        # 檢查 users 表
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        if not c.fetchone():
            print("❌ 錯誤：資料庫中沒有 'users' 資料表。")
            return

        # 檢查 admin 是否存在
        c.execute("SELECT * FROM users WHERE username = ?", (TARGET_USERNAME,))
        user = c.fetchone()

        if user:
            # 更新：包含 password_salt 和 password_hash
            c.execute("""
                UPDATE users
                SET password_hash = ?, password_salt = ?, email = ?
                WHERE username = ?
            """, (password_hash, salt_hex, NEW_EMAIL, TARGET_USERNAME))
            print(f"✅ 帳號 '{TARGET_USERNAME}' 資料強制覆寫成功！")
        else:
            # 建立新帳號
            print(f"⚠️ 帳號 '{TARGET_USERNAME}' 不存在，正在建立新帳號...")
            c.execute("""
                INSERT INTO users (username, password_hash, password_salt, email, role, created_at)
                VALUES (?, ?, ?, ?, 'admin', datetime('now'))
            """, (TARGET_USERNAME, password_hash, salt_hex, NEW_EMAIL))
            print(f"✅ 新帳號 '{TARGET_USERNAME}' 建立成功！")

        conn.commit()
        print("-" * 50)
        print(f"📧 Email 已更新為: {NEW_EMAIL}")
        print(f"🔑 密碼已重設 (check script constants for value)")
        print("-" * 50)
        print("✅ 重設完成！帳號可以登入了。")
        print(f"   帳號: {TARGET_USERNAME}")
        print(f"   (密碼請參考腳本中的常數設定)")
        print("-" * 50)

    except Exception as e:
        print(f"❌ 資料庫操作失敗: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    force_reset_admin()
