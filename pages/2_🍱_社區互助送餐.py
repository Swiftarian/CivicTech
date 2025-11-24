import streamlit as st
import db_manager as db
import datetime
import urllib.parse
import os
import time
import utils
import auth_session  # Cookie-based session management
from streamlit_calendar import calendar

st.set_page_config(page_title="社區互助送餐", page_icon="🍱", layout="wide")

# --- Initialize Auth State & Auto-Login ---
auth_session.initialize_auth_state()
if not st.session_state.logged_in:
    auth_session.check_auto_login()

# --- Helper Functions ---

def check_login():
    """Check if user is logged in"""
    if 'logged_in' not in st.session_state or not st.session_state['logged_in']:
        st.warning("請先登入系統")
        st.stop()
    return st.session_state['username']

def get_google_maps_url(address):
    """Generate Google Maps navigation URL"""
    encoded_address = urllib.parse.quote(address)
    return f"https://www.google.com/maps/dir/?api=1&destination={encoded_address}"



# --- Main Page ---

# --- Dialog Function ---
@st.dialog("📅 任務管理")
def task_management_dialog(task_id, route_name, current_vol, event_date, username):
    st.write(f"**日期**：{event_date}")
    st.write(f"**路線**：{route_name}")
    st.write(f"**目前志工**：{current_vol if current_vol else '無 (缺人)'}")
    
    if not current_vol:
        st.warning("⚠️ 此路線目前缺人配送！")
        if st.button("🙋‍♂️ 我要認領", key=f"claim_dlg_{task_id}"):
            db.update_task_volunteer(task_id, username)
            st.toast("✅ 認領成功！感謝您的付出", icon="🎉")
            time.sleep(1) # Give time for toast
            st.rerun()
    elif current_vol == username:
        st.success("這是您的任務")
        if st.button("🚫 請假 / 釋出任務", key=f"leave_dlg_{task_id}"):
            db.update_task_volunteer(task_id, None)
            st.toast("✅ 已取消認領", icon="👋")
            time.sleep(1)
            st.rerun()
    else:
        st.info("此任務已有其他志工負責。")

# --- Main Page ---

def main():
    username = check_login()
    st.title("🍱 社區互助送餐系統")
    
    # Initialize DB (ensure tables exist)
    db.init_db()

    tab1, tab2, tab3, tab4 = st.tabs(["🚚 今日配送", "🗓️ 排班與認領", "⚙️ 個案與路線管理", "📊 歷史紀錄與報表"])

    # --- Tab 1: Today's Delivery ---
    with tab1:
        st.header(f"👋 早安，{username}")
        today = datetime.date.today().strftime("%Y-%m-%d")
        
        # Metrics Calculation
        my_tasks = db.get_my_tasks_today(username, today)
        total_tasks_count = len(my_tasks)
        completed_tasks_count = 0
        
        # Calculate completed tasks (based on stops)
        # Logic: If all stops in a task are delivered, the task is "completed". 
        # But maybe metrics should be "Stops to deliver" vs "Stops delivered"?
        # Let's do "Total Stops" vs "Completed Stops" for better granularity.
        total_stops_count = 0
        completed_stops_count = 0
        
        for task in my_tasks:
            route_id = task['route_id']
            task_id = task['id']
            elderly_list = db.get_elderly_by_route(route_id)
            total_stops_count += len(elderly_list)
            for elderly in elderly_list:
                if db.check_delivery_status(task_id, elderly['id']):
                    completed_stops_count += 1
        
        # Display Metrics
        m1, m2, m3 = st.columns(3)
        m1.metric("📅 今日任務數", f"{total_tasks_count} 條路線")
        m2.metric("📦 需配送戶數", f"{total_stops_count} 戶")
        m3.metric("✅ 已完成戶數", f"{completed_stops_count} 戶", delta=f"{completed_stops_count - total_stops_count} 待送" if total_stops_count > 0 else None)
        
        st.divider()
        
        if not my_tasks:
            st.info("🎉 今日無排班任務，或是您可以去【排班與認領】區支援其他路線！")
        else:
            for task in my_tasks:
                route_name = task['route_name']
                route_id = task['route_id']
                task_id = task['id']
                
                st.subheader(f"📍 路線：{route_name}")
                
                # Get elderly on this route
                elderly_list = db.get_elderly_by_route(route_id)
                
                # Sort by sequence
                elderly_list.sort(key=lambda x: x['sequence'])
                
                # Progress bar
                total_stops = len(elderly_list)
                completed_stops = 0
                
                # Calculate progress first
                for elderly in elderly_list:
                    if db.check_delivery_status(task_id, elderly['id']):
                        completed_stops += 1
                
                if total_stops > 0:
                    progress = completed_stops / total_stops
                    st.progress(progress, text=f"配送進度：{completed_stops}/{total_stops}")
                
                for elderly in elderly_list:
                    elderly_id = elderly['id']
                    name = elderly['name']
                    address = elderly['address']
                    diet = elderly['diet_type']
                    notes = elderly['special_notes']
                    
                    # Check if already delivered
                    is_delivered = db.check_delivery_status(task_id, elderly_id)
                    
                    # Card Style
                    card_border = "1px solid #ddd"
                    bg_color = "#f9f9f9"
                    if is_delivered:
                        bg_color = "#e0e0e0" # Gray out
                        
                    with st.expander(f"{'✅' if is_delivered else '📦'} {name} - {address}", expanded=not is_delivered):
                        col1, col2 = st.columns([2, 1])
                        
                        with col1:
                            # Diet Tag
                            diet_color = "blue"
                            if "素" in diet: diet_color = "green"
                            elif "切碎" in diet: diet_color = "orange"
                            elif "低鹽" in diet: diet_color = "purple"
                            st.markdown(f":{diet_color}[**{diet}**]")
                            
                            if notes:
                                st.warning(f"⚠️ 注意事項：{notes}")
                                
                            st.markdown(f"📍 **地址**：{address}")
                            st.link_button("🗺️ Google 導航", get_google_maps_url(address))
                            
                        with col2:
                            if is_delivered:
                                st.success("已完成配送")
                            else:
                                # 強制拍照流程
                                st.write("📷 **送達證明 (必須拍照)**")
                                st.caption("⚠️ 請拍攝餐點+門牌證明")
                                
                                photo = st.camera_input(
                                    f"📸 拍攝送達證明", 
                                    key=f"cam_{elderly_id}",
                                    label_visibility="collapsed"
                                )
                                
                                st.markdown("<br>", unsafe_allow_html=True)
                                
                                # 只有在有照片時才顯示按鈕
                                if photo is not None:
                                    col_deliver, col_issue = st.columns(2)
                                    
                                    with col_deliver:
                                        if st.button("✅ 確認送達並上傳", key=f"btn_ok_{elderly_id}", use_container_width=True, type="primary"):
                                            # 使用新的 save_proof_photo
                                            photo_path = utils.save_proof_photo(photo, task_id)
                                            
                                            db.create_delivery_record(task_id, elderly_id, "已送達", photo_path=photo_path, volunteer_id=username)
                                            
                                            # UI Feedback
                                            st.toast("✅ 送達成功！感謝您的付出", icon="🎉")
                                            st.balloons()
                                            time.sleep(1.5) # Wait for balloons
                                            st.rerun()
                                    
                                    with col_issue:
                                        if st.button("⚠️ 異常", key=f"btn_err_{elderly_id}", use_container_width=True):
                                            st.session_state[f"show_issue_{elderly_id}"] = True
                                else:
                                    st.warning("🚫 請先拍照才能送達")
                                
                                # 異常回報處理
                                if st.session_state.get(f"show_issue_{elderly_id}"):
                                    st.markdown("<br>", unsafe_allow_html=True)
                                    issue_reason = st.selectbox("異常類型", ["長者不在家", "長者拒收", "餐點損壞", "長者身體不適", "其他"], key=f"reason_{elderly_id}")
                                    issue_note = st.text_area("備註說明 (選填)", key=f"issue_{elderly_id}")
                                    if st.button("確認回報", key=f"confirm_issue_{elderly_id}"):
                                        # 異常情況也必須有照片
                                        if photo is not None:
                                            photo_path = utils.save_proof_photo(photo, task_id)
                                            db.create_delivery_record(task_id, elderly_id, "異常", notes=issue_note, volunteer_id=username, abnormal_reason=issue_reason, photo_path=photo_path)
                                            st.toast("⚠️ 異常回報已提交", icon="🛡️")
                                            st.session_state[f"show_issue_{elderly_id}"] = False
                                            time.sleep(1)
                                            st.rerun()
                                        else:
                                            st.error("請先拍照再回報異常")

    # --- Tab 2: Scheduling & Claiming ---
    with tab2:
        st.header("🗓️ 排班表 (互動式日曆)")
        
        # 1. 準備資料
        # 取得前後一個月的任務 (或是全部，視資料量而定，這裡先取前後 30 天)
        start_date = (datetime.date.today() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
        end_date = (datetime.date.today() + datetime.timedelta(days=60)).strftime("%Y-%m-%d")
        
        tasks = db.get_tasks_by_date_range(start_date, end_date)
        
        # 2. 使用後端函式獲取日曆事件
        events = db.get_task_events(start_date, end_date, current_user=username)
            
        # 3. 設定 Calendar 選項
        calendar_options = {
            "editable": False,
            "navLinks": True,
            "headerToolbar": {
                "left": "today prev,next",
                "center": "title",
                "right": "dayGridMonth,listWeek"
            },
            "initialView": "dayGridMonth",
            "selectable": True,
        }
        
        # 4. 顯示 Calendar
        cal_state = calendar(events=events, options=calendar_options, key="meal_calendar")
        
        # 5. 處理點擊事件 (使用 Dialog)
        if cal_state.get("eventClick"):
            event = cal_state["eventClick"]["event"]
            props = event["extendedProps"]
            task_id = props["taskId"]
            current_vol = props["currentVolunteer"]
            route_name = props["routeName"]
            
            # 呼叫 Dialog
            task_management_dialog(task_id, route_name, current_vol, event["start"], username)
                    
        # 6. 新增任務按鈕 (如果某天沒有任務)
        # 這裡可以做一個簡單的介面來新增特定日期的任務
        st.divider()
        with st.expander("➕ 新增排班任務"):
            with st.form("add_task_form"):
                new_task_date = st.date_input("日期", min_value=datetime.date.today())
                # 轉換為字典以避免 pickle 錯誤
                routes_list = [dict(r) for r in db.get_all_routes()]
                new_task_route = st.selectbox("路線", options=routes_list, format_func=lambda x: x['route_name'])
                if st.form_submit_button("新增任務"):
                    # Check if exists?
                    # For simplicity, just create. DB might need unique constraint or check logic.
                    # Assuming one task per route per day.
                    existing = db.get_tasks_by_date(new_task_date.strftime("%Y-%m-%d"))
                    exists = any(t['route_id'] == new_task_route['id'] for t in existing)
                    
                    if exists:
                        st.error("該日期此路線已存在任務！")
                    else:
                        db.create_daily_task(new_task_date.strftime("%Y-%m-%d"), new_task_route['id'], None)
                        st.toast("✅ 任務已建立！", icon="📅")
                        time.sleep(1)
                        st.rerun()

    # --- Tab 3: Admin Management ---
    with tab3:
        # Check if admin (optional, user said "Admin Only" but didn't specify strict role check, 
        # but I should probably check if role is admin or just let everyone access for now as per "Admin Only" hint)
        # The user said "Admin Only" in the text. I'll check st.session_state.get('role') if available, 
        # but db_manager.py's check_login doesn't return role.
        # I'll fetch user role.
        
        user_info = db.get_user(username)
        role = user_info['role'] if user_info else 'user'
        
        if role != 'admin':
            st.error("此區域僅限管理員進入")
        else:
            st.header("⚙️ 管理後台")
            
            col_a, col_b = st.columns(2)
            
            # 先獲取路線資料供後續使用
            routes = db.get_all_routes()
            
            with col_a:
                st.subheader("長者資料管理")
                
                # Fetch all elderly profiles
                profiles = db.get_all_elderly()
                # Convert to DataFrame for editor
                import pandas as pd
                if profiles:
                    df = pd.DataFrame([dict(p) for p in profiles])
                    
                    # Configure columns
                    column_config = {
                        "id": st.column_config.NumberColumn("ID", disabled=True),
                        "name": "姓名",
                        "address": "地址",
                        "phone": "電話",
                        "diet_type": st.column_config.SelectboxColumn("飲食類型", options=["一般", "素食", "切碎", "低鹽", "流質"]),
                        "route_id": st.column_config.SelectboxColumn("所屬路線", options=[r['id'] for r in routes], help="對應路線ID"), # Ideally map to names, but ID is simpler for now or need a mapping
                        "sequence": st.column_config.NumberColumn("順序", min_value=1),
                        "status": st.column_config.SelectboxColumn("狀態", options=["啟用", "停用"]),
                        "created_at": st.column_config.DatetimeColumn("建立時間", disabled=True),
                        "gps_lat": None, # Hide
                        "gps_lon": None, # Hide
                        "special_notes": "備註"
                    }
                    
                    edited_df = st.data_editor(
                        df,
                        column_config=column_config,
                        num_rows="dynamic",
                        key="elderly_editor",
                        use_container_width=True,
                        hide_index=True
                    )
                    
                    # Handle Updates
                    # This is tricky with st.data_editor. We need to detect changes.
                    # Streamlit doesn't give a callback with changes easily unless we use on_change and session state.
                    # But for simplicity, we can just iterate and update if we want, OR rely on the user to click "Save" if we implement a manual save.
                    # However, st.data_editor returns the edited dataframe.
                    # A better approach for real-time DB update is to compare or use a callback.
                    # Let's use a "Save Changes" button for safety and clarity, or just assume immediate update?
                    # The prompt says "Implement st.data_editor for CRUD".
                    # Let's try to detect changes.
                    
                    # Actually, st.data_editor has `on_change` but it's for the widget state.
                    # Let's add a "💾 儲存變更" button to commit changes from `edited_df` to DB.
                    if st.button("💾 儲存長者資料變更"):
                        # We need to compare `df` and `edited_df` or just update all? Updating all is inefficient.
                        # Better: Iterate over edited_df and update each record.
                        # For new records (no ID), create them.
                        # For deleted records? st.data_editor handles deletion if `num_rows="dynamic"`.
                        # But `edited_df` only contains the current rows. We need to find missing IDs to delete.
                        
                        current_ids = set(df['id'].tolist())
                        new_ids = set(edited_df['id'].dropna().tolist())
                        
                        # 1. Update existing & Create new
                        for index, row in edited_df.iterrows():
                            if pd.isna(row['id']): # New row (ID is NaN usually for new rows in some configs, or we need to handle it)
                                # Actually st.data_editor new rows might have None/NaN ID if we didn't set it.
                                # We should check if 'id' exists in DB.
                                db.create_elderly_profile(
                                    row['name'], row['address'], row['phone'], 
                                    diet_type=row['diet_type'], special_notes=row['special_notes'], 
                                    route_id=row['route_id'], sequence=row['sequence']
                                )
                            else:
                                # Update
                                updates = {
                                    "name": row['name'],
                                    "address": row['address'],
                                    "phone": row['phone'],
                                    "diet_type": row['diet_type'],
                                    "special_notes": row['special_notes'],
                                    "route_id": row['route_id'],
                                    "sequence": row['sequence'],
                                    "status": row['status']
                                }
                                db.update_elderly_profile_fields(row['id'], updates)
                        
                        # 2. Delete removed
                        # IDs in current but not in new
                        deleted_ids = current_ids - new_ids
                        for pid in deleted_ids:
                            db.delete_elderly_profile(pid)
                            
                        st.success("資料已更新")
                        st.rerun()
                else:
                    st.info("尚無長者資料")
                    # Still show editor for adding new?
                    # If empty, create empty DF
                    df = pd.DataFrame(columns=["id", "name", "address", "phone", "diet_type", "route_id", "sequence", "status", "special_notes"])
                    edited_df = st.data_editor(df, num_rows="dynamic", key="elderly_editor_empty")
                    if st.button("💾 儲存新增資料"):
                        for index, row in edited_df.iterrows():
                            if row['name']:
                                db.create_elderly_profile(
                                    row['name'], row['address'], row['phone'], 
                                    diet_type=row['diet_type'], special_notes=row['special_notes'], 
                                    route_id=row['route_id'], sequence=row['sequence']
                                )
                        st.success("資料已新增")
                        st.rerun()

            with col_b:
                st.subheader("新增路線")
                with st.form("add_route_form"):
                    r_name = st.text_input("路線名稱")
                    r_desc = st.text_input("描述")
                    r_vol = st.selectbox("預設志工", [None] + db.get_all_usernames())
                    
                    if st.form_submit_button("新增路線"):
                        if r_name:
                            db.create_delivery_route(r_name, r_desc, r_vol)
                            st.success("已新增")
                            time.sleep(1)
                            st.rerun()

    # --- Tab 4: History & Reports ---
    with tab4:
        user_info = db.get_user(username)
        role = user_info['role'] if user_info else 'user'
        
        if role != 'admin':
            st.error("此區域僅限管理員進入")
        else:
            st.header("📊 歷史紀錄與報表")
            
            c1, c2 = st.columns(2)
            with c1:
                start_date = st.date_input("開始日期", datetime.date.today() - datetime.timedelta(days=30))
            with c2:
                end_date = st.date_input("結束日期", datetime.date.today())
                
            if start_date > end_date:
                st.error("開始日期不能晚於結束日期")
            else:
                # Fetch data
                report_data = db.get_delivery_reports(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"))
                
                if report_data:
                    import pandas as pd
                    df_report = pd.DataFrame([dict(r) for r in report_data])
                    
                    # Rename columns for display
                    df_report = df_report.rename(columns={
                        "date": "日期",
                        "route_name": "路線",
                        "elderly_name": "長者姓名",
                        "volunteer_id": "志工帳號",
                        "status": "狀態",
                        "abnormal_reason": "異常原因",
                        "notes": "備註",
                        "photo_path": "送達證明",
                        "delivery_time": "打卡時間"
                    })
                    
                    # 配置 ImageColumn
                    column_config = {
                        "送達證明": st.column_config.ImageColumn(
                            "📸 送達證明",
                            help="點擊查看大圖",
                            width="small"
                        )
                    }
                    
                    st.dataframe(
                        df_report, 
                        use_container_width=True,
                        column_config=column_config
                    )
                    
                    # CSV Download
                    csv = df_report.to_csv(index=False).encode('utf-8-sig')
                    st.download_button(
                        label="📥 下載報表 (CSV)",
                        data=csv,
                        file_name=f"送餐紀錄_{start_date}_{end_date}.csv",
                        mime="text/csv"
                    )
                else:
                    st.info("查無資料")

    # ==========================================
    # 除錯工具區 (僅管理員可見)
    # ==========================================
    user_info = db.get_user(username)
    if user_info and user_info['role'] == 'admin':
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.divider()
        
        with st.expander("🔧 開發者除錯工具"):
            st.warning("⚠️ 管理員專區：以下操作將影響系統資料")
            
            col_debug1, col_debug2 = st.columns(2)
            
            with col_debug1:
                st.subheader("🔄 資料重置")
                st.caption("清空所有送餐資料並重新載入測試資料")
                
                if st.button("🗑️ 重置所有送餐資料", type="secondary", use_container_width=True):
                    with st.spinner("正在重置資料..."):
                        success = db.reset_meal_data()
                        if success:
                            st.success("✅ 資料重置成功！測試帳號: volunteer1 / 123")
                            st.info("📅 已建立今天與未來7天的排班資料")
                            st.balloons()
                            time.sleep(1)
                            st.rerun()
                        else:
                            st.error("❌ 重置失敗，請查看終端機錯誤訊息")
            
            with col_debug2:
                st.subheader("📊 資料統計")
                conn = db.get_connection()
                c = conn.cursor()
                
                c.execute("SELECT COUNT(*) FROM delivery_routes")
                route_count = c.fetchone()[0]
                
                c.execute("SELECT COUNT(*) FROM elderly_profiles")
                elderly_count = c.fetchone()[0]
                
                c.execute("SELECT COUNT(*) FROM daily_tasks WHERE date = ?", (datetime.date.today().strftime("%Y-%m-%d"),))
                today_tasks = c.fetchone()[0]
                
                conn.close()
                
                st.metric("路線數", route_count)
                st.metric("長者數", elderly_count)
                st.metric("今日任務", today_tasks)

if __name__ == "__main__":
    main()
