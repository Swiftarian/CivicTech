import streamlit as st
import db_manager
import pandas as pd
import os
import utils
import config_loader as cfg

st.set_page_config(page_title="民眾申辦 - 消防安全設備檢修", page_icon="📝", layout="wide")

# 載入自定義 CSS
utils.load_custom_css()

# 載入中文側邊欄
import sidebar_nav
sidebar_nav.render_chinese_sidebar()

st.title("📝 民眾申辦與進度查詢")

# 兩個標籤頁：申辦 → 查詢
tab1, tab2 = st.tabs(["📝 申辦", "🔍 查詢進度"])

# ===== Tab 1: 民眾申辦 =====
with tab1:
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
        st.caption("💡 提示：可將檔案直接拖拉至上方虛線框內上傳，或點擊「從資料夾上傳」按鈕選擇檔案")
        
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
                st.stop()
            
            else:
                # 1. 儲存檔案
                upload_dir = "uploads"
                if not os.path.exists(upload_dir):
                    os.makedirs(upload_dir)
                    
                import uuid
                import time
                
                timestamp = int(time.time())
                uuid_prefix = str(uuid.uuid4())[:8]
                original_filename = uploaded_file.name
                
                unique_filename = f"{timestamp}_{uuid_prefix}_{original_filename}"
                file_path = os.path.join(upload_dir, unique_filename)
                
                try:
                    with open(file_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    
                    # 2. 寫入資料庫（包含 Line ID）
                    case_id = db_manager.create_case(name, email, phone, place_name, place_address, file_path, line_id)
                    
                    if case_id:
                        st.success(f"✅ 您已送件成功！您的案件單號為：**{case_id}**")
                        st.info("📧 可以於信箱收信確認，您可以使用上方**案件單號**、**Email**、**電話**來查詢您的案件進度。")
                        
                        # 3. 發送受理通知信
                        try:
                            if "email" in st.secrets:
                                sender_email = st.secrets["email"].get("sender_email", "")
                                sender_password = st.secrets["email"].get("sender_password", "")
                                
                                if sender_email and sender_password:
                                    subject = f"【{cfg.AGENCY_NAME}】案件受理通知 (單號：{case_id})"
                                    
                                    content = f"""
<p>{cfg.AGENCY_NAME}已收到您的「消防安全設備檢修申報」，目前系統正在進行自動化初審。</p>

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
                                    pass
                        except Exception as e:
                            st.warning(f"⚠️ 發送通知信時發生錯誤: {e}")

                        st.balloons()
                    else:
                        st.error("❌ 系統錯誤：無法建立案件，請稍後再試。")
                        
                except Exception as e:
                    st.error(f"❌ 檔案上傳失敗：{e}")

# ===== Tab 2: 統一查詢頁面 =====
with tab2:
    st.info("💡 **提示**：您可以擇一欄位填寫，即可查詢過往的申請資料列表。")
    
    # 三個查詢欄位並排
    col1, col2, col3 = st.columns(3)
    
    with col1:
        query_case_id = st.text_input("📋 案件單號", placeholder="例如：a1b2c3d4", key="unified_case_id")
    
    with col2:
        query_email = st.text_input("📧 Email", placeholder="example@email.com", key="unified_email")
    
    with col3:
        query_phone = st.text_input("📞 聯絡電話", placeholder="0912-345678", key="unified_phone")
    
    if st.button("🔍 查詢案件", type="primary", use_container_width=True):
        # 清除快取
        st.cache_data.clear()
        
        # 判斷使用者輸入了哪個欄位
        all_cases = []
        search_type = None
        
        if query_case_id:
            case = db_manager.get_case_by_id(query_case_id)
            if case:
                all_cases = [case]
            search_type = "單號"
        elif query_email:
            all_cases = db_manager.get_cases_by_email(query_email)
            search_type = "Email"
        elif query_phone:
            all_cases = db_manager.get_cases_by_phone(query_phone)
            search_type = "電話"
        else:
            st.warning("⚠️ 請至少填寫一個欄位再進行查詢！")
            st.stop()
        
        # 顯示查詢結果
        if all_cases:
            st.success(f"✅ 依 **{search_type}** 查詢成功，共找到 **{len(all_cases)}** 筆案件")
            
            df = pd.DataFrame([dict(row) for row in all_cases])
            df['place_name'] = df['place_name'].fillna('未填')
            df['review_notes'] = df['review_notes'].fillna('')
            
            if len(all_cases) > 1:
                all_statuses = df['status'].unique().tolist()
                selected_statuses = st.multiselect(
                    "📊 篩選狀態", 
                    options=all_statuses,
                    default=all_statuses,
                    help="選擇要顯示的案件狀態",
                    key="unified_status_filter"
                )
                
                if selected_statuses:
                    df_filtered = df[df['status'].isin(selected_statuses)]
                else:
                    df_filtered = df
            else:
                df_filtered = df
            
            df_filtered = df_filtered.sort_values('submission_date', ascending=False)
            
            def add_status_emoji(status):
                emoji_map = {
                    "待分案": "🔴 待分案",
                    "審核中": "🟡 審核中",
                    "可領件": "🟢 可領件",
                    "已退件": "⚫ 已退件",
                    "待補件": "🟠 待補件"
                }
                return emoji_map.get(status, status)
            
            def format_datetime(dt_str):
                try:
                    if len(dt_str) >= 16:
                        return dt_str[:16]
                    return dt_str
                except:
                    return dt_str
            
            df_display = df_filtered[['id', 'place_name', 'submission_date', 'status', 'applicant_name']].copy()
            df_display['status'] = df_display['status'].apply(add_status_emoji)
            df_display['submission_date'] = df_display['submission_date'].apply(format_datetime)
            df_display.columns = ['案件單號', '場所名稱', '申請日期', '目前狀態', '申請人']
            
            st.subheader("📋 您的案件列表")
            st.caption("💡 點擊任一行查看該案件的詳細資訊")
            
            event = st.dataframe(
                df_display,
                column_config={
                    "案件單號": st.column_config.TextColumn("案件單號", width="small"),
                    "場所名稱": st.column_config.TextColumn("場所名稱", width="large"),
                    "申請日期": st.column_config.TextColumn("申請日期", width="medium"),
                    "目前狀態": st.column_config.TextColumn("目前狀態", width="medium"),
                    "申請人": st.column_config.TextColumn("申請人", width="medium"),
                },
                hide_index=True,
                use_container_width=True,
                selection_mode="single-row",
                on_select="rerun",
                key="unified_case_table"
            )
            
            if event.selection.rows:
                selected_idx = event.selection.rows[0]
                selected_case = df_filtered.iloc[selected_idx]
                
                st.divider()
                
                status_config = {
                    "待分案": {"color": "#e53e3e", "bg": "#fed7d7", "icon": "🔴"},
                    "審核中": {"color": "#d97706", "bg": "#fef3c7", "icon": "🟡"},
                    "可領件": {"color": "#38a169", "bg": "#c6f6d5", "icon": "🟢"},
                    "已退件": {"color": "#4a5568", "bg": "#e2e8f0", "icon": "⚫"},
                    "待補件": {"color": "#dd6b20", "bg": "#feebc8", "icon": "🟠"}
                }
                
                status = selected_case['status']
                config = status_config.get(status, {"color": "#4a5568", "bg": "#e2e8f0", "icon": "ℹ️"})
                
                place_name = selected_case['place_name'] if selected_case['place_name'] else '未填'
                submission_date = selected_case['submission_date'][:16] if len(selected_case['submission_date']) > 16 else selected_case['submission_date']
                
                card_html = f"""<div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 24px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
<div style="display: flex; align-items: center; margin-bottom: 20px;">
<span style="font-size: 28px; background: {config['bg']}; padding: 8px 16px; border-radius: 8px; margin-right: 16px;">{config['icon']}</span>
<span style="font-size: 24px; font-weight: 700; color: {config['color']}; background: {config['bg']}; padding: 8px 20px; border-radius: 8px;">{status}</span>
</div>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
<div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; border-left: 4px solid #4a90d9;">
<p style="color: #a0aec0; font-size: 14px; margin: 0 0 4px 0;">案件單號</p>
<p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0; font-family: monospace;">{selected_case['id']}</p>
</div>
<div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; border-left: 4px solid #48bb78;">
<p style="color: #a0aec0; font-size: 14px; margin: 0 0 4px 0;">申請人</p>
<p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">{selected_case['applicant_name']}</p>
</div>
<div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; border-left: 4px solid #ed8936;">
<p style="color: #a0aec0; font-size: 14px; margin: 0 0 4px 0;">場所名稱</p>
<p style="color: #fff; font-size: 20px; font-weight: 600; margin: 0;">{place_name}</p>
</div>
<div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; border-left: 4px solid #9f7aea;">
<p style="color: #a0aec0; font-size: 14px; margin: 0 0 4px 0;">申請日期</p>
<p style="color: #fff; font-size: 18px; font-weight: 600; margin: 0;">{submission_date}</p>
</div>
</div>
</div>"""
                st.markdown(card_html, unsafe_allow_html=True)
                
                if selected_case['review_notes']:
                    st.markdown(f"""
                    <div style="background: linear-gradient(to right, #2d3748, #1a202c); border-left: 5px solid #4a90d9; padding: 16px 20px; border-radius: 8px; margin-top: 16px;">
                        <p style="color: #a0aec0; font-size: 14px; margin: 0 0 8px 0;">📋 審核備註</p>
                        <p style="color: #fff; font-size: 18px; margin: 0;">{selected_case['review_notes']}</p>
                    </div>
                    """, unsafe_allow_html=True)
                
                if status == "可領件":
                    st.success("🎉 恭喜！您的案件已審核通過，請攜帶身分證件至本局**預防調查科**領取核定書表。")
                elif status == "已退件":
                    st.error("⚠️ 您的案件已被退件，請依審核備註說明修正後重新送件。")
                elif status == "待補件":
                    st.warning("📝 您的案件需要補件，請依審核備註儘速補齊相關文件。")
                elif status == "審核中":
                    st.info("⏳ 您的案件正在審核中，請耐心等候。")
                elif status == "待分案":
                    st.info("📋 您的案件已收到，待承辦人員分案處理。")
        else:
            st.warning(f"❌ 查無符合條件的案件，請確認輸入的 **{search_type}** 是否正確。")
