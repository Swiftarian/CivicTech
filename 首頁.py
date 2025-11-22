import streamlit as st
import db_manager

# 設定頁面配置 (必須是第一個 Streamlit 指令)
st.set_page_config(
    page_title="臺東縣消防安全設備檢修申報平台",
    page_icon="🚒",
    layout="wide"
)

# 初始化資料庫
db_manager.init_db()

# 載入自定義 CSS 樣式
import utils
utils.load_custom_css()

st.title("🚒 臺東縣消防安全設備檢修申報平台")

st.markdown("""
### 歡迎使用線上申報系統

本平台提供業者與民眾一個方便快捷的線上申報與案件進度查詢管道。

#### 服務項目：
1.  **[民眾申辦](民眾申辦)**：線上填寫申請表並上傳檢修申報書。
2.  **[進度查詢](進度查詢)**：輸入單號或 Email 查詢案件審核狀態。
3.  **[案件審核](案件審核)**：(僅限消防局人員) 進行案件審核與派案管理。
4.  **[自動比對系統](自動比對系統)**：(僅限消防局人員) 使用 OCR 自動辨識申報書並與系統資料比對。

---
#### 系統公告
- 請確認上傳之 PDF 檔案清晰可辨識。
- 如有任何問題，請聯繫預防調查科 (預調科)。
""")

# 顯示一些統計數據 (範例)
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("今日申報件數", "12")
with col2:
    st.metric("已結案", "105")
with col3:
    st.metric("平均審核天數", "1.5 天")
