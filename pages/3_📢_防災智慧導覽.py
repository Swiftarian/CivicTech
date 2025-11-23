import streamlit as st

# ==========================================
# 頁面設定
# ==========================================
st.set_page_config(
    page_title="防災智慧導覽",
    page_icon="📢",
    layout="wide"
)

# ==========================================
# 頁面內容
# ==========================================
st.title("📢 防災智慧導覽系統")

st.info("📢 此功能正在開發中，敬請期待！")

st.markdown("<br>", unsafe_allow_html=True)

# 功能規劃
st.markdown("### 🎯 功能規劃")

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    #### 🗺️ 即時災害地圖
    - 整合氣象、地震、淹水等災害資訊
    - 即時更新災害影響範圍
    - 歷史災害資料查詢
    - 危險區域警示標示
    
    #### 🚨 疏散路線規劃
    - AI 智慧路線規劃
    - 避難場所導航
    - 即時路況更新
    - 無障礙路線選項
    """)

with col2:
    st.markdown("""
    #### 📱 行動推播通知
    - 災害預警即時推播
    - 疏散通知發送
    - 安全資訊提醒
    - 多語言訊息支援
    
    #### 🤖 AI 防災助理
    - 24/7 智能客服
    - 防災知識諮詢
    - 緊急應變指引
    - 語音辨識互動
    """)

st.markdown("<br>", unsafe_allow_html=True)

# 應用場景
st.markdown("### 💡 應用場景")

scenario_tabs = st.tabs(["颱風來襲", "地震災害", "淹水事件", "火災應變"])

with scenario_tabs[0]:
    st.markdown("""
    ##### 🌀 颱風來襲情境
    1. **災前準備**：系統推播颱風動態與準備事項
    2. **即時追蹤**：顯示颱風路徑與預估影響時間
    3. **疏散通知**：針對危險區域發送撤離通知
    4. **災後回報**：提供災情回報與求援平台
    """)

with scenario_tabs[1]:
    st.markdown("""
    ##### 🏚️ 地震災害情境
    1. **震後警報**：地震速報即時推播
    2. **安全檢查**：建物安全自主檢查指引
    3. **避難導引**：最近避難場所導航
    4. **餘震預警**：持續監控餘震資訊
    """)

with scenario_tabs[2]:
    st.markdown("""
    ##### 💧 淹水事件情境
    1. **淹水預警**：降雨量監控與淹水預報
    2. **積水地圖**：即時積水位置標示
    3. **替代路線**：智慧繞道建議
    4. **救援請求**：快速通報與定位
    """)

with scenario_tabs[3]:
    st.markdown("""
    ##### 🔥 火災應變情境
    1. **火場資訊**：火災位置與影響範圍
    2. **疏散指引**：最安全逃生路線
    3. **消防支援**：消防車輛即時位置
    4. **避難確認**：民眾安全回報機制
    """)

st.markdown("<br>", unsafe_allow_html=True)

# 技術特色
st.markdown("### 🔬 技術特色")

tech_col1, tech_col2, tech_col3 = st.columns(3)

with tech_col1:
    st.markdown("""
    #### AI 技術
    - 機器學習預測模型
    - 自然語言處理
    - 影像辨識分析
    """)

with tech_col2:
    st.markdown("""
    #### 整合資料
    - 氣象局開放資料
    - 地震監測系統
    - 水利署淹水預警
    """)

with tech_col3:
    st.markdown("""
    #### 多元介面
    - 網頁版系統
    - 行動 APP
    - LINE 官方帳號
    """)

st.markdown("<br><br>", unsafe_allow_html=True)

# 返回按鈕
col_back, col_empty = st.columns([1, 4])
with col_back:
    if st.button("← 返回首頁", use_container_width=True, type="secondary"):
        st.switch_page("Home.py")
