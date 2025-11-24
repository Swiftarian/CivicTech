# -*- coding: utf-8 -*-
import streamlit as st
import db_manager
import datetime
import utils
from streamlit_calendar import calendar

# ==========================================
# 頁面設定
# ==========================================
st.set_page_config(
    page_title="臺東縣消防局 防災教育館",
    page_icon="📢",
    layout="wide"
)

# 載入自訂 CSS
utils.load_custom_css()

# ==========================================
# Hero Banner (橫幅圖片) - 升級版
# ==========================================
st.image("C:/Users/User/.gemini/antigravity/brain/1222b519-4ee4-4470-8916-1a7360e613d7/uploaded_image_1763923437895.png", use_container_width=True)

st.markdown("""
    <div style="text-align: center; margin-top: -50px; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; font-size: 3em; font-weight: bold;"> 臺東縣消防局 防災教育館</h1>
        <p style="color: #7f8c8d; font-size: 1.3em;">體驗防災知識 · 守護生命安全</p>
    </div>
""", unsafe_allow_html=True)

# ==========================================
# 側邊欄導航 - 完整版(6個選項)
# ==========================================
st.sidebar.title(" 防災館導覽")
page = st.sidebar.radio(
    "選擇功能",
    [" 關於本館", " 最新消息", " 館內設施", " 交通資訊", " 預約參觀", " 防災知識與影音"],
    label_visibility="collapsed"
)

st.sidebar.divider()
st.sidebar.caption("開館時間")
st.sidebar.info("週二至週日 09:00-12:00 / 14:00-17:00  \n(週一休館)")

# ==========================================
# 頁面 1:  關於本館 (新增)
# ==========================================
if page == " 關於本館":
    st.header(" 關於本館")
    st.markdown("<br>", unsafe_allow_html=True)
    
    col_about1, col_about2 = st.columns([2, 1])
    
    with col_about1:
        st.subheader(" 設立宗旨")
        st.markdown(
            "臺東縣消防局防災教育館成立於 2020 年, 旨在透過互動式體驗教學, 提升民眾防災意識與應變能力.\n"
            "本館結合最新科技與實作訓練, 為全齡層民眾打造完整的防災教育環境.\n\n"
            "#### 核心理念\n"
            "-  **預防勝於救災**: 建立正確防災觀念\n"
            "- ‍👦 **全民防災教育**: 服務各年齡層民眾\n"
            "-  **社區與學校合作**: 深耕在地防災文化\n"
            "-  **科技與創新**: 運用VR, AR等互動科技"
        )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.subheader(" 服務對象")
        col_s1, col_s2, col_s3 = st.columns(3)
        with col_s1:
            st.info("** 學童團體**\n幼兒園至高中")
        with col_s2:
            st.info("** 一般民眾**\n個人或家庭參觀")
        with col_s3:
            st.info("** 機關團體**\n企業, 社區組織")
    
    with col_about2:
        st.subheader(" 開放資訊")
        st.success(
            "**開館時間**\n"
            "週二至週日\n"
            "09:00 - 12:00 / 14:00 - 17:00\n"
            "(最後入館時間 16:30)\n\n"
            "**休館日**\n"
            "每週一\n"
            "農曆春節\n\n"
            "**參觀費用**\n"
            "免費參觀\n\n"
            "**預約方式**\n"
            "線上預約系統\n"
            "(建議提前3天預約)"
        )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.subheader(" 聯絡我們")
        st.info(
            "**服務電話**\n"
            "089-322112\n\n"
            "**Email**\n"
            "museum@ttfd.gov.tw\n\n"
            "**地址**\n"
            "950 臺東縣臺東市四維路二段100號"
        )

# ==========================================
# 頁面 2:  最新消息(2025-11更新)
# ==========================================
elif page == " 最新消息":
    st.header(" 最新消息 & 公告")
    st.markdown("<br>", unsafe_allow_html=True)
    
    # 公告卡片
    col_news1, col_news2 = st.columns(2)
    
    with col_news1:
        with st.container():
            st.info(
                "#### 【活動】2025 冬季防火宣導月開跑\n"
                "**發布日期: 2025-11-01**\n\n"
                "天氣轉涼, 請注意用火用電安全. 本館於 **11/15 舉辦「防範一氧化碳中毒」特別講座**,\n"
                "歡迎縣民報名參加. 講座內容包含熱水器安全使用, 通風重要性, 五要原則等實用知識."
            )
            
        st.markdown("<br>", unsafe_allow_html=True)
        
        with st.container():
            st.success(
                "#### 【榮譽】本館榮獲 2025 數位防災優良場域\n"
                "**發布日期: 2025-10-25**\n\n"
                "感謝縣民支持, 本館榮獲數發部頒發「2025 年度優良智慧場域」殊榮!\n"
                "未來將持續結合科技與防災教育, 提供更優質的體驗服務."
            )
    
    with col_news2:
        with st.container():
            st.warning(
                "#### 【公告】館內設施維護通知\n"
                "**發布日期: 2025-11-10**\n\n"
                "為提供更優質的體驗, **11/20 (三) 全日進行設施維護**, 當日暫停開放.\n"
                "造成不便, 敬請見諒."
            )

# ==========================================
# 頁面 3:  館內設施
# ==========================================
elif page == " 館內設施":
    st.header(" 館內設施導覽")
    st.markdown("<br>", unsafe_allow_html=True)
    
    # 使用 Tabs 或 Expander 展示不同區域
    topic = st.radio(
        "選擇體驗區域",
        [" 火災防護", " 地震應變", " 颱風防災", " 水災應對", " 緊急救護"],
        horizontal=True
    )
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    if topic == " 火災防護":
        with st.expander(" 火災預防與逃生", expanded=True):
            col_fire1, col_fire2 = st.columns(2)
            
            with col_fire1:
                st.markdown(
                    "#### 火災預防要點\n"
                    "- 定期檢查電線, 避免老舊電線走火\n"
                    "- 不在床上吸菸\n"
                    "- 廚房用火不離人\n"
                    "- 定期更換瓦斯管線\n"
                    "- 安裝住警器"
                )
            
            with col_fire2:
                st.markdown(
                    "#### 火場逃生原則\n"
                    "1. **低姿勢爬行**: 濃煙在上方, 保持低姿勢\n"
                    "2. **關門阻火**: 隨手關門延緩火勢蔓延\n"
                    "3. **往下逃生**: 不搭電梯, 走樓梯往下\n"
                    "4. **濕毛巾摀口鼻**: 過濾煙霧"
                )
    
    elif topic == " 地震應變":
        with st.expander(" 地震避難與準備", expanded=True):
            st.markdown(
                "### 地震來襲時的應變\n\n"
                "####  在室內\n"
                "- **趴下(Drop)**: 立即蹲低\n"
                "- **掩護(Cover)**: 躲在桌下, 保護頭部\n"
                "- **穩住(Hold On)**: 抓緊桌腳, 避免桌子移動\n\n"
                "####  在車上\n"
                "- 減速靠邊停車\n"
                "- 留在車內, 拉手剎車\n"
                "- 打開收音機接收訊息\n\n"
                "### 地震包準備清單"
            )
            
            col_eq1, col_eq2, col_eq3 = st.columns(3)
            
            with col_eq1:
                st.markdown(
                    "**基本用品**\n"
                    "- 飲用水(每人每日3公升)\n"
                    "- 乾糧, 餅乾\n"
                    "- 手電筒\n"
                    "- 收音機\n"
                    "- 電池"
                )
            
            with col_eq2:
                st.markdown(
                    "**醫療用品**\n"
                    "- 急救包\n"
                    "- 常備藥品\n"
                    "- 口罩\n"
                    "- 溫度計\n"
                    "- 消毒酒精"
                )
            
            with col_eq3:
                st.markdown(
                    "**重要文件**\n"
                    "- 身分證影本\n"
                    "- 健保卡影本\n"
                    "- 存摺影本\n"
                    "- 緊急聯絡清單\n"
                    "- 現金"
                )
    
    elif topic == " 颱風防災":
        with st.expander(" 颱風來臨前的準備", expanded=True):
            st.markdown(
                "### 颱風來臨前\n\n"
                "####  居家準備\n"
                "- 清理排水孔, 水溝\n"
                "- 固定花盆, 招牌等容易吹落物品\n"
                "- 準備手電筒, 蠟燭\n"
                "- 檢查門窗是否牢固\n"
                "- 儲備3天以上的食物與飲水\n\n"
                "####  資訊掌握\n"
                "- 隨時收聽氣象預報\n"
                "- 注意停班停課訊息\n"
                "- 確認避難場所位置\n\n"
                "### 颱風期間\n"
                "-  不外出, 不到海邊\n"
                "-  遠離門窗, 低窪地區\n"
                "-  避免使用電梯\n"
                "- 保持手機電力充足"
            )
    
    elif topic == " 水災應對":
        with st.expander(" 淹水應變措施", expanded=True):
            st.markdown(
                "### 淹水前準備\n"
                "- 關注水情資訊\n"
                "- 準備沙包\n"
                "- 將貴重物品移至高處\n"
                "- 關閉電源總開關與瓦斯\n\n"
                "### 淹水時應變\n"
                "- 往高處移動\n"
                "- 避免涉水, 水深超過膝蓋不可行走\n"
                "- 注意下水道, 水溝蓋\n"
                "- 立即撥打119求援\n\n"
                "### 水退後處理\n"
                "- 清理環境, 防止傳染病\n"
                "- 檢查電器設備, 確認安全再通電\n"
                "- 整理受損物品\n"
                "- 申請災害補助"
            )
    
    elif topic == " 緊急救護":
        with st.expander(" CPR與AED使用", expanded=True):
            st.markdown(
                "### CPR步驟(叫叫CAB)\n\n"
                "1. **叫**: 確認患者意識, 輕拍肩膀大聲呼喚\n"
                "2. **叫**: 請旁人協助撥打119, 拿AED\n"
                "3. **C**: 胸部按壓(Compression)\n"
                "   - 雙手交疊, 掌根置於胸骨下半部\n"
                "   - 下壓深度5-6公分\n"
                "   - 速度每分鐘100-120次\n"
                "4. **A**: 暢通呼吸道(Airway)\n"
                "5. **B**: 人工呼吸(Breathing)\n\n"
                "### AED使用步驟\n"
                "1. 開啟AED電源\n"
                "2. 依語音指示貼上電極片\n"
                "3. 按下分析鈕, 不碰觸患者\n"
                "4. 依指示按下電擊鈕\n"
                "5. 繼續CPR直到救護車抵達"
            )

# ==========================================
# 頁面 4:  交通資訊 (新增)
# ==========================================
elif page == " 交通資訊":
    st.header(" 交通資訊")
    st.markdown("<br>", unsafe_allow_html=True)
    
    col_traffic1, col_traffic2 = st.columns([2, 1])
    
    with col_traffic1:
        st.subheader(" 地圖位置")
        # 嵌入 Google Maps 連結按鈕
        st.link_button(" 開啟 Google Maps 導航", "https://www.google.com/maps/search/?api=1&query=臺東縣消防局防災教育館")
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.subheader(" 交通指引")
        st.info(
            "####  自行開車\n"
            "- **南下**: 沿台9線進入臺東市區 -> 更生北路 -> 四維路二段 -> 抵達本館\n"
            "- **北上**: 沿台11線進入臺東市區 -> 中華路 -> 四維路二段 -> 抵達本館\n\n"
            "####  停車資訊\n"
            "- 本館設有免費停車場 (約30個車位)\n"
            "- 周邊道路設有路邊停車格"
        )
        
        st.warning(
            "####  搭乘公車\n"
            "- **普悠瑪客運**: 搭乘市區觀光循環線, 於「消防局站」下車, 步行約 2 分鐘\n"
            "- **鼎東客運**: 搭乘海線/山線班次, 於「臺東轉運站」轉乘計程車約 10 分鐘"
        )
    
    with col_traffic2:
        st.subheader(" 聯絡資訊")
        st.markdown(
            "**地址**\n"
            "950 臺東縣臺東市四維路二段100號\n\n"
            "**電話**\n"
            "089-322112\n\n"
            "**搭乘計程車**\n"
            "從臺東火車站出發約 15 分鐘\n"
            "從臺東機場出發約 20 分鐘"
        )

# ==========================================
# 頁面 5:  預約參觀 (升級版)
# ==========================================
elif page == " 預約參觀":
    st.header(" 預約參觀系統")
    
    tab_reserve, tab_check_capacity, tab_my_bookings = st.tabs([" 新增預約", " 查詢剩餘名額", " 查詢我的預約"])
    
    # Tab 1: 新增預約 (完整日曆版)
    with tab_reserve:
        # 使用 session_state 管理選擇的日期
        if 'selected_date' not in st.session_state:
            st.session_state.selected_date = None
        
        # Step 1: 顯示完整日曆
        if st.session_state.selected_date is None:
            st.subheader("📅 請選擇參觀日期")
            st.info("💡 點擊日曆中的日期，查看該日可預約時段並填寫預約資料。綠色標記表示該日有空檔，紅色表示休館日或已額滿。")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            # 準備日曆事件資料
            calendar_events = []
            
            # 生成未來60天的事件
            time_slots = ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"]
            
            for i in range(1, 61):
                future_date = datetime.date.today() + datetime.timedelta(days= i)
                date_str = future_date.strftime("%Y-%m-%d")
                weekday = future_date.weekday()
                
                # 週一休館日
                if weekday == 0:
                    calendar_events.append({
                        "title": "🔴 休館日",
                        "start": date_str,
                        "end": date_str,
                        "backgroundColor": "#dc3545",
                        "borderColor": "#dc3545",
                        "allDay": True
                    })
                else:
                    # 計算該日的總預約數
                    total_count = 0
                    available_slots = []
                    
                    for slot in time_slots:
                        count = db_manager.get_booking_count_by_slot(date_str, slot)
                        total_count += count
                        remaining = 50 - count
                        if remaining > 0:
                            available_slots.append(f"{slot} ({remaining}人)")
                    
                    # 總容量：4個時段 * 每時段50人 = 200人
                    total_remaining = 200 - total_count
                    
                    if total_remaining > 100:
                        color = "#28a745"  # 綠色：空檔充足
                        title = f"🟢 空檔充足"
                    elif total_remaining > 50:
                        color = "#ffc107"  # 黃色：尚有空檔
                        title = f"🟡 尚有空檔"
                    elif total_remaining > 0:
                        color = "#fd7e14"  # 橘色：名額有限
                        title = f"🟠 名額有限"
                    else:
                        color = "#dc3545"  # 紅色：已額滿
                        title = f"🔴 已額滿"
                    
                    # 為每個有空檔的時段建立獨立事件
                    for slot in available_slots:
                        calendar_events.append({
                            "title": slot,
                            "start": date_str,
                            "end": date_str,
                            "backgroundColor": color,
                            "borderColor": color,
                            "allDay": False
                        })
            
            # 日曆選項
            calendar_options = {
                "initialView": "dayGridMonth",
                "initialDate": (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
                "headerToolbar": {
                    "left": "prev,next today",
                    "center": "title",
                    "right": "dayGridMonth"
                },
                "locale": "zh-tw",
                "firstDay": 0,
                "height": 650,
                "editable": False,
                "selectable": True,
                "selectMirror": True,
                "dayMaxEvents": True,
                "validRange": {
                    "start": (datetime.date.today() + datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
                    "end": (datetime.date.today() + datetime.timedelta(days=61)).strftime("%Y-%m-%d")
                }
            }
            
            # 顯示日曆
            cal_return = calendar(events=calendar_events, options=calendar_options, key="museum_calendar")
            
            # 處理日曆點擊事件
            if cal_return and 'dateClick' in cal_return and cal_return['dateClick']:
                clicked_date = cal_return['dateClick']['date']
                # 移除時間部分，只保留日期
                if 'T' in clicked_date:
                    clicked_date = clicked_date.split('T')[0]
                
                # 驗證日期
                clicked_date_obj = datetime.datetime.strptime(clicked_date, "%Y-%m-%d").date()
                
                # 檢查是否為週一
                if clicked_date_obj.weekday() == 0:
                    st.error("⚠️ 該日為休館日（週一），請選擇其他日期")
                elif clicked_date_obj <= datetime.date.today():
                    st.error("⚠️ 請選擇明日之後的日期")
                else:
                    st.session_state.selected_date = clicked_date
                    st.rerun()
                
        # Step 2: 顯示預約表單（已選擇日期後）
        else:
            selected_date_obj = datetime.datetime.strptime(st.session_state.selected_date, "%Y-%m-%d").date()
            weekday = ["一","二","三","四","五","六","日"][selected_date_obj.weekday()]
            
            st.success(f"✅ 您選擇的參觀日期：**{st.session_state.selected_date}** (週{weekday})")
            
            col_back1, col_back2 = st.columns([1, 5])
            with col_back1:
                if st.button("← 重新選擇日期"):
                    st.session_state.selected_date = None
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)
            st.subheader("填寫預約資訊")
            
            with st.form("booking_form"):
                # 新增: 參觀類型選擇
                visit_type = st.radio(
                    "參觀類型 *",
                    ["個人/家庭", "學校/機關團體"],
                    horizontal=True
                )
                
                st.markdown("<br>", unsafe_allow_html=True)
                
                col_form1, col_form2 = st.columns(2)
                
                with col_form1:
                    # 顯示已選擇的日期（只讀）
                    st.text_input(
                        "參觀日期",
                        value=f"{st.session_state.selected_date} (週{weekday})",
                        disabled=True
                    )
                    
                    time_slot = st.selectbox(
                        "參觀時段 *",
                        ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"]
                    )
                    
                    # 顯示該時段剩餘名額
                    current_count = db_manager.get_booking_count_by_slot(
                        st.session_state.selected_date,
                        time_slot
                    )
                    remaining = 50 - current_count
                    
                    if remaining > 30:
                        st.info(f"💺 該時段剩餘名額：**{remaining}** 人")
                    elif remaining > 10:
                        st.warning(f"⚠️ 該時段剩餘名額：**{remaining}** 人")
                    elif remaining > 0:
                        st.error(f"🚨 該時段名額有限：僅剩 **{remaining}** 人")
                    else:
                        st.error("❌ 該時段已額滿，請選擇其他時段")
                    
                    # 動態顯示人數欄位
                    if visit_type == "學校/機關團體":
                        visitor_count = st.number_input("預計人數 *", min_value=10, max_value=50, value=20)
                    else:
                        visitor_count = st.number_input("人數 *", min_value=1, max_value=10, value=2)
                
                with col_form2:
                    applicant_name = st.text_input("聯絡人姓名 *")
                    applicant_phone = st.text_input("聯絡電話 *", placeholder="0912-345-678")
                    
                    # 動態顯示團體名稱
                    if visit_type == "學校/機關團體":
                        organization = st.text_input("團體/單位名稱 *", placeholder="例如: 臺東縣XX國小")
                    else:
                        organization = st.text_input("單位/學校名稱 (選填)")
                    
                    email = st.text_input("Email (選填)")
                
                st.caption("* 為必填欄位")
                
                submitted = st.form_submit_button("提交預約", type="primary", use_container_width=True)
                
                if submitted:
                    # 驗證必填欄位
                    if not applicant_name or not applicant_phone:
                        st.error("請填寫聯絡人姓名與電話! ")
                    elif visit_type == "學校/機關團體" and not organization:
                        st.error("團體預約請填寫團體/單位名稱! ")
                    elif remaining <= 0:
                        st.error("該時段已額滿，請重新選擇日期或時段！")
                    elif remaining < visitor_count:
                        st.error(f"該時段剩餘名額不足！僅剩 {remaining} 人，但您預約 {visitor_count} 人")
                    else:
                        booking_id = db_manager.create_museum_booking(
                            st.session_state.selected_date,
                            time_slot,
                            applicant_name,
                            applicant_phone,
                            visitor_count,
                            organization,
                            email
                        )
                        st.success(f"🎉 預約成功! 預約編號: **{booking_id}**")
                        st.info(f"📋 **{visit_type}** 預約\n人數: {visitor_count} 人\n請保存您的聯絡電話 **{applicant_phone}**, 以便查詢或取消預約.")
                        st.session_state.selected_date = None  # 清除選擇的日期
    
    
    # Tab 2: 查詢剩餘名額
    with tab_check_capacity:
        st.subheader("查詢各時段剩餘名額")
        
        query_date = st.date_input(
            "選擇日期",
            min_value=datetime.date.today(),
            max_value=datetime.date.today() + datetime.timedelta(days=60),
            key="query_date"
        )
        
        if st.button(" 查詢", key="check_capacity"):
            time_slots = ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"]
            
            capacity_data = []
            for slot in time_slots:
                count = db_manager.get_booking_count_by_slot(
                    query_date.strftime("%Y-%m-%d"),
                    slot
                )
                remaining = 50 - count
                capacity_data.append({
                    "時段": slot,
                    "已預約": count,
                    "剩餘名額": remaining,
                    "狀態": " 可預約" if remaining > 10 else " 名額有限" if remaining > 0 else " 已額滿"
                })
            
            import pandas as pd
            df_capacity = pd.DataFrame(capacity_data)
            st.dataframe(df_capacity, use_container_width=True, hide_index=True)
    
    # Tab 3: 查詢我的預約
    with tab_my_bookings:
        st.subheader("查詢我的預約記錄")
        
        query_phone = st.text_input("請輸入預約時使用的電話號碼", key="query_phone")
        
        if st.button(" 查詢預約", key="check_bookings"):
            if query_phone:
                bookings = db_manager.get_bookings_by_phone(query_phone)
                
                if bookings:
                    import pandas as pd
                    df_bookings = pd.DataFrame([dict(b) for b in bookings])
                    
                    # 只顯示相關欄位
                    display_df = df_bookings[['id', 'visit_date', 'time_slot', 'applicant_name', 'visitor_count', 'organization', 'status']]
                    display_df.columns = ['預約編號', '參觀日期', '時段', '聯絡人', '人數', '團體名稱', '狀態']
                    
                    st.dataframe(display_df, use_container_width=True, hide_index=True)
                    
                    # 取消預約功能
                    st.markdown("<br>", unsafe_allow_html=True)
                    cancel_id = st.number_input("輸入要取消的預約編號", min_value=1, step=1, key="cancel_id")
                    if st.button("❌ 取消預約", type="secondary"):
                        if db_manager.cancel_museum_booking(cancel_id):
                            st.success("預約已取消")
                            st.rerun()
                        else:
                            st.error("取消失敗, 請檢查預約編號")
                else:
                    st.info("查無預約記錄")
            else:
                st.warning("請輸入電話號碼")

# ==========================================
# 頁面 6:  防災知識與影音 (新增)
# ==========================================
elif page == " 防災知識與影音":
    st.header(" 防災知識與影音")
    
    tab_articles, tab_videos = st.tabs([" 📝 防災知識文章", " 🎬 宣導影片"])
    
    with tab_articles:
        st.subheader(" 📝 防災知識文章")
        st.info(
            "#### ❄️ 秋冬季節防範一氧化碳中毒\n"
            "**五要原則**:\n"
            "1. 要保持環境通風\n"
            "2. 要使用安全的品牌\n"
            "3. 要選擇正確的型式\n"
            "4. 要注意安全的安裝\n"
            "5. 要注意平時的檢修"
        )
        
    with tab_videos:
        st.subheader(" 精選防災宣導影片")
        st.markdown("由內政部消防署提供的官方宣導影片")
        st.markdown("<br>", unsafe_allow_html=True)
        
        col_v1, col_v2 = st.columns(2)
        
        with col_v1:
            st.markdown("####  住宅用火災警報器宣導")
            st.video("https://www.youtube.com/watch?v=wEA2cBfMbLM")
            st.caption("影片來源: 內政部消防署")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            st.markdown("####  CPR+AED教學影片")
            st.video("https://www.youtube.com/watch?v=7rZvvLAWwFo")
            st.caption("影片來源: 消防署緊急救護宣導")
        
        with col_v2:
            st.markdown("####  地震保命三步驟")
            st.video("https://www.youtube.com/watch?v=v3HXX6dMjSU")
            st.caption("影片來源: 內政部消防署")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            st.markdown("####  防災知識大會考")
            st.info(
                "**更多影片資源**\n\n"
                "您可以前往以下官方頻道觀看更多防災宣導影片:\n"
                "- [內政部消防署 YouTube](https://www.youtube.com/@nfa119)\n"
                "- [臺東縣消防局粉絲專頁](https://www.facebook.com/)"
            )

# ==========================================
# 頁面 7:  聯絡我們 (新增)
# ==========================================
elif page == " 聯絡我們":
    st.header(" 聯絡我們")
    st.markdown(
        "如有任何建議或問題, 歡迎透過以下方式聯繫我們:\n\n"
        "- Email: museum@ttfd.gov.tw\n"
        "- 電話: 089-322112\n"
        "- 臺東縣消防局粉絲專頁"
    )

# ==========================================
# Footer
# ==========================================
st.markdown("<br><br>", unsafe_allow_html=True)
st.divider()

col_footer_back, col_footer_info = st.columns([1, 3])

with col_footer_back:
    if st.button("← 返回平台首頁", type="secondary", use_container_width=True):
        st.switch_page("Home.py")

with col_footer_info:
    st.caption("© 2024 臺東縣消防局 防災教育館 | 服務電話: 089-322112 | Email: museum@ttfd.gov.tw")
