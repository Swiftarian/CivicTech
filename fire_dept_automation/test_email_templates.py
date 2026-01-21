"""
郵件模板測試與預覽工具

此腳本用於測試 utils.py 中的 generate_email_html 函式，
並生成 HTML 預覽檔案，方便檢查郵件顯示效果。
"""

import sys
import os

# 將專案目錄加入路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import utils

def save_html_preview(filename, html_content):
    """儲存 HTML 到檔案供預覽"""
    preview_dir = "email_previews"
    if not os.path.exists(preview_dir):
        os.makedirs(preview_dir)

    filepath = os.path.join(preview_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"✅ 已生成: {filepath}")
    return filepath

def test_2fa_email():
    """測試 2FA 驗證碼郵件"""
    print("\n📧 測試 2FA 驗證碼郵件...")

    content = """
<p>您正在嘗試登入消防局案件審核系統，為確保帳號安全，請輸入以下驗證碼完成登入：</p>
<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #d97706; border-radius: 4px;">
    <p style="margin: 0; color: #856404; font-size: 14px;">
        <strong>⚠️ 安全提醒</strong><br>
        • 驗證碼將於 <strong>10 分鐘</strong>後失效<br>
        • 若非本人操作，請立即通知管理員<br>
        • 切勿將驗證碼提供給他人
    </p>
</div>
"""

    html = utils.generate_email_html(
        title="安全登入驗證",
        recipient_name="測試帳號",
        content_html=content,
        highlight_info="123456",
        color_theme="#1a365d"
    )

    return save_html_preview("1_2fa_verification.html", html)

def test_password_reset_email():
    """測試重設密碼郵件"""
    print("\n🔑 測試重設密碼郵件...")

    content = """
<p>您的帳號密碼已重設，系統已為您生成一組臨時密碼。</p>
<p style="margin-top: 15px;">請使用下方臨時密碼登入系統，並於登入後<strong>立即修改密碼</strong>以確保帳號安全。</p>
<div style="margin-top: 20px; padding: 15px; background-color: #fee; border-left: 4px solid #e53e3e; border-radius: 4px;">
    <p style="margin: 0; color: #c53030; font-size: 14px;">
        <strong>🔐 安全建議</strong><br>
        • 登入後請立即至「修改密碼」功能變更密碼<br>
        • 請設定包含英文、數字的強密碼<br>
        • 切勿與他人分享您的密碼
    </p>
</div>
"""

    html = utils.generate_email_html(
        title="重設密碼通知",
        recipient_name="測試帳號",
        content_html=content,
        highlight_info="abc123xyz",
        color_theme="#e53e3e"
    )

    return save_html_preview("2_password_reset.html", html)

def test_case_acceptance_email():
    """測試案件受理通知郵件"""
    print("\n📝 測試案件受理通知郵件...")

    case_id = "CASE-2025-03-15-ABC123"
    place_name = "臺東大飯店"
    place_address = "臺東縣臺東市中華路一段123號"

    content = f"""
<p>臺東縣消防局已收到您的「消防安全設備檢修申報」，目前系統正在進行自動化初審。</p>

<div style="background-color: #f8f9fa; border-left: 5px solid #e53e3e; padding: 15px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 5px 0; color: #666;">您的案件單號（請妥善保存）：</p>
    <p style="font-size: 12px; color: #999; margin-top: 10px;">(電腦請雙擊單號複製，手機請長按複製)</p>
</div>

<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">申報場所</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">{place_name}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">場所地址</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">{place_address}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">預計審核</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">約 3 個工作天</td>
    </tr>
</table>

<p style="margin-top: 30px;">您隨時可至平台輸入單號查詢最新進度。</p>
"""

    html = utils.generate_email_html(
        title="案件受理通知",
        recipient_name="王小明",
        content_html=content,
        highlight_info=case_id,
        color_theme="#1a365d"
    )

    return save_html_preview("3_case_acceptance.html", html)

def test_case_status_update_email():
    """測試案件狀態更新郵件（三種狀態）"""
    print("\n📊 測試案件狀態更新郵件...")

    test_cases = [
        {"status": "可領件", "color": "#38a169", "icon": "✅", "notes": "審核通過，請於上班時間攜帶身分證件至本局預防調查科領取核定書表。"},
        {"status": "已退件", "color": "#e53e3e", "icon": "⚠️", "notes": "申報書第3頁場所平面圖不清，請重新拍照後上傳。"},
        {"status": "審核中", "color": "#3182ce", "icon": "ℹ️", "notes": "案件正在審核中，預計2個工作天內完成。"}
    ]

    files = []
    for idx, test_case in enumerate(test_cases, 1):
        status = test_case["status"]
        color = test_case["color"]
        icon = test_case["icon"]
        notes = test_case["notes"]
        case_id = f"CASE-2025-03-15-{idx:03d}"

        content = f"""
<p>您的消防安全設備檢修申報案件（單號：<strong>{case_id}</strong>），狀態已有更新。</p>

<div style="background-color: #f8f9fa; border-left: 5px solid {color}; padding: 20px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #666;">最新狀態</p>
    <h3 style="margin: 5px 0; color: {color}; display: flex; align-items: center;">
        {icon} {status}
    </h3>

    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
        <p style="margin: 0; font-weight: bold; color: #4a5568;">審核備註 / 應辦事項：</p>
        <p style="margin: 5px 0; white-space: pre-wrap; color: #2d3748;">{notes}</p>
    </div>
</div>

<table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
    <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">申報場所</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">臺東大飯店</td>
    </tr>
    <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">更新時間</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">2025-03-15 14:30</td>
    </tr>
</table>

<p style="margin-top: 30px; font-size: 14px; color: #666;">
    若狀態為「可領件」，請攜帶身分證件至本局預防調查科領取核定書表。<br>
    若狀態為「已退件」，請依備註說明修正後重新送件。
</p>
"""

        html = utils.generate_email_html(
            title=f"案件狀態更新：{status}",
            recipient_name="王小明",
            content_html=content,
            color_theme=color
        )

        filename = f"4_{idx}_status_{status}.html"
        files.append(save_html_preview(filename, html))

    return files

def main():
    """執行所有測試並生成預覽檔案"""
    print("=" * 60)
    print("📧 郵件模板測試工具")
    print("=" * 60)

    files = []

    # 測試各類郵件
    files.append(test_2fa_email())
    files.append(test_password_reset_email())
    files.append(test_case_acceptance_email())
    files.extend(test_case_status_update_email())

    print("\n" + "=" * 60)
    print("✅ 所有測試完成！")
    print("=" * 60)
    print(f"\n已生成 {len(files)} 個 HTML 預覽檔案：")
    for file in files:
        print(f"  • (file generated)")

    print("\n📌 請使用瀏覽器開啟這些檔案檢查顯示效果。")
    print("📌 建議同時測試：")
    print("   • 桌面瀏覽器（Chrome, Firefox, Edge）")
    print("   • 手機瀏覽器（模擬或實際裝置）")
    print("   • 郵件客戶端（Gmail, Outlook）")

    # 自動開啟第一個檔案
    if files:
        try:
            import webbrowser
            webbrowser.open(files[0])
            print(f"\n🌐 已在瀏覽器中開啟預覽檔案")
        except:
            pass

if __name__ == "__main__":
    main()
