import streamlit as st
import db_manager
import datetime
import utils

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
        <h1 style="color: #2c3e50; font-size: 3em; font-weight: bold;">🏛️ 臺東縣消防局 防災教育館</h1>
        <p style="color: #7f8c8d; font-size: 1.3em;">體驗防災知識 · 守護生命安全</p>
    </div>
""", unsafe_allow_html=True)

# ==========================================
# 側邊欄導航 - 完整版（6個選項）
# ==========================================
st.sidebar.title("🧭 防災館導覽")
page = st.sidebar.radio(
    "選擇功能",
    ["ℹ️ 關於本館", "🏠 最新消息", "🏢 館內設施", "🚌 交通資訊", "📅 預約參觀", "📚 防災知識與影音"],
    label_visibility="collapsed"
)

st.sidebar.divider()
st.sidebar.caption("開館時間")
st.sidebar.info("週二至週日 09:00-17:00  \n(週一休館，國定假日正常開放)")

# ==========================================
# 頁面 1: ℹ️ 關於本館 (新增)
# ==========================================
if page == "ℹ️ 關於本館":
    st.header("ℹ️ 關於本館")
    st.markdown("<br>", unsafe_allow_html=True)
    
    col_about1, col_about2 = st.columns([2, 1])
    
    with col_about1:
        st.subheader("🏛️ 設立宗旨")
        st.markdown("""
        臺東縣消防局防災教育館成立於 2020 年，旨在透過互動式體驗教學，提升民眾防災意識與應變能力。
        本館結合最新科技與實作訓練，為全齡層民眾打造完整的防災教育環境。
        
        #### 核心理念
        - 🎯 **預防勝於救災**：建立正確防災觀念
        - 👨‍👩‍👧‍👦 **全民防災教育**：服務各年齡層民眾
        - 🤝 **社區與學校合作**：深耕在地防災文化
        - 💡 **科技與創新**：運用VR、AR等互動科技
        """)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.subheader("👥 服務對象")
        col_s1, col_s2, col_s3 = st.columns(3)
        with col_s1:
            st.info("**👶 學童團體**\n幼兒園至高中")
        with col_s2:
            st.info("**👨‍👩‍👧 一般民眾**\n個人或家庭參觀")
        with col_s3:
            st.info("**🏢 機關團體**\n企業、社區組織")
    
    with col_about2:
        st.subheader("📋 開放資訊")
        st.success("""
        **開館時間**  
        週二至週日  
        09:00 - 17:00  
        (最後入館時間 16:30)
        
        **休館日**  
        每週一  
        農曆春節  
        (國定假日正常開放)
        
        **參觀費用**  
        免費參觀
        
        **預約方式**  
        線上預約系統  
        (建議提前3天預約)
        """)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.subheader("📞 聯絡我們")
        st.info("""
        **服務電話**  
        089-XXXXXX
        
        **傳真**  
        089-YYYYYY
        
        **Email**  
        museum@ttfd.gov.tw
        
        **地址**  
        臺東縣臺東市中山路XXX號
        """)

# ==========================================
# 頁面 2: 🏠 最新消息
# ==========================================
elif page == "🏠 最新消息":
    st.header("📰 最新消息 & 公告")
    st.markdown("<br>", unsafe_allow_html=True)
    
    # 公告卡片
    col_news1, col_news2 = st.columns(2)
    
    with col_news1:
        with st.container():
            st.markdown("#### 🎉 防災館重新開幕！")
            st.caption("2024-11-20")
            st.markdown("""
            臺東縣消防局防災教育館經過全面翻修後，即日起正式對外開放！
            新增地震體驗區、VR 火災逃生模擬等多項互動設施，歡迎預約參觀。
            """)
            
        st.markdown("<br>", unsafe_allow_html=True)
        
        with st.container():
            st.markdown("#### 🔥 119消防節活動")
            st.caption("2024-11-15")
            st.markdown("""
            配合119消防節，本館將於11月19日舉辦「小小消防員體驗營」，
            開放國小學童免費報名參加，名額有限，額滿為止！
            """)
    
    with col_news2:
        with st.container():
            st.markdown("#### 🚨 颱風季防災宣導")
            st.caption("2024-10-01")
            st.markdown("""
            颱風季節來臨，請民眾提前準備防災包、檢查居家環境，
            並隨時關注氣象資訊。本館提供免費防災包檢核表下載。
            """)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        with st.container():
            st.markdown("#### 🌍 地震防災演練")
            st.caption("2024-09-21")
            st.markdown("""
            配合國家防災日，本館舉辦全民地震防災演練，
            歡迎社區、學校團體報名參加，共同提升防災意識。
            """)

# ==========================================
# 頁面 3: 🏢 館內設施
# ==========================================
elif page == "🏢 館內設施":
    st.header("🏢 館內設施介紹")
    st.markdown("探索互動展區，體驗真實防災情境")
    st.markdown("<br>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.image("https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=地震體驗區", use_container_width=True)
        st.markdown("### 🌍 地震體驗區")
        st.markdown("""
        **特色**：
        - 7.0級地震震動平台
        - 家具固定示範
        - 避難姿勢訓練
        
        **適合對象**：全年齡
        """)
    
    with col2:
        st.image("https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=火災搶救區", use_container_width=True)
        st.markdown("### 🔥 火災搶救區")
        st.markdown("""
        **特色**：
        - VR 火場逃生模擬
        - 滅火器實作訓練
        - 濃煙體驗室
        
        **適合對象**：12歲以上
        """)
    
    with col3:
        st.image("https://via.placeholder.com/400x300/95E1D3/FFFFFF?text=急救訓練區", use_container_width=True)
        st.markdown("### ⛑️ 急救訓練區")
        st.markdown("""
        **特色**：
        - CPR操作練習
        - AED使用訓練
        - 止血包紮教學
        
        **適合對象**：成人優先
        """)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # 其他設施
    st.subheader("🎬 其他設施")
    col_other1, col_other2 = st.columns(2)
    
    with col_other1:
        st.markdown("#### 🎥 4D 防災劇場")
        st.markdown("- 座位數：60席\n- 播放內容：防災宣導影片\n- 場次：每日4場（需預約）")
    
    tab_articles, tab_videos = st.tabs(["📝 防災知識文章", "🎬 防災宣導影片"])
    
    # Tab 1: 防災知識文章
    with tab_articles:
        topic = st.selectbox(
            "選擇主題",
            ["🔥 火災防護", "🌍 地震應變", "🌀 颱風防災", "💧 水災應對", "⛑️ 緊急救護"]
        )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        if topic == "🔥 火災防護":
            with st.expander("🔥 火災預防與逃生", expanded=True):
                col_fire1, col_fire2 = st.columns(2)
                
                with col_fire1:
                    st.markdown("""
                    #### 火災預防要點
                    - ✅ 定期檢查電線，避免老舊電線走火
                    - ✅ 不在床上吸菸
                    - ✅ 廚房用火不離人
                    - ✅ 定期更換瓦斯管線
                    - ✅ 安裝住警器
                    """)
                
                with col_fire2:
                    st.markdown("""
                    #### 火場逃生原則
                    1. **低姿勢爬行**：濃煙在上方，保持低姿勢
                    2. **關門阻火**：隨手關門延緩火勢蔓延
                    3. **往下逃生**：不搭電梯，走樓梯往下
                    4. **濕毛巾摀口鼻**：過濾煙霧
                    """)
        
        elif topic == "🌍 地震應變":
            with st.expander("🌍 地震避難與準備", expanded=True):
                st.markdown("""
                ### 地震來襲時的應變
                
                #### 🏠 在室內
                - **趴下（Drop）**：立即蹲低
                - **掩護（Cover）**：躲在桌下，保護頭部
                - **穩住（Hold On）**：抓緊桌腳，避免桌子移動
                
                #### 🚗 在車上
                - 減速靠邊停車
                - 留在車內，拉手剎車
                - 打開收音機接收訊息
                
                ### 地震包準備清單
                """)
                
                col_eq1, col_eq2, col_eq3 = st.columns(3)
                
                with col_eq1:
                    st.markdown("""
                    **基本用品**
                    - 飲用水（每人每日3公升）
                    - 乾糧、餅乾
                    - 手電筒
                    - 收音機
                    - 電池
                    """)
                
                with col_eq2:
                    st.markdown("""
                    **醫療用品**
                    - 急救包
                    - 常備藥品
                    - 口罩
                    - 溫度計
                    - 消毒酒精
                    """)
                
                with col_eq3:
                    st.markdown("""
                    **重要文件**
                    - 身分證影本
                    - 健保卡影本
                    - 存摺影本
                    - 緊急聯絡清單
                    - 現金
                    """)
        
        elif topic == "🌀 颱風防災":
            with st.expander("🌀 颱風來臨前的準備", expanded=True):
                st.markdown("""
                ### 颱風來臨前
                
                #### 🏠 居家準備
                - 清理排水孔、水溝
                - 固定花盆、招牌等容易吹落物品
                - 準備手電筒、蠟燭
                - 檢查門窗是否牢固
                - 儲備3天以上的食物與飲水
                
                #### 📱 資訊掌握
                - 隨時收聽氣象預報
                - 注意停班停課訊息
                - 確認避難場所位置
                
                ### 颱風期間
                - ⛔ 不外出、不到海邊
                - ⛔ 遠離門窗、低窪地區
                - ⛔ 避免使用電梯
                - ✅ 保持手機電力充足
                """)
        
        elif topic == "💧 水災應對":
            with st.expander("💧 淹水應變措施", expanded=True):
                st.markdown("""
                ### 淹水前準備
                - 關注水情資訊
                - 準備沙包
                - 將貴重物品移至高處
                - 關閉電源總開關與瓦斯
                
                ### 淹水時應變
                - 往高處移動
                - 避免涉水，水深超過膝蓋不可行走
                - 注意下水道、水溝蓋
                - 立即撥打119求援
                
                ### 水退後處理
                - 清理環境，防止傳染病
                - 檢查電器設備，確認安全再通電
                - 整理受損物品
                - 申請災害補助
                """)
        
        elif topic == "⛑️ 緊急救護":
            with st.expander("⛑️ CPR與AED使用", expanded=True):
                st.markdown("""
                ### CPR步驟（叫叫CAB）
                
                1. **叫**：確認患者意識，輕拍肩膀大聲呼喚
                2. **叫**：請旁人協助撥打119、拿AED
                3. **C**：胸部按壓（Compression）
                   - 雙手交疊，掌根置於胸骨下半部
                   - 下壓深度5-6公分
                   - 速度每分鐘100-120次
                4. **A**：暢通呼吸道（Airway）
                5. **B**：人工呼吸（Breathing）
                
                ### AED使用步驟
                1. 開啟AED電源
                2. 依語音指示貼上電極片
                3. 按下分析鈕，不碰觸患者
                4. 依指示按下電擊鈕
                5. 繼續CPR直到救護車抵達
                """)
    
    # Tab 2: 防災宣導影片 (新增)
    with tab_videos:
        st.subheader("🎬 精選防災宣導影片")
        st.markdown("由內政部消防署提供的官方宣導影片")
        st.markdown("<br>", unsafe_allow_html=True)
        
        col_v1, col_v2 = st.columns(2)
        
        with col_v1:
            st.markdown("#### 📹 住宅用火災警報器宣導")
            st.video("https://www.youtube.com/watch?v=wEA2cBfMbLM")
            st.caption("影片來源：內政部消防署")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            st.markdown("#### 📹 CPR+AED教學影片")
            st.video("https://www.youtube.com/watch?v=7rZvvLAWwFo")
            st.caption("影片來源：消防署緊急救護宣導")
        
        with col_v2:
            st.markdown("#### 📹 地震保命三步驟")
            st.video("https://www.youtube.com/watch?v=v3HXX6dMjSU")
            st.caption("影片來源：內政部消防署")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            st.markdown("#### 📹 防災知識大會考")
            st.info("""
            **更多影片資源**
            
            您可以前往以下官方頻道觀看更多防災宣導影片：
            - [內政部消防署 YouTube](https://www.youtube.com/@nfa119)
            - [臺東縣消防局粉絲專頁](https://www.facebook.com/)
            """)

# ==========================================
# 頁面 5: 📅 預約參觀 (升級版)
# ==========================================
elif page == "📅 預約參觀":
    st.header("📅 預約參觀系統")
    
    tab_reserve, tab_check_capacity, tab_my_bookings = st.tabs(["🆕 新增預約", "📊 查詢剩餘名額", "🔍 查詢我的預約"])
    
    # Tab 1: 新增預約 (優化版)
    with tab_reserve:
        st.subheader("填寫預約資訊")
        
        with st.form("booking_form"):
            # 新增：參觀類型選擇
            visit_type = st.radio(
                "參觀類型 *",
                ["個人/家庭", "學校/機關團體"],
                horizontal=True
            )
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            col_form1, col_form2 = st.columns(2)
            
            with col_form1:
                visit_date = st.date_input(
                    "參觀日期 *",
                    min_value=datetime.date.today() + datetime.timedelta(days=1),
                    max_value=datetime.date.today() + datetime.timedelta(days=60)
                )
                
                time_slot = st.selectbox(
                    "參觀時段 *",
                    ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"]
                )
                
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
                    organization = st.text_input("團體/單位名稱 *", placeholder="例如：臺東縣XX國小")
                else:
                    organization = st.text_input("單位/學校名稱 (選填)")
                
                email = st.text_input("Email (選填)")
            
            st.caption("* 為必填欄位")
            
            submitted = st.form_submit_button("✅ 提交預約", type="primary", use_container_width=True)
            
            if submitted:
                # 驗證必填欄位
                if not applicant_name or not applicant_phone:
                    st.error("請填寫聯絡人姓名與電話！")
                elif visit_type == "學校/機關團體" and not organization:
                    st.error("團體預約請填寫團體/單位名稱！")
                else:
                    # 檢查該時段是否已滿 (假設上限50人)
                    current_count = db_manager.get_booking_count_by_slot(
                        visit_date.strftime("%Y-%m-%d"),
                        time_slot
                    )
                    
                    if current_count + visitor_count > 50:
                        st.warning(f"⚠️ 該時段剩餘名額不足！目前已預約 {current_count} 人，剩餘 {50 - current_count} 人。")
                    else:
                        booking_id = db_manager.create_museum_booking(
                            visit_date.strftime("%Y-%m-%d"),
                            time_slot,
                            applicant_name,
                            applicant_phone,
                            visitor_count,
                            organization,
                            email
                        )
                        st.success(f"✅ 預約成功！預約編號：{booking_id}")
                        st.info(f"📱 **{visit_type}** 預約\n人數：{visitor_count} 人\n請保存您的聯絡電話 **{applicant_phone}**，以便查詢或取消預約。")
    
    # Tab 2: 查詢剩餘名額
    with tab_check_capacity:
        st.subheader("查詢各時段剩餘名額")
        
        query_date = st.date_input(
            "選擇日期",
            min_value=datetime.date.today(),
            max_value=datetime.date.today() + datetime.timedelta(days=60),
            key="query_date"
        )
        
        if st.button("🔍 查詢", key="check_capacity"):
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
                    "狀態": "🟢 可預約" if remaining > 10 else "🟡 名額有限" if remaining > 0 else "🔴 已額滿"
                })
            
            import pandas as pd
            df_capacity = pd.DataFrame(capacity_data)
            st.dataframe(df_capacity, use_container_width=True, hide_index=True)
    
    # Tab 3: 查詢我的預約
    with tab_my_bookings:
        st.subheader("查詢我的預約記錄")
        
        query_phone = st.text_input("請輸入預約時使用的電話號碼", key="query_phone")
        
        if st.button("🔍 查詢預約", key="check_bookings"):
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
                            st.error("取消失敗，請檢查預約編號")
                else:
                    st.info("查無預約記錄")
            else:
                st.warning("請輸入電話號碼")

# ==========================================
# 頁面 6: 📞 聯絡我們 (新增)
# ==========================================
elif page == "📞 聯絡我們":
    st.header("📞 聯絡我們")
    st.markdown("<br>", unsafe_allow_html=True)
    
    col_contact1, col_contact2 = st.columns([2, 1])
    
    with col_contact1:
        st.subheader("📍 地址與位置")
        st.markdown("### 臺東縣臺東市中山路XXX號")
        st.markdown("(臺東縣消防局旁)")
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Google Maps 按鈕
        st.link_button(
            "🗺️ 開啟 Google Maps 導航",
            "https://www.google.com/maps/search/臺東縣消防局",
            use_container_width=True,
            type="primary"
        )
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.subheader("🚗 交通方式")
        
        tab_car, tab_bus = st.tabs(["自行開車", "大眾運輸"])
        
        with tab_car:
            st.markdown("""
            **從臺東火車站出發**：
            1. 沿中華路一段往北行駛
            2. 右轉中山路
            3. 約5分鐘抵達
            
            **停車資訊**：
            - 館內設有免費停車場（20個車位）
            - 路邊設有路邊停車格
            """)
        
        with tab_bus:
            st.markdown("""
            **可搭乘公車路線**：
            - 市區公車 1路、8路
            - 於「消防局」站下車，步行1分鐘
            
            **搭乘火車**：
            - 至「臺東火車站」下車
            - 轉乘市區公車或計程車（約10分鐘）
            """)
    
    with col_contact2:
        st.subheader("📞 聯絡資訊")
        st.success("""
        **服務電話**  
        089-XXXXXX
        
        **傳真**  
        089-YYYYYY
        
        **Email**  
        museum@ttfd.gov.tw
        
        **開館時間**  
        週二至週日  
        09:00 - 17:00
        
        **休館日**  
        每週一  
        (國定假日正常開放)
        """)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        st.subheader("💬 意見反饋")
        st.markdown("""
        如有任何建議或問題，歡迎透過以下方式聯繫我們：
        
        - 📧 Email: museum@ttfd.gov.tw
        - 📞 電話: 089-XXXXXX
        - 📱 臺東縣消防局粉絲專頁
        """)

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
    st.caption("© 2024 臺東縣消防局 防災教育館 | 服務電話：089-XXXXXX | Email: museum@ttfd.gov.tw")
