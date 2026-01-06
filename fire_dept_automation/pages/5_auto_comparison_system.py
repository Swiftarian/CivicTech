import streamlit as st
import db_manager
import pandas as pd
import os
import fitz  # pymupdf
from PIL import Image
import pytesseract
import re
import config_loader as cfg
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.request
import subprocess
import utils

# 設定頁面配置
st.set_page_config(layout="wide", page_title=f"{cfg.AGENCY_NAME}檢修申報書檢核比對系統")

# 載入中文側邊欄
import sidebar_nav
sidebar_nav.render_chinese_sidebar()

# ==========================================
# 🔐 登入門禁檢查 (CRITICAL: 必須在所有其他操作之前)
# ==========================================
if "logged_in" not in st.session_state or not st.session_state.logged_in:
    st.warning("⚠️ 此頁面僅限消防局同仁使用，請先進行管理者登入。")
    st.info("正在將您導向至登入頁面...")
    st.page_link("pages/4_case_review.py", label="🔐 前往登入頁面", icon="🔐")
    st.stop()  # 阻止下方程式碼執行

# 顯示登入使用者資訊
if 'user' in st.session_state and st.session_state.user:
    current_user = dict(st.session_state.user) # 確保轉換為字典，避免 sqlite3.Row 沒有 get 方法的問題
    st.sidebar.success(f"👤 已登入：{current_user.get('username')} ({current_user.get('role')})")
st.sidebar.divider()

# 載入自定義 CSS
import utils
utils.load_custom_css()
import doc_integrity  # New module for integrity check

# ==========================================
# 原有程式碼繼續
# ==========================================

# ==========================================
# 設定區
# ==========================================
# 預設 Tesseract 路徑
DEFAULT_TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# 本地 tessdata 資料夾 (避免權限問題)
LOCAL_TESSDATA_DIR = os.path.join(os.getcwd(), "tessdata")

# ==========================================
# 函式區
# ==========================================

def send_email(sender_email, sender_password, receiver_email, subject, body):
    """發送 Email 通知"""
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        # 連線到 Gmail SMTP Server (使用 SSL)
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True, "發送成功"
    except Exception as e:
        return False, f"發送失敗: {e}"

def download_lang_data():
    """下載繁體中文語言包"""
    if not os.path.exists(LOCAL_TESSDATA_DIR):
        os.makedirs(LOCAL_TESSDATA_DIR)
    
    # 下載 chi_tra.traineddata
    url = "https://github.com/tesseract-ocr/tessdata_best/raw/main/chi_tra.traineddata"
    dest = os.path.join(LOCAL_TESSDATA_DIR, "chi_tra.traineddata")
    
    if not os.path.exists(dest):
        with st.spinner("正在下載繁體中文語言包 (約 15MB)..."):
            try:
                urllib.request.urlretrieve(url, dest)
                st.success("下載完成！")
            except Exception as e:
                st.error(f"下載失敗: {e}")

    # 嘗試複製 eng.traineddata (如果有的話)，否則也下載
    eng_dest = os.path.join(LOCAL_TESSDATA_DIR, "eng.traineddata")
    if not os.path.exists(eng_dest):
        eng_url = "https://github.com/tesseract-ocr/tessdata_best/raw/main/eng.traineddata"
        try:
            urllib.request.urlretrieve(eng_url, eng_dest)
        except:
            pass # 英文非必要，失敗就算了


def pdf_to_images(pdf_file):
    """將 PDF 轉為圖片列表 (每一頁一張圖)"""
    doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
    images = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=300) # 高解析度以利 OCR
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
    return images

def perform_ocr(image, tesseract_cmd):
    """對圖片進行 OCR 辨識 (改用 subprocess 以解決編碼問題)"""
    temp_img_path = os.path.join(os.getcwd(), "temp_ocr_image.png")
    try:
        # 1. 先將圖片存為暫存檔
        image.save(temp_img_path)
        
        # 2. 組建指令
        # tesseract.exe <image> stdout -l chi_tra+eng --tessdata-dir <dir>
        cmd = [
            tesseract_cmd,
            temp_img_path,
            "stdout",
            "-l", "chi_tra+eng",
            "--tessdata-dir", LOCAL_TESSDATA_DIR
        ]
        
        # 3. 執行指令 (隱藏視窗)
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        
        process = subprocess.run(
            cmd,
            capture_output=True,
            startupinfo=startupinfo
        )
        
        # 4. 處理輸出 (嘗試不同編碼)
        stdout_data = process.stdout
        stderr_data = process.stderr
        
        if process.returncode != 0:
            # 如果失敗，嘗試解碼錯誤訊息
            try:
                err_msg = stderr_data.decode('utf-8')
            except:
                err_msg = stderr_data.decode('cp950', errors='ignore')
            return f"OCR Error (Code {process.returncode}): {err_msg}"

        # 嘗試 UTF-8 解碼
        try:
            text = stdout_data.decode('utf-8')
        except UnicodeDecodeError:
            # 失敗則嘗試 Big5 (cp950) - 常見於繁體中文 Windows
            text = stdout_data.decode('cp950', errors='ignore')
            
        return text

    except Exception as e:
        return f"Error: {e}"
    finally:
        # 清理暫存檔
        if os.path.exists(temp_img_path):
            try:
                os.remove(temp_img_path)
            except:
                pass

# 定義標準設備清單 (依長度排序，優先比對長字串)
VALID_EQUIPMENT_LIST = sorted([
    "滅火器", "自動撒水設備", "惰性氣體滅火設備", "簡易自動滅火設備", "警報設備", 
    "火警自動警報設備", "一一九火災通報裝置", "避難逃生設備", "標示設備", 
    "消防搶救上之必要設備", "連結送水管", "無線電通信輔助設備", "其他", 
    "冷卻撒水設備", "室內消防栓設備", "水霧滅火設備", "乾粉滅火設備", 
    "鹵化煙滅火設備", "瓦斯漏氣火警自動警報設備", "避難器具", "消防專用蓄水池", 
    "緊急電源插座", "室外消防栓設備", "泡沫滅火設備", "海龍滅火設備", 
    "緊急廣播設備", "緊急照明設備", "排煙設備", "防災監控系統綜合操作裝置", 
    "射水設備", "配線"
], key=len, reverse=True)

def normalize_equipment_str(text):
    """
    將輸入的文字 (OCR 或 系統資料) 進行模糊比對，
    只保留標準設備清單中**已勾選**的項目，並以頓號分隔。
    
    判斷邏輯：
    1. 如果設備名稱附近有頁碼（如 "2-1", "2-2"），視為已勾選
    2. 如果設備名稱前有勾選符號（☑, ✓, ■, √），視為已勾選
    3. 如果設備名稱後有數字（表示數量或頁碼），視為已勾選
    """
    if not text or not isinstance(text, str):
        return ""
    
    found_items = []
    
    # 先移除常見干擾字元，方便比對
    clean_text = text.replace(" ", "").replace("　", "")
    
    # 將文字按行分割，方便逐行分析
    lines = clean_text.split("\n")
    
    # 定義勾選符號
    check_symbols = ['☑', '✓', '■', '√', '✔', '●', '☐']  # 注意：☐ 是空方框，也可能被 OCR 誤讀
    
    for item in VALID_EQUIPMENT_LIST:
        item_found = False
        
        # 策略 1: 逐行掃描，檢查設備名稱後是否有頁碼
        for line in lines:
            if item in line or item.replace("設備", "") in line:
                # 檢查這行是否有頁碼格式 (如 "2-1", "2-2", "2-13" 等)
                # 頁碼通常是 "數字-數字" 的格式
                if re.search(r'\d+-\d+', line):
                    item_found = True
                    break
                # 也檢查純數字 (如 "___7" 表示第 7 頁)
                if re.search(r'[._]{2,}\s*\d+', line):
                    item_found = True
                    break
                # 檢查是否有勾選符號在項目前面
                for symbol in check_symbols:
                    if symbol in line and line.find(symbol) < line.find(item) if item in line else False:
                        item_found = True
                        break
                if item_found:
                    break
        
        # 策略 2: 如果還沒找到，做整體文字搜尋
        if not item_found:
            # 使用正則表達式搜尋 "設備名稱 + 任意字元 + 頁碼"
            pattern = re.escape(item) + r'.*?(\d+-\d+)'
            if re.search(pattern, clean_text):
                item_found = True
            
            # 也檢查 "設備檢查表" 格式 (如 "滅火器檢查表 2-1")
            table_name = item.replace("設備", "") + "檢查表"
            if table_name in clean_text:
                pattern2 = re.escape(table_name) + r'.*?(\d+-\d+)'
                if re.search(pattern2, clean_text):
                    item_found = True
        
        if item_found and item not in found_items:
            found_items.append(item)
            
    return "、".join(found_items)

def extract_info_from_ocr(text, pages_text_list=None):
    """從 OCR 文字中提取關鍵資訊 (極致去空白版)"""
    info = {}
    
    # --- 第一頁解析 (基本資料) ---
    if text:
        lines = text.split('\n')
        for line in lines:
            # 強力去除所有空白 (包含全形空格)
            clean_line = line.replace(" ", "").replace("　", "").strip()
            if not clean_line: continue
            
            # 1. 管理權人
            # 優先找 "管理權人"
            if "管理權人" in clean_line:
                match = re.search(r"管理權人[:：|](.*)", clean_line)
                if match:
                    val = match.group(1)
                    # 如果抓到的是 "通訊處..." 這種無效資料，就忽略
                    if "通訊處" not in val:
                        info['管理權人'] = val
            
            # 備用：找 "姓名" (但要排除 "檢修人員姓名")
            if "姓名" in clean_line and "檢修人員" not in clean_line and "管理權人" not in info:
                 match = re.search(r"姓名[:：|](.*)", clean_line)
                 if match:
                     # 可能會抓到 "廖偉銘身分證字號..."，試著切掉後面
                     val = match.group(1)
                     if "身分證" in val:
                         val = val.split("身分證")[0]
                     info['管理權人'] = val
            
            # 2. 地址
            if "地址" in clean_line:
                 # 優先抓 "場所地址"
                 if "場所地址" in clean_line:
                     match = re.search(r"場所地址[:：|](.*)", clean_line)
                     if match:
                         info['場所地址'] = match.group(1)
                 # 如果是 "地址" 且 字典裡還沒有 "場所地址" (避免覆蓋掉真正的場所地址，因為後面可能會出現檢修單位的地址)
                 elif "地址" in clean_line and '場所地址' not in info:
                     match = re.search(r"地址[:：|](.*)", clean_line)
                     if match:
                         info['場所地址'] = match.group(1)

            # 3. 電話
            if "電話" in clean_line:
                # 排除 "管理權人電話" (通常我們想抓場所電話)
                # 只有當字典裡還沒有電話時才抓取 (避免抓到下面檢修公司的電話)
                if '場所電話' not in info:
                    # 修改 Regex 以支援括號和空格，例如 (089) 322112
                    match = re.search(r"電話[:：|]([\d\-\(\)\s]+)", clean_line)
                    if match:
                        # 抓出來的可能是 "089-330928" 或 "(089) 322112"
                        val = match.group(1).strip()
                        # 簡單過濾，至少要有數字
                        if any(char.isdigit() for char in val):
                            info['場所電話'] = val
                     
            # 4. 場所名稱
            if "場所名稱" in clean_line:
                match = re.search(r"場所名稱[:：|](.*)", clean_line)
                if match:
                    info['場所名稱'] = match.group(1)

            # 5. 消防設備種類 (第一頁備用)
            # 如果沒有第二頁資料，才嘗試從第一頁抓 (通常是 "申報項目" 或 "檢修項目")
            if not pages_text_list:
                if "申報項目" in clean_line or "檢修項目" in clean_line:
                     match = re.search(r"(申報項目|檢修項目)[:：|](.*)", clean_line)
                     if match:
                         # 使用正規化函式處理
                         info['消防設備種類'] = normalize_equipment_str(match.group(2))

    # --- 多頁解析 (尋找消防設備種類) ---
    if pages_text_list and isinstance(pages_text_list, list):
        target_page_text = None
        
        # 1. 優先尋找目錄頁 (根據使用者指定的關鍵字)
        # 關鍵字: "目錄", "附表", "二、消防安全設備檢查表"
        toc_keywords = ["目錄", "附表", "二、消防安全設備檢查表", "消防安全設備檢修申報書目錄"]
        
        for i, page_text in enumerate(pages_text_list):
            clean_text = page_text.replace(" ", "").replace("　", "").strip()
            
            # 檢查是否包含任一關鍵字
            if any(kw.replace(" ", "") in clean_text for kw in toc_keywords):
                target_page_text = page_text
                info['toc_page_num'] = i + 1 # 紀錄頁碼
                # print(f"DEBUG: Found TOC page with keyword at page {i+1}") # Debug use
                break
        
        # 4. 最後回退：使用第二頁 (Index 1)
        if not target_page_text and len(pages_text_list) > 1:
            target_page_text = pages_text_list[1]
            info['toc_page_num'] = 2
            
        if target_page_text:
            # 策略：
            # 1. 找到 "二、消防安全設備檢查表" 之後的內容
            # 2. 抓取所有包含 "檢查表" 的行
            # 3. 傳入 normalize_equipment_str 進行統一比對
            
            # 為了提高準確率，我們先把 "二、消防安全設備檢查表" 之後的文字截取出來
            # 簡單做法：找到關鍵字後，取其後的所有文字
            clean_page_text = target_page_text.replace(" ", "").replace("　", "")
            if "消防安全設備檢查表" in clean_page_text:
                # 切割出後半段
                relevant_text = clean_page_text.split("消防安全設備檢查表", 1)[1]
                
                # 直接對這段文字進行正規化比對
                normalized_eq = normalize_equipment_str(relevant_text)
                if normalized_eq:
                    info['消防設備種類'] = normalized_eq
                 
    return info






# ==========================================
# 主程式區
# ==========================================

st.title(f"🚒 {cfg.AGENCY_NAME}檢修申報書檢核比對系統")

# CSS 樣式：左右分欄獨立捲動 (Split View)
st.markdown("""
    <style>
    /* 針對主區塊 (Main) 的雙欄位設定獨立捲動 */
    
    /* 左側欄位 (申報檔案)：設定固定高度 + 捲動軸 */
    section[data-testid="stMain"] div[data-testid="column"]:nth-of-type(1) > div[data-testid="stVerticalBlock"] {
        height: 80vh;       /* 設定高度佔螢幕 80% */
        overflow-y: auto;   /* 超過高度顯示捲動軸 */
        padding-right: 15px;
        border-right: 1px solid #444; /* 中間加一條分隔線 */
    }
    
    /* 右側欄位 (比對表格)：設定固定高度 + 捲動軸 */
    section[data-testid="stMain"] div[data-testid="column"]:nth-of-type(2) > div[data-testid="stVerticalBlock"] {
        height: 80vh;       /* 設定高度佔螢幕 80% */
        overflow-y: auto;   /* 超過高度顯示捲動軸 */
        padding-left: 15px;
    }
    </style>
    """, unsafe_allow_html=True)

# --- CRITICAL: 路徑變數 Session 記憶與初始化 ---
# Tesseract 路徑初始化
if "tesseract_exe_path" not in st.session_state or not st.session_state["tesseract_exe_path"]:
    st.session_state["tesseract_exe_path"] = utils.get_default_tesseract_path()

# Excel 路徑初始化
if "system_excel_path" not in st.session_state or not st.session_state["system_excel_path"]:
    st.session_state["system_excel_path"] = utils.get_default_excel_path()

# 檢查狀態以決定 Expander 是否展開
# 使用 Session State 的值進行檢查，確保穩定性

# --- DEBUG: 輸出路徑檢查資訊 ---
print("-" * 50, flush=True)
print(f"DEBUG: Check Tesseract Path: [{st.session_state.get('tesseract_exe_path')}]", flush=True)
print(f"DEBUG: Check Excel Path: [{st.session_state.get('system_excel_path')}]", flush=True)
print("-" * 50, flush=True)
# -----------------------------

use_vision_ai = False # 初始化全域變數，避免 NameError

tesseract_is_ok = os.path.exists(st.session_state["tesseract_exe_path"])
excel_is_loaded = False

if os.path.exists(st.session_state["system_excel_path"]):
    # 嘗試預載入檢查 (利用 cache)
    df_check = utils.load_system_data(st.session_state["system_excel_path"])
    if df_check is not None and not df_check.empty:
        excel_is_loaded = True

expand_config = not (tesseract_is_ok and excel_is_loaded)

# --- 側邊欄：資料載入 ---
with st.sidebar:
    # 載入資料 (使用 Session State 的值)
    df_system = utils.load_system_data(st.session_state["system_excel_path"])
    
    selected_place = None
    
    # 1. 選擇場所 (放在最上面)
    if df_system is not None:
        st.header("1. 選擇比對場所")
        
        # 取得所有場所名稱
        all_place_names = df_system['場所名稱'].astype(str).unique().tolist()
        
        # 搜尋框
        search_term = st.text_input("🔍 搜尋場所名稱 (支援模糊比對)", "")
        
        # 根據搜尋結果過濾
        if search_term:
            filtered_places = [p for p in all_place_names if search_term in p]
        else:
            filtered_places = all_place_names
            
        # 如果搜尋不到，顯示提示
        if not filtered_places:
            st.warning("找不到符合的場所")
        else:
            # 下拉選單 (只顯示過濾後的結果)
            selected_place = st.selectbox(
                "請選擇場所", 
                filtered_places,
                index=None,  # 預設不選取任何項目
                placeholder="請選擇場所..."
            )
        
        st.divider()
    else:
        st.warning("尚未載入系統資料，請先設定資料來源。")
        st.divider()
    
    # 2. 設定與資料來源 (使用 Expander 包覆)
    with st.expander("2. 設定與資料來源", expanded=expand_config):
        # Tesseract 設定
        st.markdown("#### OCR 辨識引擎設定")
        user_input_path = st.text_input("Tesseract 執行檔路徑", key="tesseract_exe_path")
        
        # 智慧修正路徑
        tesseract_path = user_input_path
        if os.path.isdir(user_input_path):
            tesseract_path = os.path.join(user_input_path, "tesseract.exe")
            st.info(f"💡 已自動修正路徑為：{tesseract_path}")
            
        if not os.path.exists(tesseract_path):
            st.error(f"❌ 找不到檔案：{tesseract_path}")
        else:
            st.success("✅ Tesseract 路徑正確")
            
        # 檢查語言包
        if not os.path.exists(os.path.join(LOCAL_TESSDATA_DIR, "chi_tra.traineddata")):
            st.warning("⚠️ 缺少繁體中文語言包")
            if st.button("📥 下載中文語言包 (必要)"):
                download_lang_data()
        
        st.divider()
        
        # Excel 資料來源設定
        st.markdown("#### 系統資料來源設定")
        st.text_input("系統列管資料表 Excel 路徑", key="system_excel_path")
        
        if not os.path.exists(st.session_state["system_excel_path"]):
            st.error(f"❌ 找不到檔案：{st.session_state['system_excel_path']}")
        else:
            st.success("✅ Excel 檔案讀取成功")
            if st.button("🔄 重新讀取 Excel"):
                utils.load_system_data.clear()
                st.cache_data.clear()
                st.rerun()
    # 3. 除錯用：顯示欄位名稱
    if df_system is not None:
        with st.expander("3. 🔍 查看 Excel 欄位名稱 (除錯用)"):
            st.write(df_system.columns.tolist())

# --- 主畫面：比對區 ---
uploaded_file = None
target_row = None

# 1. 取得案件資料 (根據角色權限)
if 'user' in st.session_state and st.session_state.user:
    current_username = st.session_state.user['username']
    current_role = st.session_state.user['role']
    
    if current_role == "admin":
        # Admin 可以看到所有案件
        my_cases = db_manager.get_all_cases()
        st.toast(f"👑 管理員模式：已載入全系統共 {len(my_cases)} 筆案件", icon="🛡️")
    else:
        # 一般同仁只能看到指派給自己的
        my_cases = db_manager.get_cases_by_assignee(current_username)
else:
    my_cases = []

# 2. 建立案件選擇選單
case_options = {f"{c['id']} - {c['place_name']} - {c['status']}": c for c in my_cases}
selected_case_label = st.selectbox(
    "請選擇要審核的案件",
    options=list(case_options.keys()),
    index=None,
    placeholder="請選擇要審核的案件..."
)

target_case = None
uploaded_file_path = None

if selected_case_label:
    target_case = case_options[selected_case_label]
    uploaded_file_path = target_case['file_path']

# 1. 先建立版面 (使用 Tabs 分頁)
tab_main, tab_check = st.tabs(["🔍 申報書比對", "📑 文件完整性檢查"])

# 主比對頁面
col1, col2 = tab_main.columns([1, 1])

# 用於儲存 OCR 結果
all_ocr_text = ""
page_one_text = ""
page_two_text = ""
extracted_data = {}
ocr_place_name = ""

# 左欄：民眾申報資料 (PDF/圖片)
with col1:
    # st.subheader("📄 民眾申報資料 (OCR 辨識)") # 移除舊標題
    
    # 使用 Columns 將標題與狀態訊息排在同一列
    col_header, col_status_msg = st.columns([3, 2]) # 調整比例以避免標題換行
    with col_header:
        st.subheader("📄 民眾申報資料")
    
    # 建立三欄佈局：按鈕 | OCR 引擎 | AI 設定
    col_btn, col_engine, col_ai = st.columns([1, 2, 2])
    
    with col_btn:
        force_reocr = st.button("🔄 強制重新辨識", help="如果覺得辨識結果有誤，可點此重新執行 OCR")
    
    with col_engine:
        # OCR 引擎選擇
        ocr_engine = st.radio(
            "OCR 引擎",
            options=["Tesseract", "PaddleOCR"],
            index=1, # 預設 PaddleOCR
            horizontal=True,
            label_visibility="collapsed" # 隱藏標題，節省空間
        )
        use_paddle = (ocr_engine == "PaddleOCR")
        
        # 快速模式選項
        use_fast_mode = st.checkbox("⚡ 快速模式 (壓縮圖片)", value=True, help="降低圖片解析度 (150 DPI) 以加快 OCR 速度，但可能影響小字辨識率。")
        
        # 檢查 PaddleOCR 可用性
        if use_paddle:
            try:
                import paddle_ocr
                if not paddle_ocr.is_paddle_available():
                    st.caption("⚠️ PaddleOCR 未安裝")
            except:
                st.caption("⚠️ PaddleOCR 未安裝")

    with col_ai:
        # AI 設定
        # use_ai_mode = st.checkbox("啟用 AI 智慧分析 (Ollama)", value=True) # 移除 Checkbox，改為常駐
        use_ai_mode = True # 強制啟用
        st.caption("✅ 已啟用 AI 智慧分析 (Ollama)")
        
        use_vision_ai = st.checkbox("啟用 Vision AI (實驗性)", value=False, help="使用多模態模型 (Llama 3.2 Vision) 直接分析圖片，可更準確識別目錄與表格結構，但速度較慢。")
        
        # 模型選擇 (下拉式選單)
        if use_ai_mode:
            text_model = st.selectbox(
                "選擇模型",
                options=["llama3", "gemma2", "mistral", "qwen2.5:7b"],
                index=0,
                label_visibility="collapsed" # 隱藏標題，節省空間
            )
        else:
            text_model = "llama3"

    if target_case and uploaded_file_path:
        if not os.path.exists(uploaded_file_path):
             st.error(f"❌ 找不到檔案：{uploaded_file_path}")
        else:
            # 產生檔案唯一識別碼 (使用檔名+大小)
            file_key = f"{os.path.basename(uploaded_file_path)}_{os.path.getsize(uploaded_file_path)}"
            
            # 檢查 Session State 是否已有此檔案的 OCR 結果
            if 'ocr_cache' not in st.session_state:
                st.session_state.ocr_cache = {}
            
            # 判斷是否需要執行 OCR
            # 條件：
            # 1. 檔案變更 (file_key 不同)
            # 2. 使用者強制重新辨識
            # 3. Cache 為空
            # 4. OCR 引擎變更 (偵測 session state 中的 engine)
            
            # 檢查上次使用的引擎
            last_engine = st.session_state.ocr_cache.get('last_engine')
            engine_changed = last_engine != ocr_engine
            
            cache_miss = st.session_state.ocr_cache.get('file_key') != file_key
            
            if cache_miss or force_reocr or engine_changed:
                if force_reocr:
                    st.toast("正在重新執行 OCR...", icon="🔄")
                if engine_changed:
                    st.toast(f"切換引擎至 {ocr_engine}，重新辨識...", icon="⚙️")
                
                # 更新 last_engine
                st.session_state.ocr_cache['last_engine'] = ocr_engine
                
                # 清除 AI 快取，確保重新分析
                if 'ai_result' in st.session_state.ocr_cache:
                    del st.session_state.ocr_cache['ai_result']
                if 'last_text_model' in st.session_state.ocr_cache:
                    del st.session_state.ocr_cache['last_text_model']
                
                # 清除 Vision AI 快取
                if 'vision_analysis' in st.session_state:
                    del st.session_state['vision_analysis']
                if 'vision_cache_key' in st.session_state:
                    del st.session_state['vision_cache_key']
                
                # 1. 先轉換並顯示圖片 (讓使用者先看到預覽)
                images = []
                # target_dpi = 150 if use_fast_mode else 300
                target_dpi = 300 # 強制使用 300 DPI 以提升 OCR 對勾選框的辨識率 (User Request)
                
                try:
                    ext = os.path.splitext(uploaded_file_path)[1].lower()
                    if ext == ".pdf":
                        # 顯示轉換訊息
                        with st.spinner(f"📄 正在將 PDF 轉換為圖片 (DPI: {target_dpi})..."):
                            with open(uploaded_file_path, "rb") as f:
                                images = utils.pdf_to_images(f, dpi=target_dpi)
                    elif ext in [".doc", ".docx"]:
                         with st.spinner("📄 正在將 Word 文件轉換為 PDF (需安裝 Microsoft Word)..."):
                            temp_pdf_path = None
                            try:
                                temp_pdf_path = utils.convert_doc_to_pdf(uploaded_file_path)
                                with open(temp_pdf_path, "rb") as f:
                                    images = utils.pdf_to_images(f, dpi=target_dpi)
                            except Exception as e:
                                st.error(f"❌ Word 轉換失敗: {e}")
                                images = []
                            finally:
                                # Clean up temp PDF
                                if temp_pdf_path and os.path.exists(temp_pdf_path):
                                    try: os.remove(temp_pdf_path)
                                    except: pass
                    elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]:
                        img = Image.open(uploaded_file_path)
                        if use_fast_mode and img.width > 1500:
                            ratio = 1500 / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((1500, new_height), Image.Resampling.LANCZOS)
                        images = [img]
                    else:
                        st.error(f"❌ 不支援的檔案格式：{ext}。請上傳 PDF、Word 或圖片檔。")
                        images = []
                except Exception as e:
                    st.error(f"無法讀取檔案: {e}")
                    images = []
                
                if images:
                    # 先顯示圖片預覽
                    for i, img in enumerate(images):
                        st.image(img, caption=f"第 {i+1} 頁 (預覽)", use_column_width=True)
                    
                    # 2. 執行 OCR
                    with st.spinner("🔍 正在進行 OCR 辨識中 (請稍候)..."):
                        temp_all_text = ""
                        temp_p1_text = ""
                        temp_p2_text = ""
                        
                        # 執行 OCR
                        pages_text = []
                        pages_info = [] # Store page info
                        
                        for i, img in enumerate(images):
                            # 執行 OCR (根據選定的引擎)
                            if use_paddle:
                                try:
                                    import paddle_ocr
                                    ocr_text = paddle_ocr.perform_paddle_ocr(img)
                                    
                                    # 檢查 PaddleOCR 是否回傳錯誤
                                    if "Error:" in ocr_text:
                                        st.warning(f"PaddleOCR 執行失敗 (第 {i+1} 頁): {ocr_text}")
                                        st.info("🔄 自動切換至 Tesseract 進行重試...")
                                        ocr_text = perform_ocr(img, tesseract_path)
                                        
                                except Exception as e:
                                    st.warning(f"PaddleOCR 執行失敗，切換至 Tesseract: {e}")
                                    ocr_text = perform_ocr(img, tesseract_path)
                            else:
                                ocr_text = perform_ocr(img, tesseract_path)
                            
                            # 再次檢查 Tesseract 是否也失敗
                            if "Error:" in ocr_text:
                                st.error(f"❌ OCR 嚴重失敗 (第 {i+1} 頁): {ocr_text}")
                                
                            temp_all_text += ocr_text + "\n"
                            pages_text.append(ocr_text)
                            
                            # Identify page type
                            first_30 = ocr_text[:30]
                            page_type = doc_integrity.identify_page_type(first_30)
                            
                            pages_info.append({
                                "page_num": i + 1,
                                "first_30": first_30,
                                "type": page_type,
                                "text": ocr_text
                            })
                            
                            if i == 0: temp_p1_text = ocr_text
                            if i == 1: temp_p2_text = ocr_text
                        
                        # 存入 Session State
                        st.session_state.ocr_cache['file_key'] = file_key
                        st.session_state.ocr_cache['all_ocr_text'] = temp_all_text
                        st.session_state.ocr_cache['page_one_text'] = temp_p1_text
                        st.session_state.ocr_cache['page_two_text'] = temp_p2_text
                        st.session_state.ocr_cache['pages_text'] = pages_text # 儲存所有頁面文字
                        st.session_state.ocr_cache['pages_info'] = pages_info # 儲存頁面資訊
                        st.session_state.ocr_cache['images'] = images 
                        
                        # 重新整理頁面以顯示 OCR 結果
                        st.rerun()
            else:
                with col_status_msg:
                    st.success("✅ 使用快取資料 (無需重新辨識)")
            
            # 從 Session State 取出資料 (Cache Hit)
            all_ocr_text = st.session_state.ocr_cache.get('all_ocr_text', "")
            page_one_text = st.session_state.ocr_cache.get('page_one_text', "")
            page_two_text = st.session_state.ocr_cache.get('page_two_text', "")
            pages_text = st.session_state.ocr_cache.get('pages_text', [])
            cached_images = st.session_state.ocr_cache.get('images', [])
            # 提取資料 (邏輯分流)
            if use_ai_mode:
                import ai_engine
                if ai_engine.is_ollama_available():
                    # --- AI Result Caching Logic ---
                    cached_ai_result = st.session_state.ocr_cache.get('ai_result')
                    cached_model = st.session_state.ocr_cache.get('last_text_model')
                    
                    # Check if cache is valid (exists and model hasn't changed)
                    if cached_ai_result and cached_model == text_model:
                        ai_result = cached_ai_result
                        st.caption(f"⚡ 使用 AI 分析快取資料 (Model: {text_model})")
                    else:
                        # 執行 AI 分析
                        with st.spinner(f"🤖 AI ({text_model}) 正在分析文件內容..."):
                            if use_vision_ai:
                                # === Vision AI 混合模式 ===
                                st.info("👁️ 正在使用 Vision AI 進行視覺化分析 (Llama 3.2 Vision)...")
                                
                                # 1. 使用 Vision AI 分析文件結構與勾選項目 (針對圖片)
                                # 注意: 這裡假設使用者已安裝 llama3.2-vision
                                vision_result = ai_engine.analyze_document_structure(cached_images, model="llama3.2-vision")
                                
                                # 2. 使用 Text AI 分析基本資料 (針對第一頁 OCR 文字)
                                # Vision 模型有時對密集文字的提取不如純文字模型穩定，因此混合使用
                                text_result = ai_engine.analyze_page_with_ai(page_one_text, model=text_model)
                                
                                # 3. 合併結果
                                ai_result = text_result
                                if vision_result.get('required_items'):
                                    ai_result['equipment_list'] = vision_result['required_items']
                                    st.toast(f"Vision AI 成功提取 {len(ai_result['equipment_list'])} 項設備", icon="👁️")
                                else:
                                    st.warning("Vision AI 未能提取到設備清單，將使用 OCR 文字分析結果作為備案。")
                                
                            else:
                                # === 純文字模式 ===
                                ai_result = ai_engine.analyze_document(pages_text, model=text_model)
                            
                            # 立即應用簡繁轉換
                            ai_result = utils.convert_to_traditional(ai_result)
                            
                            # Save to cache
                            st.session_state.ocr_cache['ai_result'] = ai_result
                            st.session_state.ocr_cache['last_text_model'] = text_model
                            st.toast("已完成 AI 智慧分析", icon="🤖")
                    
                    # 處理 AI 結果
                    if "error" in ai_result:
                        st.error(f"AI 分析錯誤: {ai_result['error']}")
                        if "raw_response" in ai_result:
                            with st.expander("🔍 查看 AI 原始回應 (除錯用)"):
                                st.code(ai_result["raw_response"])
                        
                        extracted_data = extract_info_from_ocr(page_one_text, pages_text)
                        # 應用簡繁轉換
                        extracted_data = utils.convert_to_traditional(extracted_data)
                    else:
                        # 定義清洗函式
                        def clean_ai_value(val):
                            if isinstance(val, dict):
                                return str(list(val.values())[0]).replace(" ", "")
                            if isinstance(val, list):
                                return "、".join([str(v) for v in val])
                            if val is None:
                                return ""
                            if isinstance(val, str):
                                return val.replace(" ", "")
                            return str(val).replace(" ", "")

                        # Helper function to process equipment list
                        def process_equipment_list(eq_list):
                            if not eq_list: return ""
                            processed = []
                            for item in eq_list:
                                clean_item = clean_ai_value(item)
                                if clean_item:
                                    processed.append(clean_item)
                            return "、".join(processed)

                        # 嘗試映射欄位
                        extracted_data = {
                            '場所名稱': clean_ai_value(ai_result.get('place_name')),
                            '場所地址': clean_ai_value(ai_result.get('address')),
                            '管理權人': clean_ai_value(ai_result.get('management_person')),
                            '場所電話': clean_ai_value(ai_result.get('phone_number')),
                            '消防設備種類': process_equipment_list(ai_result.get('equipment_list', []))
                        }
                        
                        # --- 強制獲取目錄頁碼 (TOC Page Number) ---
                        ocr_info_for_toc = extract_info_from_ocr(page_one_text, pages_text)
                        if 'toc_page_num' in ocr_info_for_toc:
                            extracted_data['toc_page_num'] = ocr_info_for_toc['toc_page_num']
                        
                        # --- Fallback 機制 ---
                        # 如果 AI 未能識別場所名稱或消防設備種類，使用 OCR 規則提取補救
                        needs_fallback = (
                            not extracted_data.get('場所名稱') or 
                            not extracted_data.get('消防設備種類')
                        )
                        
                        if needs_fallback:
                            if not extracted_data.get('場所名稱'):
                                st.warning("⚠️ AI 未能識別場所名稱，嘗試使用規則提取補救...")
                            if not extracted_data.get('消防設備種類'):
                                st.warning("⚠️ AI 未能識別消防設備種類，嘗試使用 OCR 規則提取補救...")
                            
                            fallback_data = extract_info_from_ocr(page_one_text, pages_text)
                            for key, val in fallback_data.items():
                                if not extracted_data.get(key):
                                    extracted_data[key] = val
                        
                        with st.expander("🤖 查看 AI 完整分析結果 (JSON)", expanded=False):
                            st.json(ai_result)
                else:
                    st.warning("⚠️ 偵測不到 Ollama 服務，已自動切換回傳統 OCR 規則模式")
                    extracted_data = extract_info_from_ocr(page_one_text, pages_text)
                    # 應用簡繁轉換
                    extracted_data = utils.convert_to_traditional(extracted_data)
            else:
                # 傳統 OCR 規則模式
                extracted_data = extract_info_from_ocr(page_one_text, pages_text)
                # 應用簡繁轉換
                extracted_data = utils.convert_to_traditional(extracted_data)
                
            ocr_place_name = extracted_data.get('場所名稱', '')

            # 顯示圖片與 OCR 結果 (這是 Rerun 後或 Cache Hit 會看到的)
            for i, img in enumerate(cached_images):
                st.image(img, caption=f"第 {i+1} 頁", use_column_width=True)
                with st.expander(f"第 {i+1} 頁 OCR 文字內容 (除錯用)", expanded=False):

                    # 顯示每一頁的前30個字和完整內容

                    if i < len(pages_text):

                        page_text = pages_text[i]

                        preview_text = page_text[:30] if len(page_text) > 30 else page_text

                        st.text(f"前30字: {preview_text}")

                        st.text(f"\n完整內容:\n{page_text}")

                    else:

                        st.text("(無法取得此頁內容)")

                    
                    if "Error" in all_ocr_text:
                            st.error("OCR 執行失敗，請檢查側邊欄的 Tesseract 設定。")
    else:
        st.info("👈 請在上方選擇案件以開始比對。")

# 邏輯：決定使用哪一筆系統資料 (target_row)
# 優先順序：
# 1. 自動比對：若 OCR 有抓到場所名稱，且在系統資料中找得到 (完全符合或包含)
# 2. 手動選擇：使用側邊欄選取的 selected_place

auto_matched_place = None
if df_system is not None and ocr_place_name:
    # === 改進：先清理 OCR 場所名稱中的空格 ===
    clean_ocr_place = ocr_place_name.replace(" ", "").replace("　", "").replace("台", "臺")
    
    print(f"🔍 DEBUG: Attempting auto-match. OCR place name: [{ocr_place_name}] -> cleaned: [{clean_ocr_place}]")
    print(f"🔍 DEBUG: df_system has {len(df_system)} rows")
    
    # 1. 嘗試完全符合（先使用清理後的名稱）
    # 為系統資料建立清理後的比對欄位
    df_system['_clean_name'] = df_system['場所名稱'].astype(str).str.replace(" ", "").str.replace("　", "").str.replace("台", "臺")
    
    match = df_system[df_system['_clean_name'] == clean_ocr_place]
    if not match.empty:
        auto_matched_place = match.iloc[0]['場所名稱']  # 使用原始名稱
        target_row = match.iloc[0]
        print(f"✅ DEBUG: Exact match found! place: [{auto_matched_place}], equipment: [{target_row.get('消防安全設備', 'N/A')}]")
    else:
        # 2. 模糊/包含搜尋
        for idx, row in df_system.iterrows():
            sys_name = str(row['場所名稱'])
            clean_sys = row['_clean_name']
            
            if clean_ocr_place and (clean_ocr_place in clean_sys or clean_sys in clean_ocr_place):
                auto_matched_place = sys_name
                target_row = row
                print(f"✅ DEBUG: Fuzzy match found! place: [{auto_matched_place}], equipment: [{target_row.get('消防安全設備', 'N/A')}]")
                break
    
    # 清理臨時欄位
    if '_clean_name' in df_system.columns:
        df_system.drop('_clean_name', axis=1, inplace=True)

# 如果沒有自動比對到，則使用手動選擇的
if target_row is None and selected_place and df_system is not None:
    match = df_system[df_system['場所名稱'] == selected_place]
    if not match.empty:
        target_row = match.iloc[0]

# 即使自動比對成功,若手動選擇了不同場所,優先使用手動選擇
if selected_place and df_system is not None and auto_matched_place != selected_place:
    match = df_system[df_system['場所名稱'] == selected_place]
    if not match.empty:
        target_row = match.iloc[0]

# 右欄：系統列管資料
with col2:
    # --- 審核區塊 (置頂) ---
    st.markdown("### 👮 案件審核")
    
    # 申請人信箱
    default_email = target_case['applicant_email'] if target_case else ""
    applicant_email = st.text_input("申請人信箱", value=default_email, placeholder="example@email.com")
    
    # 審核結果通知
    st.write("審核結果通知：")
    
    # 自訂訊息輸入框
    custom_message = st.text_area(
        "給申請人的訊息",
        placeholder="請在此輸入要附加給申請人的訊息（選填）...",
        height=100,
        help="此訊息將會附加在通知郵件中發送給申請人"
    )
    
    # 取得 Email 設定
    sender_email = st.secrets["email"].get("sender_email", "") if "email" in st.secrets else ""
    sender_password = st.secrets["email"].get("sender_password", "") if "email" in st.secrets else ""
    
    # 定義發送邏輯
    def handle_review(status, subject_prefix, msg_template, custom_msg=""):
        if not applicant_email:
            st.warning("請先輸入申請人信箱")
            return
        
        # 顯示 UI 訊息 (模擬)
        if status == "success":
            st.success(f"已產生【{subject_prefix}】通知")
            color_theme = "#38a169" # Green
        elif status == "warning":
            st.warning(f"已產生【{subject_prefix}】通知")
            color_theme = "#d97706" # Yellow/Orange
        else:
            st.error(f"已產生【{subject_prefix}】通知")
            color_theme = "#e53e3e" # Red
            
        # 嘗試發送真實郵件
        if sender_email and sender_password:
            with st.spinner("📧 正在發送郵件..."):
                subject = f"【消防局通知】案件審核結果：{subject_prefix}"
                
                # 組合自訂訊息
                custom_msg_html = ""
                if custom_msg and custom_msg.strip():
                    # 將換行轉為 HTML 換行
                    formatted_msg = custom_msg.strip().replace("\n", "<br>")
                    custom_msg_html = f"""
                    <div style="background-color: #f5f5f5; border-left: 4px solid #4a90d9; padding: 15px; margin: 15px 0;">
                        <p style="margin: 0; font-weight: bold; color: #333;">📝 承辦人備註：</p>
                        <p style="margin: 10px 0 0 0; color: #555;">{formatted_msg}</p>
                    </div>
                    """
                
                # 使用 HTML 模板生成內容
                content_html = f"""
                <p>您的消防安全設備檢修申報案件審核結果為：<strong>{subject_prefix}</strong>。</p>
                <p>{msg_template}</p>
                {custom_msg_html}
                <p>若有任何疑問，請聯繫本局預防調查科。</p>
                """
                
                # 呼叫 utils.generate_email_html 生成完整 HTML
                case_dict = dict(target_case) if target_case else {}
                recipient_name = case_dict.get('applicant_name', '申請人')
                
                full_html_body = utils.generate_email_html(
                    title=subject,
                    recipient_name=recipient_name,
                    content_html=content_html,
                    color_theme=color_theme
                )
                
                success, msg = utils.send_email(sender_email, sender_password, applicant_email, subject, full_html_body)
                
                if success:
                    st.toast(f"✅ 郵件已成功發送至 {applicant_email}")
                else:
                    st.error(msg)
        else:
            st.info("💡 提示：若需發送真實郵件，請至側邊欄設定寄件者資訊。")

    # 按鈕區 (移出巢狀 columns)
    b1, b2, b3 = st.columns(3)
    
    with b1:
        if st.button("✅ 合格", use_container_width=True):
            if target_case:
                db_manager.update_case_status(target_case['id'], "可領件")
                st.cache_data.clear()
                handle_review("success", "合格", "恭喜您，案件已審核通過。", custom_message)
                st.rerun()
    
    with b2:
        if st.button("⚠️ 補件", use_container_width=True):
            if target_case:
                db_manager.update_case_status(target_case['id'], "待補件")
                st.cache_data.clear()
                handle_review("warning", "補件", "請儘速補齊相關文件。", custom_message)
                st.rerun()

    with b3:
        if st.button("🚫 退件", use_container_width=True):
            if target_case:
                db_manager.update_case_status(target_case['id'], "已退件")
                st.cache_data.clear()
                handle_review("error", "退件", "案件已被退回，請修正後重新申報。", custom_message)
                st.rerun()
    
    st.divider()
    
    st.subheader("💻 系統列管資料 vs 申報資料")
    
    if target_row is not None:
        # 顯示目前使用的場所資料來源
        if auto_matched_place:
            st.success(f"🤖 已自動對應系統場所：{auto_matched_place}")
        elif selected_place:
            st.info(f"👤 目前手動選擇場所：{selected_place}")
            if ocr_place_name:
                st.warning(f"⚠️ 系統無法自動對應 OCR 場所「{ocr_place_name}」，請確認手動選擇是否正確。")
        
        if target_case and uploaded_file_path:
            # 顯示鎖定資訊
            if page_one_text:
                st.caption("ℹ️ 已鎖定使用第 1 頁內容進行自動填入 (基本資料)")
            
            toc_page_num = extracted_data.get('toc_page_num', 2)
            st.caption(f"ℹ️ 已鎖定使用第 {toc_page_num} 頁內容進行自動填入 (消防設備種類)")
        else:
            st.caption("ℹ️ 等待上傳申報檔案以進行自動填入...")
        
        # 定義欄位對應
        field_mapping = {
            '場所名稱': '場所名稱',
            '場所地址': '場所地址',
            '管理權人': '管理權人姓名',
            '電話': '場所電話',
            '消防設備種類': '消防安全設備'
        }

        # 檢查場所名稱是否一致 (如果是手動選擇才需要警告，自動對應通常就是一致的)
        # 只要有選擇場所且有對應的系統資料,就顯示系統資料
        # 不需要等到上傳檔案或選擇案件
        show_system_data = target_row is not None
        
        # 如果 OCR 場所名稱與手動選擇的場所不符,顯示警告但仍顯示資料
        if show_system_data and not auto_matched_place and ocr_place_name and selected_place:
            clean_ocr = ocr_place_name.replace("台", "臺").replace(" ", "")
            clean_sys = selected_place.replace("台", "臺").replace(" ", "")
            
            if clean_sys not in clean_ocr and clean_ocr not in clean_sys:
                 st.warning(f"⚠️ 注意：OCR 辨識到的場所名稱「{ocr_place_name}」與您選擇的系統場所「{selected_place}」不符,請確認是否正確。")

        # 建立比對表格資料
        comparison_data = []
        
        # 獨立儲存消防設備資料
        equip_sys_val = ""
        equip_ocr_val = ""
        
        for display_name, excel_col in field_mapping.items():
            # 系統資料
            sys_val = ""
            if show_system_data:
                sys_val = target_row.get(excel_col, "無資料")
                if pd.isna(sys_val): sys_val = ""
            
            # 申報資料
            ocr_key = display_name
            if display_name == '電話':
                ocr_key = '場所電話'
            
            ocr_val = extracted_data.get(ocr_key, "")
            
            # 特殊處理：消防設備種類 (獨立處理，不加入表格)
            if display_name == '消防設備種類':
                if isinstance(sys_val, str) and show_system_data:
                    equip_sys_val = normalize_equipment_str(sys_val)
                else:
                    equip_sys_val = sys_val # 可能是空字串
                
                equip_ocr_val = ocr_val
                continue # 跳過加入表格
            
            comparison_data.append({
                "欄位": display_name,
                "系統資料": sys_val,
                "申報資料 (OCR/人工)": ocr_val
            })
            
        # 轉為 DataFrame
        if comparison_data:
            df_comp = pd.DataFrame(comparison_data)
            st.dataframe(
                df_comp,
                column_config={
                    "欄位": st.column_config.TextColumn("比對項目", width="medium"),
                    "系統資料": st.column_config.TextColumn("系統列管資料", width="medium"),
                    "申報資料 (OCR/人工)": st.column_config.TextColumn("申報書資料 (AI/OCR)", width="medium"),
                },
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("尚無比對資料")
        
        # --- 消防設備專屬比對區 ---
        st.write("---")
        with st.expander("🔥 消防設備詳細比對與編輯", expanded=True):
            # 視覺化比對區塊 (Diff View)
            st.subheader("📊 視覺化比對")
            
            # 轉換為集合以進行比對
            sys_set = set(equip_sys_val.split("、")) if equip_sys_val else set()
            ocr_set = set(equip_ocr_val.split("、")) if equip_ocr_val else set()
            
            # 去除空字串
            sys_set.discard("")
            ocr_set.discard("")
            
            # 渲染差異視覺化
            if sys_set or ocr_set:
                diff_html = utils.render_equipment_diff(sys_set, ocr_set)
                st.markdown(diff_html, unsafe_allow_html=True)
            else:
                st.info("無設備資料")
            
            st.divider()
            st.subheader("✏️ 編輯設備清單")
            
            col_equip1, col_equip2 = st.columns(2)
            
            # 格式化顯示 (將頓號轉為換行)
            fmt_sys_val = equip_sys_val.replace("、", "\n") if equip_sys_val else ""
            
            # --- Session State 同步邏輯 (修正申報資料未載入問題) ---
            # 初始化 last_equip_ocr_val
            if "last_equip_ocr_val" not in st.session_state:
                st.session_state.last_equip_ocr_val = equip_ocr_val
                st.session_state.modified_equip_ocr = equip_ocr_val
            
            # 如果檢測到 equip_ocr_val 改變了 (例如 AI 重新分析完成)，強制更新 modified_equip_ocr
            if equip_ocr_val != st.session_state.last_equip_ocr_val:
                st.session_state.modified_equip_ocr = equip_ocr_val
                st.session_state.last_equip_ocr_val = equip_ocr_val
            
            # 確保 modified_equip_ocr 存在
            if "modified_equip_ocr" not in st.session_state:
                st.session_state.modified_equip_ocr = equip_ocr_val
            
            # 格式化 OCR 值 (顯示用)
            fmt_ocr_val = st.session_state.modified_equip_ocr.replace("、", "\n") if st.session_state.modified_equip_ocr else ""

            with col_equip1:
                st.text_area("系統列管設備 (唯讀)", value=fmt_sys_val, height=200, disabled=True)
            
            with col_equip2:
                new_equip_str = st.text_area("申報設備 (可編輯)", value=fmt_ocr_val, height=200, help="若辨識有誤，請在此修正 (每行一項)")
                
                # 處理修改
                if new_equip_str != fmt_ocr_val:
                    # 將換行轉回頓號儲存
                    updated_val = new_equip_str.replace("\n", "、")
                    st.session_state.modified_equip_ocr = updated_val
                    equip_ocr_val = updated_val
                    st.rerun()
                else:
                    # 使用 Session State 的值 (轉回頓號格式) 作為比對用
                    equip_ocr_val = st.session_state.modified_equip_ocr

        # 檢核清單
        st.write("### ✅ 差異檢核")
        
        # 自動判斷差異 (表格部分)
        if comparison_data:
            for item in comparison_data:
                field = item['欄位']
                sys_val = str(item['系統資料']).strip()
                ocr_val = str(item['申報資料 (OCR/人工)']).strip()
                
                # 地址模糊比對邏輯
                if field == '場所地址':
                    # 定義正規化函式
                    def normalize_addr(addr):
                        if not addr: return ""
                        # 1. 統一 台/臺
                        addr = addr.replace("台", "臺")
                        # 2. 去除開頭的 "臺東縣" (或 "台東縣")
                        addr = addr.replace("臺東縣", "")
                        # 3. 去除空白
                        addr = addr.replace(" ", "")
                        return addr
                    
                    norm_sys = normalize_addr(sys_val)
                    norm_ocr = normalize_addr(ocr_val)
                    
                    # 嚴格判斷邏輯
                    if not sys_val and ocr_val:
                        st.error(f"❌ 【{field}】不一致 (系統無資料)")
                    elif not sys_val and not ocr_val:
                        st.success(f"✅ 【{field}】一致 (皆無資料)")
                    elif sys_val and not ocr_val:
                        st.warning(f"⚠️ 【{field}】申報資料空白 (系統: {sys_val})")
                    else:
                        # 兩者皆有值，進行比對
                        if norm_sys == norm_ocr:
                            st.success(f"✅ 【{field}】一致")
                        elif norm_ocr in norm_sys or norm_sys in norm_ocr:
                            st.success(f"✅ 【{field}】一致 (模糊比對成功)")
                        else:
                            st.error(f"❌ 【{field}】不一致！\n系統：{sys_val}\n申報：{ocr_val}")
                
                # 其他欄位的一般比對
                else:
                    # 嚴格判斷邏輯
                    if not sys_val and ocr_val:
                        st.error(f"❌ 【{field}】不一致 (系統無資料)")
                    elif not sys_val and not ocr_val:
                        st.success(f"✅ 【{field}】一致 (皆無資料)")
                    elif sys_val and not ocr_val:
                        st.warning(f"⚠️ 【{field}】申報資料空白 (系統: {sys_val})")
                    else:
                        # 兩者皆有值
                        if sys_val == ocr_val:
                            st.success(f"✅ 【{field}】一致")
                        elif ocr_val in sys_val or sys_val in ocr_val:
                             st.success(f"✅ 【{field}】一致 (部分符合)")
                        else:
                             st.error(f"❌ 【{field}】不一致！\n系統：{sys_val}\n申報：{ocr_val}")

        # --- 消防設備比對邏輯 (獨立) ---
        field = '消防設備種類'
        sys_val = equip_sys_val
        ocr_val = equip_ocr_val
        
        # 嚴格判斷邏輯
        if not sys_val and ocr_val:
            st.error(f"❌ 【{field}】不一致 (系統無資料)")
            # 依然顯示差異詳情
            ocr_set = set(ocr_val.split("、")) if ocr_val else set()
            ocr_set.discard("")
            col1, col2 = st.columns(2)
            with col1:
                 st.markdown("**❌ 系統無資料**")
            with col2:
                 st.markdown(f"**❓ 申報資料：**")
                 for item in ocr_set:
                     st.markdown(f"- <span style='color:orange'>{item}</span>", unsafe_allow_html=True)
                     
        elif not sys_val and not ocr_val:
            st.success(f"✅ 【{field}】一致 (皆無資料)")
        elif sys_val and not ocr_val:
            st.warning(f"⚠️ 【{field}】申報資料空白 (系統: {sys_val})")
        else:
            # 兩者皆有值
            if sys_val != ocr_val:
                # 轉為集合進行比對
                sys_set = set(sys_val.split("、")) if sys_val else set()
                ocr_set = set(ocr_val.split("、")) if ocr_val else set()
                
                # 去除空字串
                sys_set.discard("")
                ocr_set.discard("")
                
                # 計算差異
                missing_in_ocr = sys_set - ocr_set # 系統有，申報無 (漏報?)
                extra_in_ocr = ocr_set - sys_set   # 申報有，系統無 (新增?)
                
                if not missing_in_ocr and not extra_in_ocr:
                    st.success(f"✅ 【{field}】一致")
                else:
                    st.error(f"⚠️ 【{field}】不一致！")
                    
                    # 使用 Columns 顯示差異，比較清楚
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        if missing_in_ocr:
                            st.markdown(f"**❌ 系統有，但申報資料未列出：**")
                            for item in missing_in_ocr:
                                st.markdown(f"- <span style='color:red'>{item}</span>", unsafe_allow_html=True)
                        else:
                            st.markdown("**✅ 系統項目皆已申報**")
                            
                    with col2:
                        if extra_in_ocr:
                            st.markdown(f"**❓ 申報資料多出的項目：**")
                            for item in extra_in_ocr:
                                st.markdown(f"- <span style='color:orange'>{item}</span>", unsafe_allow_html=True)
                        else:
                            st.markdown("**✅ 無額外申報項目**")
            else:
                st.success(f"✅ 【{field}】一致")

        # --- 新增：檢查項目 (消防設備) ---
        st.write("---")
        st.subheader("✅ 檢查項目 (消防安全設備)")
        
        # 定義設備清單
        equipment_categories = {
            "滅火設備": [
                "滅火器", "室內消防栓設備", "室外消防栓設備", "自動撒水設備", 
                "水霧滅火設備", "泡沫滅火設備", "惰性氣體滅火設備", "乾粉滅火設備", 
                "海龍滅火設備", "簡易自動滅火設備", "鹵化烴滅火設備"
            ],
            "警報設備": [
                "火警自動警報設備", "瓦斯漏氣火警自動警報設備", "緊急廣播設備", 
                "一一九火災通報裝置"
            ],
            "避難逃生設備": [
                "標示設備", "避難器具", "緊急照明設備"
            ],
            "消防搶救上之必要設備": [
                "連結送水管", "消防專用蓄水池", "排煙設備", "無線電通信輔助設備", 
                "緊急電源插座", "防災監控系統綜合操作裝置"
            ],
            "其他": [
                "冷卻撒水設備", "射水設備", "配線"
            ]
        }
        
        # === 改進：使用 OCR 識別的設備 + 系統資料雙重判斷 ===
        # 將 OCR 設備字串轉為集合
        ocr_equip_str = equip_ocr_val if 'equip_ocr_val' in dir() and equip_ocr_val else ""
        ocr_equip_set = set(ocr_equip_str.split("、")) if ocr_equip_str else set()
        ocr_equip_set.discard("")
        
        # 系統資料字串
        system_row_str = target_row.to_string() if target_row is not None else ""
        
        # 用來收集已勾選的設備 (用於同步到編輯清單)
        checkbox_detected_items = []
        
        # 顯示 Checkbox
        for category, items in equipment_categories.items():
            st.write(f"**{category}**")
            cols = st.columns(3) # 分三欄顯示比較整齊
            for i, item in enumerate(items):
                # 判斷是否要打勾：
                # 1. OCR 識別的設備中有該項目
                # 2. 或系統資料中有該項目 (作為備案)
                is_in_ocr = any(item in eq or eq in item for eq in ocr_equip_set if eq)
                is_in_system = item in system_row_str
                is_checked = is_in_ocr or is_in_system
                
                # 收集已勾選的設備
                if is_checked:
                    checkbox_detected_items.append(item)
                
                # 使用 columns 排版
                with cols[i % 3]:
                    # 如果是 OCR 偵測到的，顯示綠色；如果只在系統有則顯示藍色
                    if is_in_ocr:
                        st.checkbox(f"✅ {item}", value=True, key=f"chk_{item}", disabled=True)
                    elif is_in_system:
                        st.checkbox(f"📋 {item}", value=True, key=f"chk_{item}", disabled=True, help="系統列管項目")
                    else:
                        st.checkbox(item, value=False, key=f"chk_{item}", disabled=True)
        
        # === 同步到編輯設備清單 ===
        # 如果 OCR 沒有偵測到任何設備，但 checkbox 區塊有偵測到，則同步
        if not equip_ocr_val and checkbox_detected_items:
            # 更新 session state
            synced_equip = "、".join(checkbox_detected_items)
            if st.session_state.get('modified_equip_ocr') != synced_equip:
                st.session_state.modified_equip_ocr = synced_equip
                st.session_state.last_equip_ocr_val = synced_equip
                st.info(f"ℹ️ 已從檢查項目同步 {len(checkbox_detected_items)} 項設備到編輯清單")
    
    else:
        # 即使沒有比對成功,也要顯示已分析的申報資料
        if 'extracted_data' in dir() and extracted_data:
            # 顯示更具體的提示訊息
            if ocr_place_name and df_system is not None:
                st.warning(f"⚠️ 系統無法自動對應 OCR 辨識到的場所「{ocr_place_name}」到系統列管資料。")
                st.caption("💡 可能原因：場所名稱不在系統資料中，或名稱有些微差異。請嘗試在左側手動選擇正確的場所名稱。")
                
                # 嘗試提供相似名稱建議
                if df_system is not None and '場所名稱' in df_system.columns:
                    clean_ocr = ocr_place_name.replace("台", "臺").replace(" ", "")
                    similar_places = []
                    for place in df_system['場所名稱'].astype(str).unique():
                        clean_place = place.replace("台", "臺").replace(" ", "")
                        # 檢查是否有部分匹配
                        if any(char in clean_place for char in clean_ocr if char):
                            similar_places.append(place)
                    
                    if similar_places and len(similar_places) <= 10:
                        with st.expander("🔍 可能相似的場所名稱", expanded=True):
                            for sp in similar_places[:5]:
                                st.write(f"• {sp}")
            elif df_system is None:
                st.error("❌ 尚未載入系統 Excel 資料，無法進行比對。")
                st.info("👈 請在左側「設定與資料來源」區塊設定 Excel 路徑。")
            else:
                st.info("⚠️ 尚未選擇系統場所進行比對,但以下是 OCR/AI 分析結果：")
            
            # 顯示分析結果
            st.markdown("#### 📄 申報資料 (OCR/AI 分析)")
            
            display_fields = ['場所名稱', '場所地址', '管理權人', '場所電話']
            for field in display_fields:
                val = extracted_data.get(field, '')
                if val:
                    st.text_input(f"{field}", value=val, disabled=True, key=f"display_{field}")
            
            # 顯示消防設備
            equip_val = extracted_data.get('消防設備種類', '')
            if equip_val:
                st.text_area("消防設備種類", value=equip_val.replace("、", "\n") if equip_val else "", height=150, disabled=True, key="display_equip")
        else:
            if df_system is None:
                 st.warning("請先在左側載入系統 Excel 資料。")
            elif not selected_place:
                 st.info("👈 請先從左側選單選擇一個場所，以開始進行比對。")
            else:
                 st.info("👈 請在上方選擇案件以開始比對。")

# ==========================================
# Tab 2: 文件完整性檢查
# ==========================================
with tab_check:
    st.subheader("📑 文件完整性檢查")
    
    # 顯示當前使用的分析模式
    if use_vision_ai:
        st.caption("🔍 使用 Vision AI 模式 (直接分析掃描圖片)")
    else:
        st.caption("📝 使用傳統 OCR 模式 (Tesseract)")
    
    if 'ocr_cache' in st.session_state and 'pages_info' in st.session_state.ocr_cache:
        images = st.session_state.ocr_cache.get('images', [])
        pages_info = st.session_state.ocr_cache.get('pages_info', [])  # 在兩種模式都需要這個變數
        
        # === Vision AI 模式 ===
        if use_vision_ai and images:
            st.info("🤖 正在使用 Vision AI 進行文件結構分析...")
            
            try:
                import ai_engine
                
                # 檢查 Vision AI 是否可用
                if not ai_engine.is_ollama_available():
                    st.error("❌ Ollama 服務未啟動")
                    st.info("請執行: `ollama serve` 或啟動 Ollama Desktop")
                elif not ai_engine.check_vision_model_available():
                    st.error("❌ Vision 模型未安裝")
                    st.info("請執行: `ollama pull llama3.2-vision`")
                else:
                    # 執行 Vision AI 分析 (使用 cache 避免重複分析)
                    cache_key = st.session_state.ocr_cache.get('file_key')
                    
                    if 'vision_analysis' not in st.session_state or st.session_state.get('vision_cache_key') != cache_key:
                        with st.spinner("🔍 Vision AI 正在分析文件結構 (可能需要 1-2 分鐘)..."):
                            result = ai_engine.analyze_document_structure(images)
                            st.session_state.vision_analysis = result
                            st.session_state.vision_cache_key = cache_key
                    else:
                        result = st.session_state.vision_analysis
                        st.success("✅ 使用快取的 Vision AI 分析結果")
                    
                    if result.get('error'):
                        st.error(f"❌ Vision AI 分析失敗: {result['error']}")
                    else:
                        # 顯示頁面識別結果
                        col_v1, col_v2 = st.columns([1, 1])
                        
                        with col_v1:
                            st.markdown("#### 1. 頁面識別結果")
                            page_map_df = pd.DataFrame([
                                {'頁碼': k, '文件類型': v} 
                                for k, v in result['page_map'].items()
                            ])
                            st.dataframe(page_map_df, use_container_width=True, hide_index=True)
                            
                            if result['toc_page']:
                                st.success(f"✅ 已識別目錄頁: 第 {result['toc_page']} 頁")
                                st.write("**目錄勾選項目:**")
                                if result['required_items']:
                                    for item in result['required_items']:
                                        st.markdown(f"- {item}")
                                else:
                                    st.info("未檢測到勾選項目")
                        
                        with col_v2:
                            st.markdown("#### 2. 完整性驗證報告")
                            if result['validation_report'] is not None and not result['validation_report'].empty:
                                st.dataframe(
                                    result['validation_report'],
                                    use_container_width=True,
                                    hide_index=True
                                )
                                
                                # 統計
                                missing = result['validation_report']['狀態'].str.contains('缺件').sum()
                                if missing == 0:
                                    st.success("🎉 文件完整！所有勾選項目皆已檢附。")
                                else:
                                    st.error(f"⚠️ 發現 {missing} 項缺件")
                            else:
                                st.info("目錄頁未勾選任何項目")
                
            except ImportError:
                st.error("❌ ai_engine 模組載入失敗")
            except Exception as e:
                st.error(f"❌ Vision AI 執行錯誤: {e}")
        
        # === 傳統 OCR 模式 ===
        # (pages_info 已在上方統一初始化)
        
        # 建立兩欄版面配置（Vision AI 和傳統模式都需要）
        col_check_1, col_check_2 = st.columns([1, 1])
        
        # 初始化變數（兩種模式都需要）
        selected_reqs = []
        
        # 傳統 OCR 模式的特定邏輯
        if not use_vision_ai:
            with col_check_1:
                st.markdown("#### 1. 目錄解析")
                # Find TOC
                toc_page = next((p for p in pages_info if p['type'] == '目錄'), None)
                
                # Fallback: Search by keywords if not found (針對 OCR 雜訊處理)
                if not toc_page:
                    toc_keywords = ["目錄", "附表", "消防安全設備檢修申報書目錄"]
                    for p in pages_info:
                        # 取前 200 字並清洗 (去除空格、豎線、全形空格)
                        clean_text = p['text'][:200].replace(" ", "").replace("|", "").replace("　", "")
                        
                        # 檢查關鍵字
                        if any(kw in clean_text for kw in toc_keywords):
                            toc_page = p
                            p['type'] = '目錄' # 更新類型以便後續顯示
                            break
                
                if toc_page:
                    st.success(f"✅ 已識別目錄頁 (第 {toc_page['page_num']} 頁)")
                    toc_img = images[toc_page['page_num']-1]
                    st.image(toc_img, caption="目錄頁預覽", use_column_width=True)
                    
                    # Parse TOC (Lazy load)
                    if 'detected_reqs' not in st.session_state or st.session_state.get('last_file_key') != st.session_state.ocr_cache.get('file_key'):
                        with st.spinner("🔍 正在分析目錄勾選項目..."):
                            st.session_state.detected_reqs = doc_integrity.parse_toc_requirements(toc_img, toc_page['text'])
                            st.session_state.last_file_key = st.session_state.ocr_cache.get('file_key')
                    
                    # Full list of possible documents
                    all_docs = [
                        "消防安全設備檢修申報表", "消防安全設備檢修報告書", "消防安全設備改善計畫書", "消防安全設備種類及數量表",
                        "滅火器檢查表", "室內消防栓設備檢查表", "自動撒水設備檢查表", "泡沫滅火設備檢查表", 
                        "火警自動警報設備檢查表", "緊急廣播設備檢查表", "標示設備檢查表", "避難設備檢查表",
                        "緊急照明設備檢查表", "連結送水管檢查表", "排煙設備檢查表", "無線電通信輔助設備檢查表",
                        "建築物使用執照影本", "營利事業登記證影本", "專業機構合格證書影本", 
                        "消防設備師(士)證書影本", "管理權人身分證影本"
                    ]
                    
                    # UI for manual correction
                    selected_reqs = st.multiselect(
                        "目錄勾選項目 (系統自動偵測，可手動修正)", 
                        options=all_docs,
                        default=[d for d in st.session_state.detected_reqs if d in all_docs]
                    )
                    
                else:
                    st.warning("⚠️ 未自動識別出目錄頁")
                    st.info("請確認上傳文件包含目錄，或 OCR 辨識是否清晰。")
                    selected_reqs = []

        with col_check_2:
            # 只有在非 Vision AI 模式下才顯示這裡的報告 (避免重複)
            if not use_vision_ai:
                st.markdown("#### 2. 完整性分析報告")
            
            if not selected_reqs:
                st.info("👈 請先確認左側目錄勾選項目")
            else:
                # Analysis Logic
                report_data = []
                
                # Get all identified page types
                found_types = set(p['type'] for p in pages_info)
                
                # 1. Check Required Docs
                for req in selected_reqs:
                    status = "❌ 缺漏"
                    note = ""
                    
                    # Fuzzy match logic
                    # If req is in found_types (exact match)
                    if req in found_types:
                        status = "✅ 已檢附"
                    else:
                        # Fuzzy check
                        # e.g. "滅火器檢查表" vs "滅火器" (from identify_page_type)
                        # Our identify_page_type returns standardized names, so exact match should work if keywords align.
                        # Let's check if any found type contains core keywords of req
                        core_key = req[:4]
                        for ft in found_types:
                            if core_key in ft:
                                status = "✅ 已檢附"
                                note = f"(對應: {ft})"
                                break
                    
                    report_data.append({
                        "項目": req,
                        "狀態": status,
                        "備註": note
                    })
                
                # Display Table
                st.dataframe(
                    pd.DataFrame(report_data),
                    column_config={
                        "狀態": st.column_config.TextColumn("狀態", width="small"),
                    },
                    use_container_width=True,
                    hide_index=True
                )
                
                # Summary
                missing_count = sum(1 for r in report_data if "缺漏" in r['狀態'])
                if missing_count == 0:
                    st.success("🎉 文件完整！所有目錄勾選項目皆已檢附。")
                else:
                    st.error(f"⚠️ 發現 {missing_count} 項缺漏文件，請檢查。")
                    
            st.divider()
            with st.expander("查看所有識別頁面"):
                st.dataframe(
                    pd.DataFrame(pages_info)[['page_num', 'type', 'first_30']],
                    column_config={
                        "page_num": "頁碼",
                        "type": "識別類型",
                        "first_30": "頁首文字 (前30字)"
                    },
                    hide_index=True,
                    use_container_width=True
                )

    else:
        st.info("請先在「申報書比對」分頁上傳並解析文件。")
