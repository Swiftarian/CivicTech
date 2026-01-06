import streamlit as st
import utils

# ==========================================
# 頁面設定
# ==========================================
st.set_page_config(
    page_title="臺東服務媒合+ (Plus) | 智慧服務平台",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 載入自訂 CSS
utils.load_custom_css()

# 載入中文側邊欄
import sidebar_nav
sidebar_nav.render_chinese_sidebar()

# ==========================================
# 自訂 CSS 樣式 (模擬 Homeindex.html)
# ==========================================
st.markdown("""
<style>
    /* 隱藏 Streamlit 預設元素 */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* CSS 變數 */
    :root {
        --primary-blue: #005A8D;
        --accent-orange: #FF6700;
        --light-gray: #f8f9fa;
        --dark-gray: #343a40;
        --white: #ffffff;
    }
    
    /* Hero Section */
    .hero-section {
        background: linear-gradient(rgba(0, 90, 141, 0.85), rgba(0, 0, 0, 0.5)), 
                    url('https://images.unsplash.com/photo-1593593394331-294158807355?q=80&w=2070') no-repeat center center;
        background-size: cover;
        color: white;
        text-align: center;
        padding: 80px 20px;
        border-radius: 16px;
        margin-bottom: 40px;
    }
    
    .hero-section h1 {
        font-size: 3rem;
        font-weight: 700;
        margin-bottom: 20px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    
    .hero-section p {
        font-size: 1.2rem;
        max-width: 700px;
        margin: 0 auto 30px;
        opacity: 0.95;
    }
    
    .hero-btn {
        display: inline-block;
        padding: 12px 30px;
        background: #FF6700;
        color: white !important;
        text-decoration: none;
        border-radius: 50px;
        font-weight: 700;
        transition: all 0.3s ease;
        border: 2px solid #FF6700;
    }
    
    .hero-btn:hover {
        background: transparent;
        color: #FF6700 !important;
    }
    
    /* Section Titles */
    .section-title {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .section-title h2 {
        font-size: 2.2rem;
        color: #005A8D;
        margin-bottom: 10px;
    }
    
    .section-title p {
        font-size: 1.1rem;
        color: #6c757d;
    }
    
    /* How it Works */
    .how-it-works {
        background: #f8f9fa;
        padding: 40px;
        border-radius: 16px;
        margin-bottom: 40px;
    }
    
    .diagram-box {
        background: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .diagram-item {
        font-size: 1.2rem;
        font-weight: 500;
        margin: 15px 0;
        color: #005A8D;
    }
    
    .diagram-arrow {
        font-size: 1.5rem;
        color: #FF6700;
    }
    
    /* Service Cards (Enhanced) */
    .service-card-new {
        background: white;
        padding: 35px 25px;
        text-align: center;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        height: 100%;
        border: 2px solid transparent;
    }
    
    .service-card-new:hover {
        transform: translateY(-10px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        border-color: #005A8D;
    }
    
    .service-icon {
        font-size: 3.5rem;
        margin-bottom: 20px;
    }
    
    .service-card-new h3 {
        font-size: 1.4rem;
        color: #005A8D;
        margin-bottom: 15px;
    }
    
    .service-card-new p {
        font-size: 1rem;
        color: #6c757d;
        line-height: 1.7;
    }
    
    /* CTA Section */
    .cta-section {
        background: linear-gradient(135deg, #005A8D 0%, #003d5c 100%);
        color: white;
        text-align: center;
        padding: 60px 30px;
        border-radius: 16px;
        margin: 40px 0;
    }
    
    .cta-section h2 {
        font-size: 2rem;
        margin-bottom: 15px;
    }
    
    .cta-section p {
        font-size: 1.1rem;
        opacity: 0.9;
        margin-bottom: 30px;
    }
    
    /* Footer */
    .custom-footer {
        background: #343a40;
        color: #f8f9fa;
        text-align: center;
        padding: 25px;
        border-radius: 12px;
        margin-top: 40px;
    }
</style>
""", unsafe_allow_html=True)

# ==========================================
# Hero Section (主視覺區)
# ==========================================
st.markdown("""
<div class="hero-section">
    <h1>🌊 臺東服務媒合+ (Plus)</h1>
    <p>一個強大的智慧管理平台，串連所有服務；一條熟悉的 LINE，傳遞所有溫暖。整合照護、防災與教育，打造最高效的服務生態系。</p>
    <a href="#services" class="hero-btn">探索我們的服務 ↓</a>
</div>
""", unsafe_allow_html=True)

# ==========================================
# 運作方式
# ==========================================
st.markdown("""
<div class="how-it-works">
    <div class="section-title">
        <h2>📱 平台為本，LINE為用</h2>
        <p>我們打造了一個分工明確、高效協作的雙軌服務模式。</p>
    </div>
</div>
""", unsafe_allow_html=True)

col_about1, col_about2 = st.columns([1.2, 1])

with col_about1:
    st.markdown("""
    ### 🖥️ 強大的管理中樞
    所有複雜的服務流程、人力媒合、案件管理與數據分析，都在「服務媒合+」網站平台上完成。這是我們服務的大腦，確保所有流程都有條不紊、紀錄完整。
    
    ### 📲 輕量化的溝通渠道
    所有重要的任務通知、進度更新、預約提醒，都會透過您最熟悉的 LINE 即時傳遞。點擊訊息中的連結，即可無縫接軌至平台進行操作。這是我們服務的神經網路，確保訊息不漏接。
    """)

with col_about2:
    st.markdown("""
    <div class="diagram-box">
        <div class="diagram-item">🌐 Web平台 (管理與操作)</div>
        <div class="diagram-arrow">⇅</div>
        <div class="diagram-item">💬 LINE (即時通知與溝通)</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# ==========================================
# 核心服務 (Service Cards)
# ==========================================
st.markdown("""
<div class="section-title" id="services">
    <h2>🎯 三大核心服務</h2>
    <p>率先整合社區最重要的三大服務，建立可複製的成功模式。</p>
</div>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3, gap="large")

with col1:
    st.markdown("""
    <div class="service-card-new">
        <div class="service-icon">🍱</div>
        <h3>社區互助送餐</h3>
        <p>媒合社區志工與在地車隊，將溫暖的餐點準時送達每個需要的角落。系統化管理，讓愛心傳遞更有效率。</p>
    </div>
    """, unsafe_allow_html=True)
    st.page_link("pages/2_community_meal_delivery.py", label="進入服務 →", icon="🍱", use_container_width=True)

with col2:
    st.markdown("""
    <div class="service-card-new">
        <div class="service-icon">🧯</div>
        <h3>簡易消防自主申報</h3>
        <p>消防安全設備檢修線上申報系統，民眾可快速上傳申報書並追蹤案件進度，數位化管理讓審核更有效率。</p>
    </div>
    """, unsafe_allow_html=True)
    st.page_link("pages/3_public_application_and_inquiry.py", label="進入服務 →", icon="🧯", use_container_width=True)

with col3:
    st.markdown("""
    <div class="service-card-new">
        <div class="service-icon">🏛️</div>
        <h3>防災館智慧導覽</h3>
        <p>民眾線上預約參訪，平台自動媒合有空的導覽員。從預約、派案到提醒，一條龍服務，確保每場導覽順利進行。</p>
    </div>
    """, unsafe_allow_html=True)
    st.page_link("pages/1_disaster_prevention_museum_booking.py", label="進入服務 →", icon="🏛️", use_container_width=True)

# ==========================================
# CTA Section
# ==========================================
st.markdown("""
<div class="cta-section">
    <h2>🤝 加入我們，共創美好臺東</h2>
    <p>無論您是需要服務的民眾、熱心的志工，或是縣府夥伴，都歡迎使用我們的服務。</p>
</div>
""", unsafe_allow_html=True)

col_cta1, col_cta2, col_cta3 = st.columns(3, gap="medium")

with col_cta1:
    st.page_link("pages/3_public_application_and_inquiry.py", label="👤 我是民眾 / 申請者", use_container_width=True)

with col_cta2:
    st.page_link("pages/2_community_meal_delivery.py", label="💪 我是志工 / 服務提供者", use_container_width=True)

with col_cta3:
    st.page_link("pages/4_case_review.py", label="🔐 我是管理者", use_container_width=True)

# ==========================================
# Footer
# ==========================================
st.markdown("""
<div class="custom-footer">
    <p>© 2024 臺東縣政府 | 臺東服務媒合+ (Plus) 專案</p>
</div>
""", unsafe_allow_html=True)
