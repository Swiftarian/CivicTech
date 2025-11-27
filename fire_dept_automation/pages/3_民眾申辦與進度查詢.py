import streamlit as st
import db_manager
import pandas as pd
import os
import shutil
import config_loader as cfg

st.set_page_config(page_title="民眾申辦與進度查詢", page_icon="📝")

# 載入自定義 CSS
import utils
utils.load_custom_css()

st.title("📝 民眾申辦與進度查詢")

# 三個標籤頁：申辦 → 依單號查詢 → 依 Email 查詢
tab1, tab2, tab3 = st.tabs(["📝 民眾申辦", "🔢 依單號查詢", "📧 依 Email 查詢"])

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
                                    subject = f"【{cfg.AGENCY_NAME}】案件受理通知 (單號：{case_id})"
                                    
                                    # 使用統一模板生成 HTML 郵件
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
                                    # 未設定 Email，僅記錄 Log 或忽略
                                    pass
                        except Exception as e:
                            st.warning(f"⚠️ 發送通知信時發生錯誤: {e}")

                        st.balloons()
                    else:
                        st.error("❌ 系統錯誤：無法建立案件，請稍後再試。")
                        
                except Exception as e:
                    st.error(f"❌ 檔案上傳失敗：{e}")

# ===== Tab 2: 依單號查詢 =====
with tab2:
    case_id_input = st.text_input("請輸入案件單號", placeholder="例如：a1b2c3d4")
    if st.button("查詢單號"):
        # 清除快取以確保讀取最新資料
        st.cache_data.clear()
        
        if case_id_input:
            case = db_manager.get_case_by_id(case_id_input)
            if case:
                st.success("✅ 查詢成功")
                
                # 狀態顏色邏輯
                status_color = ":red"
                if case['status'] == "審核中":
                    status_color = ":orange"
                elif case['status'] == "可領件":
                    status_color = ":green"
                elif case['status'] == "待分案":
                    status_color = ":red"
                
                st.markdown(f"""
                **案件單號**: `{case['id']}`
                **申請人**: {case['applicant_name']}
                **目前狀態**: {status_color}[{case['status']}]
                **申請日期**: {case['submission_date']}
                """)
                
                if case['review_notes']:
                    st.info(f"📋 **審核備註**: {case['review_notes']}")
            else:
                st.error("❌ 找不到此單號，請確認輸入是否正確。")

# ===== Tab 3: 依 Email 查詢 =====
with tab3:
    email_input = st.text_input("請輸入申請 Email", placeholder="example@email.com")
    if st.button("查詢 Email"):
        # 清除快取
        st.cache_data.clear()
        
        if email_input:
            cases = db_manager.get_cases_by_email(email_input)
            if cases:
                st.success(f"✅ 找到 {len(cases)} 筆案件")
                
                # 轉換為 DataFrame
                df = pd.DataFrame([dict(row) for row in cases])
                
                # 處理場所名稱缺失值
                df['place_name'] = df['place_name'].fillna('未填')
                df['review_notes'] = df['review_notes'].fillna('')
                
                # 狀態篩選器
                all_statuses = df['status'].unique().tolist()
                selected_statuses = st.multiselect(
                    "📊 篩選狀態", 
                    options=all_statuses,
                    default=all_statuses,
                    help="選擇要顯示的案件狀態"
                )
                
                # 篩選資料
                if selected_statuses:
                    df_filtered = df[df['status'].isin(selected_statuses)]
                else:
                    df_filtered = df
                
                # 排序（最新的在最上面）
                df_filtered = df_filtered.sort_values('submission_date', ascending=False)
                
                # 添加 Emoji 狀態標示（視覺優化）
                def add_status_emoji(status):
                    emoji_map = {
                        "待分案": "🔴 待分案",
                        "審核中": "🟡 審核中",
                        "可領件": "🟢 可領件",
                        "已退件": "⚫ 已退件",
                        "待補件": "🟠 待補件"
                    }
                    return emoji_map.get(status, status)
                
                # 格式化日期（統一格式為 YYYY-MM-DD HH:mm）
                def format_datetime(dt_str):
                    try:
                        # 如果已經是完整格式，直接返回前16個字符
                        if len(dt_str) >= 16:
                            return dt_str[:16]
                        return dt_str
                    except:
                        return dt_str
                
                # 選擇要顯示的欄位並處理格式
                df_display = df_filtered[['id', 'place_name', 'submission_date', 'status', 'applicant_name']].copy()
                df_display['status'] = df_display['status'].apply(add_status_emoji)
                df_display['submission_date'] = df_display['submission_date'].apply(format_datetime)
                df_display.columns = ['案件單號', '場所名稱', '申請日期', '目前狀態', '申請人']
                
                # 顯示互動式表格（唯讀，無核取方塊）
                st.subheader("📋 您的案件列表")
                st.caption("💡 點擊任一行查看該案件的詳細資訊")
                
                event = st.dataframe(
                    df_display,
                    column_config={
                        "案件單號": st.column_config.TextColumn("案件單號", width="small", help="案件追蹤編號"),
                        "場所名稱": st.column_config.TextColumn("場所名稱", width="large", help="申報場所名稱"),
                        "申請日期": st.column_config.TextColumn("申請日期", width="medium", help="送件時間"),
                        "目前狀態": st.column_config.TextColumn(
                            "目前狀態", 
                            width="medium", 
                            help="案件當前進度",
                        ),
                        "申請人": st.column_config.TextColumn("申請人", width="medium"),
                    },
                    hide_index=True,
                    use_container_width=True,
                    selection_mode="single-row",
                    on_select="rerun",
                    key="case_table"
                )
                
                # 顯示詳細資訊卡片（當使用者點擊某一行時）
                if event.selection.rows:
                    selected_idx = event.selection.rows[0]
                    selected_case = df_filtered.iloc[selected_idx]
                    
                    st.divider()
                    
                    # 使用 expander 顯示詳細資訊
                    with st.expander("📄 案件詳細資訊", expanded=True):
                        # 狀態圖示映射
                        status_icon_map = {
                            "待分案": "🔴",
                            "審核中": "🟡",
                            "可領件": "🟢",
                            "已退件": "⚫",
                            "待補件": "🟠"
                        }
                        status_icon = status_icon_map.get(selected_case['status'], "ℹ️")
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            st.markdown(f"""
                            **案件單號**: `{selected_case['id']}`  
                            **申請人**: {selected_case['applicant_name']}  
                            **聯絡電話**: {selected_case['applicant_phone']}  
                            **Email**: {selected_case['applicant_email']}  
                            """)
                        
                        with col2:
                            st.markdown(f"""
                            **場所名稱**: {selected_case['place_name']}  
                            **場所地址**: {selected_case['place_address']}  
                            **申請日期**: {selected_case['submission_date']}  
                            **目前狀態**: {status_icon} **{selected_case['status']}**  
                            """)
                        
                        # 審核備註（重點資訊）
                        if selected_case['review_notes']:
                            st.info(f"📋 **審核備註**: {selected_case['review_notes']}")
                        else:
                            st.caption("目前尚無審核備註")
                        
                        # 狀態提示訊息
                        if selected_case['status'] == "可領件":
                            st.success("🎉 恭喜！您的案件已審核通過，請攜帶身分證件至本局**預防調查科**領取核定書表。")
                        elif selected_case['status'] == "已退件":
                            st.error("⚠️ 您的案件已被退件，請依上方審核備註說明修正後重新送件。")
                        elif selected_case['status'] == "待補件":
                            st.warning("📝 您的案件需要補件，請依審核備註儘速補齊相關文件。")
                        elif selected_case['status'] == "審核中":
                            st.info("⏳ 您的案件正在審核中，請耐心等候。")
                        elif selected_case['status'] == "待分案":
                            st.info("📋 您的案件已收到，待承辦人員分案處理。")
                
            else:
                st.warning("查無此 Email 的相關案件。")
