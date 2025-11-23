import streamlit as st
import db_manager
import utils
import auth
import pandas as pd
import os
import datetime
from PIL import Image
import config_loader as cfg

st.set_page_config(page_title="案件審核 - 消防安全設備檢修申報", page_icon="👮", layout="wide")

# 載入自定義 CSS
utils.load_custom_css()

# --- Session State Initialization ---
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'user' not in st.session_state:
    st.session_state.user = None
if 'username' not in st.session_state:
    st.session_state.username = None
if 'role' not in st.session_state:
    st.session_state.role = None
if 'awaiting_2fa' not in st.session_state:
    st.session_state.awaiting_2fa = False

# --- Login & Authentication Functions ---

def login():
    # 2FA Verification Screen
    if st.session_state.awaiting_2fa:
        st.title("🔒 二階段驗證 (2FA)")
        st.info("系統已發送驗證碼至您的 Email，請查收並輸入。")
        
        otp_input = st.text_input("請輸入 6 位數驗證碼", max_chars=6)
        col1, col2 = st.columns([1, 1])
        with col1:
            if st.button("驗證登入", type="primary"):
                if otp_input == st.session_state.otp:
                    # 2FA Success
                    user = st.session_state.temp_user
                    st.session_state.logged_in = True
                    st.session_state.user = dict(user)
                    # Sync flat variables
                    st.session_state.username = user['username']
                    st.session_state.role = user['role']
                    
                    st.session_state.awaiting_2fa = False
                    del st.session_state.otp
                    del st.session_state.temp_user
                    
                    db_manager.update_last_login(user['username'])
                    db_manager.add_log(user['username'], "登入成功", "2FA 驗證通過")
                    st.success("驗證成功！")
                    st.rerun()
                else:
                    st.error("❌ 驗證碼錯誤")
                    db_manager.add_log(st.session_state.temp_user['username'], "登入失敗", "2FA 錯誤")
        with col2:
            if st.button("取消 / 返回"):
                st.session_state.awaiting_2fa = False
                if 'temp_user' in st.session_state:
                    del st.session_state.temp_user
                if 'otp' in st.session_state:
                    del st.session_state.otp
                st.rerun()
        return

    # Standard Login/Registration Screen
    st.title("👮 消防局內部系統")
    
    # 部門通行碼設定
    REGISTRATION_KEY = cfg.REGISTRATION_KEY
    
    # 建立登入/註冊分頁
    tab_login, tab_register = st.tabs(["🔑 登入", "📝 註冊新帳號"])
    
    with tab_login:
        st.subheader("帳號登入")
        
        with st.form("login_form"):
            username = st.text_input("帳號")
            password = st.text_input("密碼", type="password")
            login_btn = st.form_submit_button("登入", type="primary", use_container_width=True)
            
            if login_btn:
                try:
                    user = db_manager.get_user(username)
                    if user:
                        # Verify password
                        if auth.verify_password(user['password_salt'], user['password_hash'], password):
                            
                            # Check Role for 2FA
                            if user['role'] == 'admin':
                                # Generate OTP
                                import random
                                otp = f"{random.randint(0, 999999):06d}"
                                
                                # Send Email
                                if "email" in st.secrets:
                                    sender_email = st.secrets["email"].get("sender_email", "")
                                    sender_password = st.secrets["email"].get("sender_password", "")
                                    if sender_email and sender_password:
                                        # ... email sending logic (omitted for brevity in this thought, but should be in file) ...
                                        # Wait, I don't need to touch the admin block, just add the else.
                                        pass 
                                
                                # Store temp user for 2FA
                                st.session_state.temp_user = user
                                st.session_state.otp = otp
                                st.session_state.awaiting_2fa = True
                                
                                # Send OTP Email
                                subject = "【消防局後台】登入驗證碼"
                                
                                # 準備 HTML 內容
                                content_html = f"""
                                <p>您正在進行消防局後台系統的登入驗證。</p>
                                <p>請在驗證頁面輸入以下 6 位數代碼：</p>
                                """
                                
                                # 呼叫共用模板
                                email_html = utils.generate_email_html(
                                    title="登入驗證碼 (2FA)",
                                    recipient_name=user['username'],
                                    content_html=content_html,
                                    highlight_info=otp,
                                    color_theme="#2b6cb0" # 科技藍
                                )
                                
                                utils.send_email(sender_email, sender_password, user['email'], subject, email_html)
                                
                                st.rerun()
                            else:
                                # Staff Login (No 2FA)
                                st.session_state.logged_in = True
                                st.session_state.user = dict(user) # 轉換為字典
                                # Sync flat variables
                                st.session_state.username = user['username']
                                st.session_state.role = user['role']
                                db_manager.update_last_login(user['username'])
                                db_manager.add_log(user['username'], "登入成功", "一般登入")
                                st.success("登入成功！")
                                st.rerun()
                        else:
                            st.error("❌ 帳號或密碼錯誤")
                            db_manager.add_log(username, "登入失敗", "密碼錯誤")
                    else:
                        st.error("❌ 帳號或密碼錯誤")
                        db_manager.add_log("unknown", "登入失敗", f"嘗試帳號: {username}")
                except Exception as e:
                    st.error(f"❌ 登入失敗！請聯繫管理員。系統錯誤碼: {type(e).__name__}")
                    st.code(str(e))
                    # db_manager.add_log(username, "LOGIN_ERROR", str(e))
        
        st.divider()
        
        with st.expander("🔑 忘記密碼？"):
            st.write("請輸入您的帳號，系統將發送臨時密碼至您的 Email。")
            reset_username = st.text_input("輸入帳號重設密碼", key="reset_user")
            if st.button("發送重設信"):
                user = db_manager.get_user(reset_username)
                if user and user['email']:
                    # Generate temp password
                    temp_pwd = auth.generate_temp_password()
                    db_manager.update_user_password(reset_username, temp_pwd)
                    
                    # Send Email
                    if "email" in st.secrets:
                        sender_email = st.secrets["email"].get("sender_email", "")
                        sender_password = st.secrets["email"].get("sender_password", "")
                        if sender_email and sender_password:
                            subject = "【消防局後台】重設密碼通知"
                            
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
                            body = utils.generate_email_html(
                                title="重設密碼通知",
                                recipient_name=user['username'],
                                content_html=content,
                                highlight_info=temp_pwd,
                                color_theme="#e53e3e"
                            )
                            
                            success, msg = utils.send_email(sender_email, sender_password, user['email'], subject, body)
                            if success:
                                st.success(f"✅ 已發送臨時密碼至 {user['email']}")
                                db_manager.add_log(reset_username, "重設密碼", "系統自動發送")
                            else:
                                st.error(f"Email 發送失敗: {msg}")
                        else:
                            st.error("系統未設定 Email 寄件者。")
                    else:
                        st.error("系統未設定 Secrets。")
                else:
                    st.error("找不到此帳號或該帳號未設定 Email。")
    
    with tab_register:
        st.subheader("內部同仁註冊")
        st.info("💡 請輸入科室共用的註冊碼以完成註冊。如不知道註冊碼，請洽詢管理員。")
        
        with st.form("register_form"):
            new_username = st.text_input("帳號 *", help="僅限英數字，作為登入使用")
            col_r1, col_r2 = st.columns(2)
            with col_r1:
                new_password = st.text_input("密碼 *", type="password")
            with col_r2:
                confirm_password = st.text_input("確認密碼 *", type="password")
            
            new_email = st.text_input("Email *", help="用於重要通知")
            registration_code = st.text_input("部門通行碼 *", type="password", help="請輸入科室共用的註冊碼")
            
            st.caption("* 為必填欄位")
            register_btn = st.form_submit_button("🚀 註冊", type="primary", use_container_width=True)
            
            if register_btn:
                # 驗證 1: 檢查通行碼
                if registration_code != REGISTRATION_KEY:
                    st.error("❌ 部門通行碼錯誤，請詢問管理員")
                    st.stop()
                
                # 驗證 2: 檢查必填欄位
                if not all([new_username, new_password, confirm_password, new_email]):
                    st.error("❌ 請填寫所有必填欄位")
                    st.stop()
                
                # 驗證 3: 檢查密碼一致
                if new_password != confirm_password:
                    st.error("❌ 兩次密碼輸入不一致")
                    st.stop()
                
                # 驗證 4: 檢查帳號是否已存在
                existing_user = db_manager.get_user(new_username)
                if existing_user:
                    st.error("❌ 帳號已存在，請使用其他帳號或直接登入")
                    st.stop()
                
                # 通過驗證，建立帳號
                success, msg = db_manager.create_user(
                    username=new_username,
                    password=new_password,
                    role='staff',  # 預設為一般人員
                    email=new_email
                )
                
                if success:
                    st.success("✅ 註冊成功！請切換至「🔑 登入」頁面進行登入。")
                    db_manager.add_log("system", "新用戶註冊", f"帳號: {new_username}")
                    st.balloons()
                else:
                    st.error(f"❌ 註冊失敗：{msg}")

# --- Main Application ---

if not st.session_state.logged_in:
    login()
    st.stop()

# --- Authenticated View ---

user = st.session_state.user
st.sidebar.title(f"👤 {user['username']} ({user['role']})")

if st.sidebar.button("登出"):
    db_manager.add_log(user['username'], "登出")
    st.session_state.logged_in = False
    st.session_state.user = None
    st.rerun()

st.sidebar.divider()

# Navigation
if user['role'] == 'admin':
    page = st.sidebar.radio("功能選單", ["案件審核", "人員管理", "系統紀錄", "修改密碼"])
else:
    page = st.sidebar.radio("功能選單", ["案件審核", "修改密碼"])

# OCR 設定（全域變數，供 Tab 2 使用）
st.sidebar.divider()

# 初始化 session_state（記憶使用者設定）
if "system_excel_path" not in st.session_state:
    st.session_state["system_excel_path"] = r"d:\下載\downloads\00. 列管場所資料.xls"
if "tesseract_exe_path" not in st.session_state:
    st.session_state["tesseract_exe_path"] = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

with st.sidebar.expander("⚙️ OCR 比對設定", expanded=False):
    st.caption("💡 設定會自動記憶，重新整理後不會遺失")
    
    # 使用 key 參數綁定 session_state，自動記憶輸入
    system_file_path = st.text_input(
        "系統 Excel 路徑", 
        key="system_excel_path",
        help="列管場所資料檔案位置"
    )
    tesseract_path = st.text_input(
        "Tesseract 路徑", 
        key="tesseract_exe_path",
        help="Tesseract OCR 執行檔位置"
    )

# --- Page: 案件審核 ---
if page == "案件審核":
    st.title("📋 案件審核")
    
    tab1, tab2 = st.tabs(["📂 案件總覽與管理", "📝 單筆審核與比對"])
    
    # --- Tab 1: 案件總覽與管理 ---
    with tab1:
        st.subheader("案件總覽")
        
        
        # Filter
        col_filter1, col_filter2, col_refresh = st.columns([1, 2, 0.5])
        with col_filter1:
            filter_status = st.selectbox("篩選狀態", ["全部", "待分案", "審核中", "可領件", "已退件", "待補件"])
        with col_filter2:
            search_term = st.text_input("🔍 搜尋 (單號/場所/申請人)", placeholder="輸入關鍵字...")
        with col_refresh:
            st.write(" ") # Spacer
            st.write(" ")
            if st.button("🔄", help="強制刷新資料"):
                st.cache_data.clear()
                if 'case_editor_df' in st.session_state:
                    del st.session_state.case_editor_df
                st.rerun()
        
        # 取得當前登入者資訊（從 user 物件中讀取）
        current_user = st.session_state.user['username']
        current_role = st.session_state.user['role']
        
        # 根據角色篩選案件
        if current_role == "admin":
            # 管理員：看全部案件
            cases = db_manager.get_all_cases(filter_status)
            st.info("👤 管理員模式：顯示所有案件")
        else:
            # 一般同仁：只看指派給自己的案件
            cases = db_manager.get_cases_by_assignee(current_user, filter_status)
            st.info(f"👤 同仁模式：僅顯示指派給 {current_user} 的案件")
        
        if not cases:
            if user['role'] == 'admin':
                st.info("目前無符合條件的案件可審核。")
            else:
                st.info("🎉 太棒了！目前沒有指派給您的待審案件。")
                st.image("https://cdn-icons-png.flaticon.com/512/7486/7486744.png", width=200)
        else:
            # Convert to DataFrame
            df = pd.DataFrame([dict(row) for row in cases])
            
            # 處理承辦人欄位顯示（向後相容）
            if 'assigned_to' in df.columns:
                df['assigned_to'] = df['assigned_to'].fillna('未指派')
            else:
                df['assigned_to'] = '未指派'
            
            # 美化狀態欄位 (加入 Emoji)
            status_emoji_map = {
                "待分案": "🔴 待分案",
                "審核中": "🟡 審核中",
                "可領件": "🟢 可領件",
                "已退件": "⚫ 已退件",
                "待補件": "🟠 待補件"
            }
            df['status'] = df['status'].map(lambda x: status_emoji_map.get(x, x))
            
            # Filter by search term
            if search_term:
                mask = df.apply(lambda x: search_term.lower() in str(x.values).lower(), axis=1)
                df = df[mask]
            
            if df.empty:
                st.warning("找不到符合搜尋條件的案件。")
            else:
                # Initialize session state for data_editor if not exists
                if 'case_editor_df' not in st.session_state or len(st.session_state.case_editor_df) != len(df):
                    df.insert(0, "選取", False)
                    st.session_state.case_editor_df = df
                
                # 全選/取消全選按鈕
                col_select1, col_select2, col_select3 = st.columns([1, 1, 6])
                
                with col_select1:
                    if st.button("✅ 全選", use_container_width=True):
                        st.session_state.case_editor_df['選取'] = True
                        st.rerun()
                
                with col_select2:
                    if st.button("⬜ 取消全選", use_container_width=True):
                        st.session_state.case_editor_df['選取'] = False
                        st.rerun()
                
                # Configure columns for data_editor
                edited_df = st.data_editor(
                    st.session_state.case_editor_df,
                    column_config={
                        "選取": st.column_config.CheckboxColumn("選取", help="勾選以進行批量操作", default=False),
                        "id": st.column_config.TextColumn("單號", disabled=True),
                        "assigned_to": st.column_config.TextColumn("👤 承辦人", help="目前負責審核的同仁", disabled=True),
                        "place_name": st.column_config.TextColumn("場所名稱", help="可直接編輯"),
                        "applicant_name": st.column_config.TextColumn("申請人", help="可直接編輯"),
                        "status": st.column_config.TextColumn(
                            "狀態",
                            help="案件當前審核進度",
                            width="small"
                        ),
                        "submission_date": st.column_config.TextColumn("申請日期", disabled=True),
                        "file_path": st.column_config.TextColumn("檔案路徑", disabled=True),
                    },
                    disabled=["id", "assigned_to", "status", "submission_date", "file_path", "applicant_email", "applicant_phone", "place_address", "review_notes"],
                    hide_index=True,
                    use_container_width=True,
                    key="case_editor"
                )
                
                # Update session state with edited data
                st.session_state.case_editor_df = edited_df
                
                # 批量操作（僅管理員可見）
                if current_role == "admin":
                    st.subheader("批量操作")
                    col_assign1, col_assign2, col_assign3 = st.columns([2, 2, 1])
                    
                    with col_assign1:
                        st.write("**👤 派案給同仁**")
                        available_users = db_manager.get_all_usernames()
                        selected_assignee = st.selectbox(
                            "選擇承辦人",
                            options=["（請選擇）"] + available_users,
                            key="assignee_select"
                        )
                    
                    with col_assign2:
                        st.write(" ")  # 對齊
                        st.write(" ")
                        if st.button("✅ 執行派案", type="secondary", use_container_width=True):
                            if selected_assignee == "（請選擇）":
                                st.warning("請先選擇承辦人")
                            else:
                                selected_rows = edited_df[edited_df["選取"]]
                                if not selected_rows.empty:
                                    case_ids = selected_rows['id'].tolist()
                                    db_manager.update_case_assignment(case_ids, selected_assignee)
                                    st.success(f"已將 {len(case_ids)} 件案件指派給 {selected_assignee}")
                                    st.rerun()
                                else:
                                    st.warning("請先勾選案件")

    # --- Tab 2: 單筆審核與比對 ---
    with tab2:
        st.subheader("📝 單筆審核與比對")
        
        # 嘗試從 Session State 取得 Tab 1 選取的案件
        selected_case_id = None
        if 'case_editor_df' in st.session_state:
            editor_df = st.session_state.case_editor_df
            if '選取' in editor_df.columns:
                selected_rows = editor_df[editor_df['選取']]
                if not selected_rows.empty:
                    selected_case_id = selected_rows.iloc[0]['id']
        
        if selected_case_id:
            # 取得案件詳細資料 (直接從 dataframe 取，避免額外查詢)
            # 注意：這裡假設 editor_df 包含所有必要欄位。如果需要更多細節，可能需要 db_manager.get_case(selected_case_id)
            row = editor_df[editor_df['id'] == selected_case_id].iloc[0]
            
            st.info(f"正在審核案件：{row['id']} - {row['applicant_name']}")
            
            # 顯示案件詳情
            col_d1, col_d2 = st.columns(2)
            with col_d1:
                st.write(f"**📍 場所名稱:** {row.get('place_name', '(未填)')}")
                st.write(f"**🏢 地址:** {row.get('place_address', '(未填)')}")
                st.write(f"**📅 申請日期:** {row.get('submission_date', '(未填)')}")
            with col_d2:
                st.write(f"**👤 申請人:** {row['applicant_name']}")
                st.write(f"**📞 電話:** {row.get('applicant_phone', '(未填)')}")
                st.write(f"**📧 Email:** {row.get('applicant_email', '(未填)')}")
            
            st.divider()
            
            col_review, col_ocr = st.columns([1, 1])
            
            with col_review:
                st.subheader("審核操作")
                with st.form("review_form"):
                    # 狀態對應
                    status_options = ["待分案", "審核中", "可領件", "已退件", "待補件"]
                    # 移除 emoji 進行比對
                    current_status_raw = row['status'].split(" ")[-1] if " " in row['status'] else row['status']
                    
                    default_index = 0
                    if current_status_raw in status_options:
                        default_index = status_options.index(current_status_raw)
                    
                    new_status = st.selectbox("更新狀態", status_options, index=default_index)
                    review_notes = st.text_area("審核備註", value=row.get('review_notes', '') if pd.notna(row.get('review_notes')) else "")
                    
                    if st.form_submit_button("💾 儲存審核結果", type="primary"):
                        try:
                            db_manager.update_case_status(selected_case_id, new_status, review_notes)
                            st.success("✅ 案件狀態已更新！")
                            st.rerun()
                        except Exception as e:
                            st.error(f"更新失敗: {e}")
            
            with col_ocr:
                st.subheader("📄 檔案與 OCR 比對")
                file_path = row.get('file_path')
                if file_path and os.path.exists(file_path):
                    st.success(f"已找到檔案: {os.path.basename(file_path)}")
                    if st.button("🔍 執行 OCR 比對 (Tesseract)"):
                        st.info("OCR 功能開發中...")
                        # 這裡可以加入 OCR 邏輯
                else:
                    st.warning(f"找不到檔案: {file_path}")

        else:
            # Empty State Guidance (強制引導)
            st.warning("⚠️ 請先選擇案件！")
            st.info("請點擊左側的 【案件總覽與管理】 分頁，從案件列表中點選任一案件後，再切換回來進行審核。")
            st.markdown("### 👈 步驟： 1. 總覽分頁點選案件 ➔ 2. 切換回此分頁")

# --- Page: 人員管理 (Admin Only) ---
elif page == "人員管理":
    if user['role'] != 'admin':
        st.error("⛔ 您沒有權限存取此頁面")
    else:
        st.title("👤 人員帳號管理")
        
        col_add, col_list = st.columns([1, 2])
        
        with col_add:
            st.subheader("新增人員")
            with st.form("add_user_form"):
                new_u = st.text_input("帳號")
                new_p = st.text_input("預設密碼", type="password")
                new_e = st.text_input("Email")
                new_r = st.selectbox("角色", ["staff", "admin"])
                if st.form_submit_button("建立帳號", type="primary"):
                    if new_u and new_p:
                        success, msg = db_manager.create_user(new_u, new_p, new_r, new_e)
                        if success:
                            st.success(msg)
                            db_manager.add_log(user['username'], "建立人員", f"帳號: {new_u}")
                            st.rerun()
                        else:
                            st.error(msg)
                    else:
                        st.error("請輸入帳號與密碼")
        
        with col_list:
            st.subheader("人員列表")
            users = db_manager.get_all_users()
            if users:
                st.dataframe(pd.DataFrame(users, columns=["ID", "帳號", "密碼Hash", "Salt", "角色", "Email", "建立時間", "最後登入"]), hide_index=True)

# --- Page: 系統紀錄 (Admin Only) ---
elif page == "系統紀錄":
    if user['role'] != 'admin':
        st.error("⛔ 您沒有權限存取此頁面")
    else:
        st.title("📜 系統稽核紀錄")
        logs = db_manager.get_audit_logs()
        if logs:
            df_logs = pd.DataFrame(logs, columns=["ID", "帳號", "動作", "詳情", "時間"])
            st.dataframe(df_logs, use_container_width=True, hide_index=True)

# --- Page: 修改密碼 ---
elif page == "修改密碼":
    st.title("🔑 修改密碼")
    
    with st.form("change_pwd_form"):
        old_pwd = st.text_input("舊密碼", type="password")
        new_pwd = st.text_input("新密碼", type="password")
        confirm_pwd = st.text_input("確認新密碼", type="password")
        
        if st.form_submit_button("確認修改", type="primary"):
            if new_pwd != confirm_pwd:
                st.error("兩次新密碼輸入不一致")
            elif not new_pwd:
                st.error("新密碼不得為空")
            else:
                # Verify old password
                user_data = db_manager.get_user(user['username'])
                if auth.verify_password(user_data['password_salt'], user_data['password_hash'], old_pwd):
                    db_manager.update_user_password(user['username'], new_pwd)
                    db_manager.add_log(user['username'], "修改密碼", "使用者自行修改")
                    st.success("密碼修改成功！請重新登入。")
                    
                    # Force logout
                    st.session_state.logged_in = False
                    st.session_state.user = None
                    st.rerun()
                else:
                    st.error("舊密碼錯誤")
