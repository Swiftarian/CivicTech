"""
📧 Email 發送測試腳本
用於診斷 Gmail SMTP 郵件發送問題
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import sys
import os

# Get the parent directory (fire_dept_automation root)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_email_connection():
    """測試 SMTP 連線與郵件發送"""

    print("=" * 60)
    print("📧 Email 發送診斷工具")
    print("=" * 60)

    # 1. 檢查 secrets.toml 檔案
    secrets_path = os.path.join(base_dir, ".streamlit/secrets.toml")

    if not os.path.exists(secrets_path):
        print(f"\n❌ 找不到 secrets.toml")
        print("請確認 .streamlit/secrets.toml 檔案存在")
        return False

    print(f"\n✅ 找到 secrets.toml")

    # 2. 讀取 secrets.toml (手動解析)
    sender_email = None
    sender_password = None

    try:
        with open(secrets_path, "r", encoding="utf-8") as f:
            content = f.read()

            # 簡單解析 (不用 toml 庫)
            in_email_section = False
            for line in content.split("\n"):
                line = line.strip()

                if line == "[email]":
                    in_email_section = True
                    continue
                elif line.startswith("[") and line != "[email]":
                    in_email_section = False
                    continue

                if in_email_section:
                    if line.startswith("sender_email"):
                        sender_email = line.split("=")[1].strip().strip('"').strip("'")
                    elif line.startswith("sender_password"):
                        sender_password = line.split("=")[1].strip().strip('"').strip("'")

        if not sender_email:
            print("\n❌ secrets.toml 中找不到 sender_email 設定")
            return False

        if not sender_password:
            print("\n❌ secrets.toml 中找不到 sender_password 設定")
            return False

        # Security: Only confirm credentials are configured, never log any part of them
        print(f"✅ 寄件者帳號: 已設定 ({len(sender_email)} 字元)")
        print(f"✅ 應用程式密碼: 已設定 ({len(sender_password)} 字元)")

    except Exception as e:
        print(f"\n❌ 讀取 secrets.toml 失敗: {e}")
        return False

    # 3. 測試 SMTP 連線
    print("\n📡 測試 Gmail SMTP 連線中...")

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
        print("✅ SMTP_SSL 連線成功 (smtp.gmail.com:465)")

        # 嘗試登入
        print("\n🔐 嘗試登入...")
        server.login(sender_email, sender_password)
        print("✅ 登入成功！帳號與密碼正確。")

        server.quit()

    except smtplib.SMTPAuthenticationError as e:
        print(f"\n❌ 登入失敗！Gmail 驗證錯誤")
        print(f"   錯誤碼: {e.smtp_code}")
        print(f"   錯誤訊息: {e.smtp_error.decode('utf-8', errors='ignore')}")
        print("\n💡 可能原因：")
        print("   1. 應用程式密碼已過期或無效")
        print("   2. 帳號未啟用「兩步驟驗證」（必須先啟用才能產生應用程式專用密碼）")
        print("   3. 密碼輸入錯誤（應使用 16 位數應用程式密碼，非 Gmail 登入密碼）")
        print("\n🔧 解決方式：")
        print("   1. 前往 https://myaccount.google.com/apppasswords")
        print("   2. 產生新的應用程式專用密碼")
        print("   3. 更新 .streamlit/secrets.toml 中的 sender_password")
        return False

    except smtplib.SMTPConnectError as e:
        print(f"\n❌ SMTP 連線失敗: {e}")
        print("可能原因：網路問題或防火牆阻擋")
        return False

    except Exception as e:
        print(f"\n❌ 未知錯誤: {e}")
        return False

    # 4. 發送測試郵件
    print("\n" + "=" * 60)
    test_email = input("請輸入測試收件者 Email（發送測試郵件）: ").strip()

    if not test_email:
        print("已跳過測試郵件發送")
        return True

    print(f"\n📧 正在發送測試郵件至 {test_email}...")

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = test_email
        msg['Subject'] = "【消防局系統】Email 發送測試 ✅"

        body = """
        <html>
        <body style="font-family: Microsoft JhengHei, sans-serif;">
            <h2>🔥 Email 發送測試成功！</h2>
            <p>如果您收到這封信，代表消防局系統的郵件功能運作正常。</p>
            <hr>
            <p style="color: #666;">此為系統測試信件，請忽略。</p>
        </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()

        print("\n✅ 測試郵件發送成功！")
        print(f"   請檢查 {test_email} 的收件匣（含垃圾郵件匣）")
        return True

    except Exception as e:
        print(f"\n❌ 測試郵件發送失敗: {e}")
        return False


if __name__ == "__main__":
    print("\n")
    result = test_email_connection()
    print("\n" + "=" * 60)
    if result:
        print("🎉 診斷完成：Email 系統運作正常")
    else:
        print("⚠️  診斷完成：發現問題，請依上方說明修正")
    print("=" * 60)
    input("\n按 Enter 鍵結束...")
