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

# 設定頁面配置
st.set_page_config(layout="wide", page_title=f"{cfg.AGENCY_NAME}檢修申報書檢核比對系統")

# ==========================================
# 🔐 登入門禁檢查 (CRITICAL: 必須在所有其他操作之前)
# ==========================================
if "logged_in" not in st.session_state or not st.session_state.logged_in:
    st.warning("⚠️ 此頁面僅限消防局同仁使用，請先進行管理者登入。")
    st.info("正在將您導向至登入頁面...")
    st.page_link("pages/3_案件審核.py", label="🔐 前往登入頁面", icon="🔐")
    st.stop()  # 阻止下方程式碼執行

# 顯示登入使用者資訊
if 'user' in st.session_state and st.session_state.user:
    current_user = dict(st.session_state.user) # 確保轉換為字典，避免 sqlite3.Row 沒有 get 方法的問題
    st.sidebar.success(f"👤 已登入：{current_user.get('username')} ({current_user.get('role')})")
st.sidebar.divider()

# 載入自定義 CSS
import utils
utils.load_custom_css()

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

@st.cache_data
def load_system_data(excel_path):
    """讀取系統列管資料 Excel"""
    if not os.path.exists(excel_path):
        return None
    try:
        # 嘗試讀取 (支援 .xls 和 .xlsx)
        if excel_path.endswith('.xls'):
            df = pd.read_excel(excel_path, header=1, engine='xlrd')
        else:
            df = pd.read_excel(excel_path, header=1)
            
        # 清理欄位名稱 (去除前後空白、換行符號)
        df.columns = df.columns.astype(str).str.strip().str.replace('\n', '').str.replace('\r', '')
        return df
    except Exception as e:
        st.error(f"讀取 Excel 失敗: {e}")
        return None

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
    只保留標準設備清單中的項目，並以頓號分隔。
    """
    if not text or not isinstance(text, str):
        return ""
    
    found_items = []
    # 為了避免重複匹配 (例如 "火警自動警報設備" 包含 "警報設備")
    # 我們已經將列表按長度排序。
    # 但這裡我們採取簡單策略：只要字串中有出現該設備名稱，就列入。
    # 為了避免重複 (例如同一個詞出現兩次)，使用 set 或檢查是否存在
    
    # 先移除常見干擾字元，方便比對
    clean_text = text.replace(" ", "").replace("　", "").replace("\n", "")
    
    for item in VALID_EQUIPMENT_LIST:
        if item in clean_text:
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
        
        # 1. 優先尋找包含 "消防安全設備檢修申報書目錄" 的頁面
        for page_text in pages_text_list:
            if "消防安全設備檢修申報書目錄" in page_text.replace(" ", ""):
                target_page_text = page_text
                break
        
        # 2. 如果找不到，回退使用第二頁 (Index 1)
        if not target_page_text and len(pages_text_list) > 1:
            target_page_text = pages_text_list[1]
            
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
# 如果 Session 中沒有 key，或是值為空 (例如被清空)，則重新偵測並設定預設值
if "tesseract_exe_path" not in st.session_state or not st.session_state["tesseract_exe_path"]:
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"D:\Program Files\Tesseract-OCR\tesseract.exe",
        r"E:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"D:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
    ]
    detected_path = possible_paths[0]
    for p in possible_paths:
        if os.path.exists(p):
            detected_path = p
            break
    st.session_state["tesseract_exe_path"] = detected_path

# Excel 路徑初始化
if "system_excel_path" not in st.session_state or not st.session_state["system_excel_path"]:
    st.session_state["system_excel_path"] = r"d:\下載\downloads\00. 列管場所資料.xls"

# 檢查狀態以決定 Expander 是否展開
# 使用 Session State 的值進行檢查，確保穩定性

# --- DEBUG: 輸出路徑檢查資訊 ---
print("-" * 50, flush=True)
print(f"DEBUG: Check Tesseract Path: [{st.session_state.get('tesseract_exe_path')}]", flush=True)
print(f"DEBUG: Check Excel Path: [{st.session_state.get('system_excel_path')}]", flush=True)
print("-" * 50, flush=True)
# -----------------------------

tesseract_is_ok = os.path.exists(st.session_state["tesseract_exe_path"])
excel_is_loaded = False

if os.path.exists(st.session_state["system_excel_path"]):
    # 嘗試預載入檢查 (利用 cache)
    df_check = load_system_data(st.session_state["system_excel_path"])
    if df_check is not None and not df_check.empty:
        excel_is_loaded = True

expand_config = not (tesseract_is_ok and excel_is_loaded)

# --- 側邊欄：資料載入 ---
with st.sidebar:
    # 使用 Expander 包覆設定
    with st.expander("1. 設定與資料來源", expanded=expand_config):
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
        
        # 系統資料設定
        st.markdown("#### 列管場所資料來源")
        system_file_path = st.text_input("系統 Excel 路徑", key="system_excel_path")
        
        if not os.path.exists(system_file_path):
             st.error("❌ 找不到 Excel 檔案")

    # 載入資料 (使用 Session State 的值)
    df_system = load_system_data(st.session_state["system_excel_path"])
    
    selected_place = None
    
    if df_system is not None:
        # st.success(f"已載入系統資料: {len(df_system)} 筆") # 為了版面簡潔，隱藏此訊息，或移至 Expander 內
        
        # 除錯用：顯示欄位名稱
        with st.expander("🔍 查看 Excel 欄位名稱 (除錯用)"):
            st.write(df_system.columns.tolist())
        
        # 2. 選擇場所 (增加搜尋功能)
        st.header("2. 選擇比對場所")
        
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
        
    else:
        st.warning("尚未載入系統資料，請確認路徑。")

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

# 1. 先建立版面 (左右分欄)
col1, col2 = st.columns([1, 1])

# 用於儲存 OCR 結果
all_ocr_text = ""
page_one_text = ""
page_two_text = ""
extracted_data = {}
ocr_place_name = ""

# 左欄：民眾申報資料 (PDF/圖片)
with col1:
    st.subheader("📄 民眾申報資料 (OCR 辨識)")
    
    if target_case and uploaded_file_path:
        if not os.path.exists(uploaded_file_path):
             st.error(f"❌ 找不到檔案：{uploaded_file_path}")
        else:
            # 產生檔案唯一識別碼 (使用檔名+大小)
            file_key = f"{os.path.basename(uploaded_file_path)}_{os.path.getsize(uploaded_file_path)}"
            
            # 檢查 Session State 是否已有此檔案的 OCR 結果
            if 'ocr_cache' not in st.session_state:
                st.session_state.ocr_cache = {}
            
            # 如果是新檔案或尚未辨識過
            if st.session_state.ocr_cache.get('file_key') != file_key:
                # 1. 先轉換並顯示圖片 (讓使用者先看到預覽)
                images = []
                try:
                    if uploaded_file_path.lower().endswith(".pdf"):
                        # 顯示轉換訊息
                        with st.spinner("📄 正在將 PDF 轉換為圖片..."):
                            with open(uploaded_file_path, "rb") as f:
                                images = pdf_to_images(f)
                    else:
                        images = [Image.open(uploaded_file_path)]
                except Exception as e:
                    st.error(f"無法讀取檔案: {e}")
                    images = []
                
                if images:
                    # 先顯示圖片預覽
                    for i, img in enumerate(images):
                        st.image(img, caption=f"第 {i+1} 頁 (預覽)", use_container_width=True)
                    
                    # 2. 執行 OCR
                    with st.spinner("🔍 正在進行 OCR 辨識中 (請稍候)..."):
                        temp_all_text = ""
                        temp_p1_text = ""
                        temp_p2_text = ""
                        
                        # 執行 OCR
                        pages_text = []
                        for i, img in enumerate(images):
                            ocr_text = perform_ocr(img, tesseract_path)
                            temp_all_text += ocr_text + "\n"
                            pages_text.append(ocr_text)
                            
                            if i == 0: temp_p1_text = ocr_text
                            if i == 1: temp_p2_text = ocr_text
                        
                        # 存入 Session State
                        st.session_state.ocr_cache['file_key'] = file_key
                        st.session_state.ocr_cache['all_ocr_text'] = temp_all_text
                        st.session_state.ocr_cache['page_one_text'] = temp_p1_text
                        st.session_state.ocr_cache['page_two_text'] = temp_p2_text
                        st.session_state.ocr_cache['pages_text'] = pages_text # 儲存所有頁面文字
                        st.session_state.ocr_cache['images'] = images 
                        
                        # 重新整理頁面以顯示 OCR 結果
                        st.rerun()
            
            # 從 Session State 取出資料 (Cache Hit)
            all_ocr_text = st.session_state.ocr_cache.get('all_ocr_text', "")
            page_one_text = st.session_state.ocr_cache.get('page_one_text', "")
            page_two_text = st.session_state.ocr_cache.get('page_two_text', "")
            pages_text = st.session_state.ocr_cache.get('pages_text', [])
            cached_images = st.session_state.ocr_cache.get('images', [])
            
            # 提取資料
            extracted_data = extract_info_from_ocr(page_one_text, pages_text)
            ocr_place_name = extracted_data.get('場所名稱', '')

            # 顯示圖片與 OCR 結果 (這是 Rerun 後或 Cache Hit 會看到的)
            for i, img in enumerate(cached_images):
                st.image(img, caption=f"第 {i+1} 頁", use_container_width=True)
                with st.expander(f"第 {i+1} 頁 OCR 文字內容 (除錯用)", expanded=False):
                    if i == 0: st.text(page_one_text)
                    elif i == 1: st.text(page_two_text)
                    else: st.text("(其他頁面內容請見總覽)")
                    
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
    # 嘗試自動搜尋
    # 1. 完全符合
    match = df_system[df_system['場所名稱'] == ocr_place_name]
    if not match.empty:
        auto_matched_place = ocr_place_name
        target_row = match.iloc[0]
    else:
        # 2. 模糊/包含搜尋 (去除台/臺差異)
        clean_ocr = ocr_place_name.replace("台", "臺").replace(" ", "")
        
        # 搜尋系統資料中是否有包含此名稱的
        # 這裡做一個簡單的遍歷搜尋
        for idx, row in df_system.iterrows():
            sys_name = str(row['場所名稱'])
            clean_sys = sys_name.replace("台", "臺").replace(" ", "")
            
            if clean_ocr and (clean_ocr in clean_sys or clean_sys in clean_ocr):
                auto_matched_place = sys_name
                target_row = row
                break

# 如果沒有自動比對到，則使用手動選擇的
if target_row is None and selected_place and df_system is not None:
    target_row = df_system[df_system['場所名稱'] == selected_place].iloc[0]

# 右欄：系統列管資料
with col2:
    # --- 審核區塊 (置頂) ---
    st.markdown("### 👮 案件審核")
    review_col1, review_col2 = st.columns([2, 3])
    with review_col1:
        default_email = target_case['applicant_email'] if target_case else ""
        applicant_email = st.text_input("申請人信箱", value=default_email, placeholder="example@email.com")
    with review_col2:
        st.write("審核結果通知：")
        
        # 狀態選擇 UI (已移除，改由下方按鈕直接觸發)
        # current_status = target_case['status'] if target_case else "待分案"
        # status_options = ["待分案", "審核中", "可領件", "已退件", "待補件"]
        # ...
        
        b1, b2, b3 = st.columns(3)
        
        # 取得 Email 設定
        sender_email = st.secrets["email"].get("sender_email", "") if "email" in st.secrets else ""
        sender_password = st.secrets["email"].get("sender_password", "") if "email" in st.secrets else ""
        
        # 定義發送邏輯
        def handle_review(status, subject_prefix, msg_template):
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
                    
                    # 使用 HTML 模板生成內容
                    content_html = f"""
                    <p>您的消防安全設備檢修申報案件審核結果為：<strong>{subject_prefix}</strong>。</p>
                    <p>{msg_template}</p>
                    <p>若有任何疑問，請聯繫本局預防調查科。</p>
                    """
                    
                    # 呼叫 utils.generate_email_html 生成完整 HTML
                    # 假設申請人姓名為 "申請人" (若有真實姓名可替換)
                    # sqlite3.Row 物件沒有 .get() 方法，需轉換為 dict 或使用 key 存取
                    case_dict = dict(target_case) if target_case else {}
                    recipient_name = case_dict.get('applicant_name', '申請人')
                    
                    full_html_body = utils.generate_email_html(
                        title=subject,
                        recipient_name=recipient_name,
                        content_html=content_html,
                        color_theme=color_theme
                    )
                    
                    # 發送郵件 (注意：send_email 需支援 HTML)
                    # 這裡假設 utils.send_email 或本檔案的 send_email 已更新支援 HTML
                    # 由於本檔案上方有定義 send_email，我們需要確認它是否支援 HTML
                    # 根據之前的觀察，本檔案的 send_email 使用 MIMEText(body, 'plain')，需要修改為 'html'
                    
                    # 為了確保使用 HTML，我們直接呼叫 utils.send_email (如果有的話) 或是修改本檔案的 send_email
                    # 這裡我們選擇呼叫 utils.send_email，因為 utils.py 中已經有支援 HTML 的版本
                    
                    success, msg = utils.send_email(sender_email, sender_password, applicant_email, subject, full_html_body)
                    
                    if success:
                        st.toast(f"✅ 郵件已成功發送至 {applicant_email}")
                    else:
                        st.error(msg)
            else:
                st.info("💡 提示：若需發送真實郵件，請至側邊欄設定寄件者資訊。")

        if b1.button("✅ 合格"):
            db_manager.update_case_status(target_case['id'], "可領件")
            st.cache_data.clear()
            handle_review("success", "合格", "恭喜您，案件已審核通過。")
            st.rerun()
        
        if b2.button("⚠️ 補件"):
            db_manager.update_case_status(target_case['id'], "待補件")
            st.cache_data.clear()
            handle_review("warning", "補件", "請儘速補齊相關文件。")
            st.rerun()

        if b3.button("🚫 退件"):
            db_manager.update_case_status(target_case['id'], "已退件")
            st.cache_data.clear()
            handle_review("error", "退件", "案件已被退回，請修正後重新申報。")
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
            if page_two_text:
                st.caption("ℹ️ 已鎖定使用第 2 頁內容進行自動填入 (消防設備種類)")
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
        # 預設不顯示系統資料，直到有上傳檔案且比對狀態允許
        show_system_data = False
        
        if target_case and uploaded_file_path:
            show_system_data = True
            
            if not auto_matched_place and ocr_place_name and selected_place:
                clean_ocr = ocr_place_name.replace("台", "臺").replace(" ", "")
                clean_sys = selected_place.replace("台", "臺").replace(" ", "")
                
                if clean_sys not in clean_ocr and clean_ocr not in clean_sys:
                     st.error(f"⚠️ 警告：OCR 辨識到的場所名稱「{ocr_place_name}」與您選擇的系統場所「{selected_place}」不符！")
                     # 如果比對不成功，且是手動選擇的不一致，則不顯示系統資料，避免誤導
                     show_system_data = False

        # 建立比對表格資料
        comparison_data = []
        for display_name, excel_col in field_mapping.items():
            # 系統資料
            sys_val = ""
            if show_system_data:
                sys_val = target_row.get(excel_col, "無資料")
                if pd.isna(sys_val): sys_val = ""
            
            # 特殊處理：消防設備種類 (系統資料) - 換行顯示
            if display_name == '消防設備種類' and isinstance(sys_val, str) and show_system_data:
                # 使用標準化函式處理系統資料
                # 這會過濾掉不相關的文字，只保留標準設備名稱，並以頓號分隔
                normalized_sys_val = normalize_equipment_str(sys_val)
                
                # 直接使用頓號分隔
                sys_val = normalized_sys_val
            
            # 申報資料
            ocr_key = display_name
            if display_name == '電話':
                ocr_key = '場所電話'
            
            ocr_val = extracted_data.get(ocr_key, "")
            
            comparison_data.append({
                "欄位": display_name,
                "系統資料": sys_val,
                "申報資料 (OCR/人工)": ocr_val
            })
            
        # 轉為 DataFrame
        df_comparison = pd.DataFrame(comparison_data)
        
        # 顯示可編輯的表格 (讓使用者修正 OCR 結果)
        edited_df = st.data_editor(
            df_comparison,
            column_config={
                "欄位": st.column_config.TextColumn("欄位", disabled=True),
                "系統資料": st.column_config.TextColumn("系統資料 (唯讀)", disabled=True),
                "申報資料 (OCR/人工)": st.column_config.TextColumn(
                    "申報資料 (可編輯修正)",
                    help="若 OCR 辨識錯誤，請直接點擊修改",
                    required=True
                )
            },
            hide_index=True,
            use_container_width=True
        )
        
        st.warning("💡 申報資料欄位若為空白，請參考左側影像手動輸入。")
        
        # 檢核清單
        st.write("### ✅ 差異檢核")
        
        # 自動判斷差異 (簡單比對)
        for index, row in edited_df.iterrows():
            field = row['欄位']
            sys_val = str(row['系統資料']).strip()
            ocr_val = str(row['申報資料 (OCR/人工)']).strip()
            
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
            
            elif field == '消防設備種類':
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
        
        # 嘗試從系統資料中找出所有可能的設備字串
        # 將整列資料轉為字串，方便搜尋
        system_row_str = target_row.to_string() if target_row is not None else ""
        
        # 顯示 Checkbox
        for category, items in equipment_categories.items():
            st.write(f"**{category}**")
            cols = st.columns(3) # 分三欄顯示比較整齊
            for i, item in enumerate(items):
                # 判斷是否要打勾 (如果系統資料裡面有出現這個詞)
                is_checked = item in system_row_str
                
                # 使用 columns 排版
                with cols[i % 3]:
                    st.checkbox(item, value=is_checked, key=f"chk_{item}", disabled=True) # disabled=True 表示唯讀，反映系統資料

    else:
        if df_system is None:
             st.warning("請先在左側載入系統 Excel 資料。")
        elif not selected_place:
             st.info("👈 請先從左側選單選擇一個場所，以開始進行比對。")
        else:
             st.info("👈 請在上方選擇案件以開始比對。")
