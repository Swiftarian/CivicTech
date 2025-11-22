import streamlit as st
import os
import db_manager
import shutil

st.set_page_config(page_title="民眾申辦 - 消防安全設備檢修申報", page_icon="📝")

# 載入自定義 CSS
import utils
utils.load_custom_css()

st.title("📝 民眾申辦 - 消防安全設備檢修申報")

st.info("請填寫以下資訊並上傳檢修申報書，完成後系統將提供一組「案件單號」供您查詢進度。")

with st.form("application_form"):
    col1, col2 = st.columns(2)
    with col1:
        name = st.text_input("申請人姓名 *", placeholder="王小明")
        phone = st.text_input("聯絡電話 *", placeholder="0912-345678")
        place_name = st.text_input("場所名稱 *", placeholder="xx大樓")
    with col2:
        email = st.text_input("電子郵件 *", placeholder="example@email.com")
        place_address = st.text_input("場所地址 *", placeholder="臺東縣臺東市...")
        line_id = st.text_input("Line ID (選填)", placeholder="方便日後查詢進度", help="選填欄位，提供 Line ID 可接收進度通知")
    
    uploaded_file = st.file_uploader("上傳檢修申報書 (PDF/圖片/Word) *", type=["pdf", "png", "jpg", "jpeg", "docx", "doc"])
    
    st.caption("* 為必填欄位")
    submitted = st.form_submit_button("🔥 確認提交", type="primary")

    if submitted:
        # 必填欄位檢核
        required_fields = {
            "申請人姓名": name,
            "電子郵件": email,
            "聯絡電話": phone,
            "場所名稱": place_name,
            "場所地址": place_address,
            "檢修申報書": uploaded_file
        }
        
        missing = [k for k, v in required_fields.items() if not v]
        
        if missing:
            st.error(f"❌ 請填寫以下必填欄位後再提交：{', '.join(missing)}")
            st.stop()  # 阻止後續程式執行
        
        # 檢查通過，繼續執行
        else:
            # 1. 儲存檔案
            upload_dir = "uploads"
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
                
            # 使用 {timestamp}_{uuid前8碼}_{原始檔名} 格式
            import uuid
            import time
            
            timestamp = int(time.time())
            uuid_prefix = str(uuid.uuid4())[:8]
            original_filename = uploaded_file.name
            
            # 組合新檔名
            unique_filename = f"{timestamp}_{uuid_prefix}_{original_filename}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            try:
                with open(file_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                
                # 2. 寫入資料庫（包含 Line ID）
                case_id = db_manager.create_case(name, email, phone, place_name, place_address, file_path, line_id)
                
                if case_id:
                    st.success(f"✅ 提交成功！您的案件單號為：**{case_id}**")
                    st.warning("請記下此單號，以便日後查詢進度。")
                    
                    # 3. 發送受理通知信
                    try:
                        if "email" in st.secrets:
                            sender_email = st.secrets["email"].get("sender_email", "")
                            sender_password = st.secrets["email"].get("sender_password", "")
                            
                            if sender_email and sender_password:
                                subject = f"【臺東縣消防局】案件受理通知 (單號：{case_id})"
                                
                                # 使用統一模板生成 HTML 郵件
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
                                body = utils.generate_email_html(
                                    title="案件受理通知",
                                    recipient_name=name,
                                    content_html=content,
                                    highlight_info=case_id,
                                    color_theme="#1a365d"
                                )
                                
                                success, msg = utils.send_email(sender_email, sender_password, email, subject, body)
                                if success:
                                    st.toast(f"📧 受理通知信已發送至 {email}")
                                else:
                                    st.warning(f"⚠️ 通知信發送失敗: {msg}")
                            else:
                                # 未設定 Email，僅記錄 Log 或忽略
                                pass
                    except Exception as e:
                        st.warning(f"⚠️ 發送通知信時發生錯誤: {e}")

                    st.balloons()
                else:
                    st.error("❌ 系統錯誤：無法建立案件，請稍後再試。")
                    
            except Exception as e:
                st.error(f"❌ 檔案上傳失敗：{e}")
