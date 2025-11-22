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
                                if sender_email and sender_password and user['email']:
                                    subject = "【消防局後台】安全登入驗證"
                                    
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
                                    body = utils.generate_email_html(
                                        title="安全登入驗證",
                                        recipient_name=user['username'],
                                        content_html=content,
                                        highlight_info=otp,
                                        color_theme="#1a365d"
                                    )
                                    
                                    success, msg = utils.send_email(sender_email, sender_password, user['email'], subject, body)
                                    if success:
                                        st.session_state.otp = otp
                                        st.session_state.temp_user = user
                                        st.session_state.awaiting_2fa = True
                                        st.rerun()
                                    else:
                                        st.error(f"驗證碼發送失敗: {msg}")
                                else:
                                    st.error("系統未設定 Email 或該帳號無 Email，無法進行 2FA。")
                            else:
                                st.error("系統未設定 Secrets，無法發送 2FA。")
                                
                        else:
                            # Staff login without 2FA
                            st.session_state.logged_in = True
                            st.session_state.user = dict(user)
                            db_manager.update_last_login(user['username'])
                            db_manager.add_log(user['username'], "登入成功")
                            st.success("✅ 登入成功！")
                            st.rerun()
                    else:
                        st.error("❌ 帳號或密碼錯誤")
                        db_manager.add_log(username, "登入失敗", "密碼錯誤")
                else:
                    st.error("❌ 帳號或密碼錯誤")
                    db_manager.add_log("unknown", "登入失敗", f"嘗試帳號: {username}")
        
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
        col_filter1, col_filter2 = st.columns([1, 2])
        with col_filter1:
            filter_status = st.selectbox("篩選狀態", ["全部", "待處理", "審核中", "可領件", "已退件", "待補件"])
        with col_filter2:
            search_term = st.text_input("🔍 搜尋 (單號/場所/申請人)", placeholder="輸入關鍵字...")
        
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
            st.info("目前沒有符合條件的案件。")
        else:
            # Convert to DataFrame
            df = pd.DataFrame([dict(row) for row in cases])
            
            # 處理承辦人欄位顯示（向後相容）
            if 'assigned_to' in df.columns:
                df['assigned_to'] = df['assigned_to'].fillna('未指派')
            else:
                df['assigned_to'] = '未指派'
            
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
                        "status": st.column_config.TextColumn("狀態", disabled=True),
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
                                    updated = db_manager.update_case_assignment(case_ids, selected_assignee)
                                    
                                    # 2. 連動更新狀態 (派案即審核)
                                    for case_id in case_ids:
                                        # 取得最新案件資訊
                                        case = db_manager.get_case_by_id(case_id)
                                        if case and case['status'] == "待處理":
                                            db_manager.update_case_status(case_id, "審核中")
                                    
                                    # 記錄操作
                                    db_manager.add_log(
                                        user['username'], 
                                        "批量派案", 
                                        f"指派 {updated} 件給 {selected_assignee}"
                                    )
                                    
                                    st.toast(f"✅ 派案成功！已將 {updated} 件指派給 {selected_assignee}，狀態更新為審核中", icon="🚀")
                                    import time
                                    time.sleep(1)
                                    st.rerun()  # 刷新表格
                                else:
                                    st.warning("請先勾選要派案的案件")
                    
                    with col_assign3:
                        st.write(" ")  # 對齊
                        st.write(" ")
                        if st.button("🗑️ 批量刪除", type="primary", use_container_width=True):
                            selected_rows = edited_df[edited_df["選取"]]
                            if not selected_rows.empty:
                                deleted_count = 0
                                for index, row in selected_rows.iterrows():
                                    db_manager.delete_case(row['id'])
                                    db_manager.add_log(user['username'], "刪除案件", f"單號: {row['id']}")
                                    deleted_count += 1
                                st.success(f"✅ 已刪除 {deleted_count} 筆案件")
                                st.rerun()
        cases_for_dropdown = db_manager.get_all_cases(filter_status) 
        if not cases_for_dropdown:
             st.info("目前無案件可審核。")
        else:
            df_cases = pd.DataFrame([dict(row) for row in cases_for_dropdown])
            
            # 定義顯示格式函式
            def format_case_label(case_id):
                row = df_cases[df_cases['id'] == case_id].iloc[0]
                place = row.get('place_name')
                if place is None or (isinstance(place, float) and pd.isna(place)) or str(place).strip() == "":
                    place = "(未填場所)"
                return f"{place} - {row['applicant_name']} ({row['status']})"

            selected_case_id = st.selectbox(
                "請選擇要審核的案件", 
                df_cases['id'].tolist(),
                format_func=format_case_label,
                key="tab2_selectbox"
            )
            
            if selected_case_id:
                case = db_manager.get_case_by_id(selected_case_id)
                st.divider()
                
                # Case Details
                col1, col2 = st.columns([1, 2])
                with col1:
                    st.subheader("案件詳情")
                    
                    # 定義狀態樣式
                    status = case['status']
                    if status in ["可領件", "審核通過"]:
                        status_display = f"✅ :green[{status}]"
                    elif status in ["已退件", "待補件"]:
                        status_display = f"⚠️ :red[{status}]"
                    else:
                        status_display = f"ℹ️ :blue[{status}]"

                    st.markdown(f"""
                    - **單號**: `{case['id']}`
                    - **申請人**: {case['applicant_name']}
                    - **電話**: {case['applicant_phone']}
                    - **Email**: {case['applicant_email']}
                    - **場所**: {case['place_name']} ({case['place_address']})
                    - **狀態**: {status_display}
                    """)
                    
                    if os.path.exists(case['file_path']):
                        with open(case['file_path'], "rb") as f:
                            st.download_button("📥 下載申報書", f, file_name=os.path.basename(case['file_path']))
                
                with col2:
                    st.subheader("審核操作")
                    new_status = st.selectbox("變更狀態", ["待處理", "審核中", "可領件", "已退件", "待補件"], index=["待處理", "審核中", "可領件", "已退件", "待補件"].index(case['status']) if case['status'] in ["待處理", "審核中", "可領件", "已退件", "待補件"] else 0)
                    review_notes = st.text_area("審核備註", value=case['review_notes'] if case['review_notes'] else "")
                    
                    if st.button("💾 更新狀態"):
                        db_manager.update_case_status(case['id'], new_status, review_notes)
                        db_manager.add_log(user['username'], "更新案件", f"單號: {case['id']}, 狀態: {new_status}")
                        
                        # Email Notification
                        if "email" in st.secrets:
                            sender_email = st.secrets["email"].get("sender_email", "")
                            sender_password = st.secrets["email"].get("sender_password", "")
                            if sender_email and sender_password:
                                # 依據狀態決定顏色
                                status_color = "#3182ce" # 預設藍
                                status_icon = "ℹ️"
                                if new_status in ["可領件", "審核通過"]:
                                    status_color = "#38a169" # 綠
                                    status_icon = "✅"
                                elif new_status in ["已退件", "待補件"]:
                                    status_color = "#e53e3e" # 紅
                                    status_icon = "⚠️"
                                
                                subject = f"【消防局通知】案件狀態更新：{new_status}"
                                
                                content = f"""
<p>您的消防安全設備檢修申報案件（單號：<strong>{case['id']}</strong>），狀態已有更新。</p>

<div style="background-color: #f8f9fa; border-left: 5px solid {status_color}; padding: 20px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; font-size: 14px; color: #666;">最新狀態</p>
    <h3 style="margin: 5px 0; color: {status_color}; display: flex; align-items: center;">
        {status_icon} {new_status}
    </h3>
    
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
        <p style="margin: 0; font-weight: bold; color: #4a5568;">審核備註 / 應辦事項：</p>
        <p style="margin: 5px 0; white-space: pre-wrap; color: #2d3748;">{review_notes if review_notes else "無特別備註。"}</p>
    </div>
</div>

<table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
    <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">申報場所</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">{case['place_name'] if case['place_name'] else '(未填)'}</td>
    </tr>
    <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">更新時間</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">{datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}</td>
    </tr>
</table>

<p style="margin-top: 30px; font-size: 14px; color: #666;">
    若狀態為「可領件」，請攜帶身分證件至本局{cfg.DEPARTMENT_NAME}領取核定書表。<br>
    若狀態為「已退件」，請依備註說明修正後重新送件。
</p>
"""
                                body = utils.generate_email_html(
                                    title=f"案件狀態更新：{new_status}",
                                    recipient_name=case['applicant_name'],
                                    content_html=content,
                                    color_theme=status_color
                                )
                                
                                utils.send_email(sender_email, sender_password, case['applicant_email'], subject, body)
                                st.toast("✅ Email 通知已發送")
                        
                        st.success("更新成功！")
                        st.rerun()

                st.divider()
                
                # OCR Comparison Section
                st.subheader("🔍 申報書比對")
                
                if os.path.exists(case['file_path']):
                    df_system = utils.load_system_data(system_file_path)
                    if df_system is not None:
                        col_ocr1, col_ocr2 = st.columns(2)
                        with col_ocr1:
                            if case['file_path'].lower().endswith(".pdf"):
                                images = utils.pdf_to_images(case['file_path'])
                            else:
                                images = [Image.open(case['file_path'])]
                            st.image(images[0], caption="預覽", use_container_width=True)
                            
                            if st.button("執行 OCR"):
                                with st.spinner("OCR 分析中..."):
                                    pages_text = [utils.perform_ocr(img, tesseract_path) for img in images]
                                    extracted = utils.extract_info_from_ocr(pages_text[0], pages_text)
                                    st.session_state['extracted'] = extracted
                                    st.rerun()
                        
                        with col_ocr2:
                            # 初始化變數（避免 NameError）
                            target_row = None
                            extracted_data = {}
                            
                            if 'extracted' in st.session_state:
                                extracted_data = st.session_state['extracted']
                                ocr_place_name = extracted_data.get('場所名稱', '')
                                st.write(f"OCR 辨識場所: **{ocr_place_name}**")
                                
                                # Auto-match logic
                                if ocr_place_name:
                                     match = df_system[df_system['場所名稱'] == ocr_place_name]
                                     if not match.empty:
                                         target_row = match.iloc[0]
                                     else:
                                         for idx, row in df_system.iterrows():
                                             if ocr_place_name in str(row['場所名稱']):
                                                 target_row = row
                                                 break
                            
                            if target_row is not None:
                                st.success(f"✅ 自動對應: {target_row['場所名稱']}")
                                comparison_data = []
                                field_mapping = {
                                    '場所名稱': '場所名稱',
                                    '場所地址': '場所地址',
                                    '管理權人': '管理權人姓名',
                                    '電話': '場所電話',
                                    '消防設備種類': '消防安全設備'
                                }
                                for display_name, excel_col in field_mapping.items():
                                    sys_val = target_row.get(excel_col, "")
                                    ocr_key = display_name if display_name != '電話' else '場所電話'
                                    ocr_val = extracted_data.get(ocr_key, "")
                                    if display_name == '消防設備種類':
                                        sys_val = utils.normalize_equipment_str(str(sys_val))
                                    comparison_data.append({
                                        "欄位": display_name,
                                        "系統資料": str(sys_val),
                                        "申報資料": ocr_val
                                    })
                                st.table(pd.DataFrame(comparison_data))
                            elif 'extracted' in st.session_state:
                                # OCR 已執行但找不到對應場所
                                st.warning("⚠️ 系統資料中找不到對應場所，僅顯示 OCR 辨識結果")
                                st.json(extracted_data)
                            else:
                                # 尚未執行 OCR
                                st.info("👈 請點擊左側「執行 OCR」按鈕開始辨識")
                            
# ---Page: 人員管理 (Admin Only) ---
elif page == "人員管理":
    st.title("👥 人員管理")
    
    with st.expander("新增人員", expanded=False):
        with st.form("add_user_form"):
            new_user = st.text_input("帳號")
            new_pwd = st.text_input("預設密碼", type="password")
            new_email = st.text_input("Email")
            new_role = st.selectbox("角色", ["staff", "admin"])
            if st.form_submit_button("建立"):
                success, msg = db_manager.create_user(new_user, new_pwd, new_role, new_email)
                if success:
                    st.success(msg)
                    db_manager.add_log(user['username'], "建立人員", f"帳號: {new_user}, 角色: {new_role}")
                else:
                    st.error(msg)
    
    st.subheader("人員列表")
    users = db_manager.get_all_users()
    st.dataframe(pd.DataFrame(users, columns=["帳號", "角色", "Email", "建立時間", "最後登入"]))

# --- Page: 系統紀錄 (Admin Only) ---
elif page == "系統紀錄":
    st.title("📜 系統稽核紀錄")
    logs = db_manager.get_audit_logs()
    df_logs = pd.DataFrame(logs, columns=["ID", "帳號", "動作", "詳情", "時間"])
    st.dataframe(df_logs)

# --- Page: 修改密碼 ---
elif page == "修改密碼":
    st.title("🔑 修改密碼")
    
    with st.form("change_pwd_form"):
        old_pwd = st.text_input("舊密碼", type="password")
        new_pwd = st.text_input("新密碼", type="password")
        confirm_pwd = st.text_input("確認新密碼", type="password")
        
        if st.form_submit_button("確認修改"):
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
