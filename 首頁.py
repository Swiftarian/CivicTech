import streamlit as st
import utils

# ==========================================
# 頁面設定
# ==========================================
st.set_page_config(
    page_title="臺東縣消防局公私協力防災媒合平台",
    page_icon="🚒",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 載入自訂 CSS
utils.load_custom_css()

# ==========================================
# Hero Section (主視覺區)
# ==========================================
st.markdown("""
    <div class="hero">
        <h1>🚒 臺東縣消防局公私協力防災媒合平台</h1>
        <p>整合防災資源，強化社區韌性，共創安全家園</p>
    </div>
""", unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==========================================
# 服務導航卡片區
# ==========================================
st.markdown("## 🔗 服務項目")
st.markdown("選擇您需要的服務，開始使用系統功能")
st.markdown("<br>", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3, gap="large")

# 卡片 1：消防檢修申報書比對系統
with col1:
    st.markdown("""
        <div class="service-card">
            <div class="card-icon">🚒</div>
            <h3>消防檢修申報書比對系統</h3>
            <p>申報書自動化比對與審核，協助場所業者快速完成消防設備檢修申報作業</p>
        </div>
    """, unsafe_allow_html=True)
    
    if st.button("進入系統 →", key="fire_inspection", type="primary", use_container_width=True):
        st.switch_page("pages/1_🚒_消防檢修申報.py")

# 卡片 2：社區互助送餐
with col2:
    st.markdown("""
        <div class="service-card">
            <div class="card-icon">🍱</div>
            <h3>社區互助送餐</h3>
            <p>結合民間資源，為獨居長者提供送餐服務與關懷訪視，落實社區安全網</p>
        </div>
    """, unsafe_allow_html=True)
    
    if st.button("進入系統 →", key="meal_delivery", type="primary", use_container_width=True):
        st.switch_page("pages/2_🍱_社區互助送餐.py")

# 卡片 3：防災智慧導覽
with col3:
    st.markdown("""
        <div class="service-card">
            <div class="card-icon">📢</div>
            <h3>防災智慧導覽</h3>
            <p>運用 AI 技術，提供即時防災資訊、疏散路線規劃與防災知識推廣</p>
        </div>
    """, unsafe_allow_html=True)
    
    if st.button("進入系統 →", key="disaster_guide", type="primary", use_container_width=True):
        st.switch_page("pages/3_📢_防災智慧導覽.py")

# ==========================================
# Footer 區域
# ==========================================
st.markdown("<br><br>", unsafe_allow_html=True)
st.divider()

col_footer1, col_footer2, col_footer3 = st.columns(3)

with col_footer1:
    st.markdown("""
        #### 📞 聯絡資訊
        臺東縣消防局預防調查科  
        電話：089-322301  
        地址：臺東縣臺東市博愛路256號
    """)

with col_footer2:
    st.markdown("""
        #### 🕒 服務時間
        週一至週五 08:00-17:00  
        （國定假日除外）  
        緊急事故請撥 119
    """)

with col_footer3:
    st.markdown("""
        #### ℹ️ 關於平台
        本平台由臺東縣消防局建置  
        整合公私資源，提供多元服務  
        版本：v2.1
    """)

st.markdown("<br>", unsafe_allow_html=True)
st.caption("© 2024 臺東縣消防局 版權所有")
