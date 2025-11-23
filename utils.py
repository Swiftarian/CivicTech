import streamlit as st
import os
import urllib.request
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import pandas as pd
import fitz  # pymupdf
from PIL import Image
import subprocess
import re
import config_loader as cfg

# ==========================================
# UI 樣式函式
# ==========================================

def load_custom_css():
    """載入全域自定義 CSS 樣式，提升使用者介面體驗"""
    st.markdown("""
    <style>
        /* 1. 放大側邊欄導航字體 */
        [data-testid="stSidebarNav"] span {
            font-size: 1.2rem !important; /* 字體放大 */
            font-weight: 600 !important;  /* 加粗 */
            font-family: "Microsoft JhengHei", sans-serif;
            transition: all 0.3s ease;    /* 增加平滑過渡動畫 */
        }

        /* 2. 滑鼠懸停 (Hover) 的酷炫互動效果 */
        [data-testid="stSidebarNav"] a:hover span {
            color: #00d2ff !important;    /* 懸停時變亮藍色 (Cyberpunk Blue) */
            padding-left: 10px;           /* 向右滑動效果 */
            text-shadow: 0 0 8px rgba(0, 210, 255, 0.6); /* 發光特效 */
        }

        /* 3. 當前選中頁面的樣式 (Active) */
        [data-testid="stSidebarNav"] a[aria-current="page"] span {
            color: #ff4b4b !important;    /* 選中時變紅色 */
            border-left: 3px solid #ff4b4b;
            padding-left: 10px;
        }
        
        /* 4. 優化按鈕樣式 (全域) */
        .stButton > button {
            transition: all 0.2s ease;
        }
        .stButton > button:hover {
            transform: scale(1.02); /* 按鈕懸停微放大 */
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        /* 5. 優化 st.tabs 分頁標籤字體 */
        button[data-baseweb="tab"] {
            font-size: 24px !important;   /* 字體加大 */
            font-weight: 700 !important;  /* 加粗 */
            padding: 10px 20px !important; /* 增加點擊範圍 */
        }
        
        /* 讓 Tab 內的文字垂直置中 */
        button[data-baseweb="tab"] div[data-testid="stMarkdownContainer"] p {
            font-size: 24px !important;
            margin: 0px !important;
        }

        /* 選中狀態的 Tab - 增加科技感 */
        button[data-baseweb="tab"][aria-selected="true"] {
            color: #00d2ff !important;    /* 選中變成科技藍 */
            border-color: #00d2ff !important;
        }
        
        /* 未選中的 Tab */
        button[data-baseweb="tab"][aria-selected="false"] {
            color: #a0a0a0 !important;
        }
        
        /* 6. 強化表單提交按鈕 */
        div[data-testid="stFormSubmitButton"] > button {
            width: 100%;              /* 按鈕全寬 */
            font-size: 1.2rem !important;
            background-color: #e53e3e !important; /* 強制使用消防紅 */
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        div[data-testid="stFormSubmitButton"] > button:hover {
            background-color: #c53030 !important; /* 懸停時變深紅 */
            transform: translateY(-2px);
        }

        /* 7. 優化側邊欄 Expander 標題字體 */
        [data-testid="stSidebar"] [data-testid="stExpanderHeader"] {
            font-size: 1.1rem !important; /* 放大字體 */
            font-weight: 700 !important;  /* 加粗 */
            padding-top: 5px;             /* 增加間距 */
            padding-bottom: 5px;
        }
        
        /* ========================================== */
        /* 8. 平台首頁樣式 (Hero Section & Service Cards) */
        /* ========================================== */
        
        /* Hero Section - 主視覺區 */
        .hero {
            text-align: center;
            padding: 3rem 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px;
            margin-bottom: 2rem;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        }
        
        .hero h1 {
            font-size: 2.8rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        .hero p {
            font-size: 1.3rem;
            opacity: 0.95;
            font-weight: 300;
            letter-spacing: 0.5px;
        }
        
        /* Service Cards - 服務卡片 */
        .service-card {
            background: white;
            border: 2px solid #e8e8e8;
            border-radius: 16px;
            padding: 2.5rem 2rem;
            text-align: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            height: 320px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
        }
        
        .service-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transform: scaleX(0);
            transition: transform 0.4s ease;
        }
        
        .service-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
            border-color: #667eea;
        }
        
        .service-card:hover::before {
            transform: scaleX(1);
        }
        
        .card-icon {
            font-size: 5rem;
            margin-bottom: 1.5rem;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .service-card h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #2d3748;
            line-height: 1.4;
        }
        
        .service-card p {
            font-size: 1rem;
            color: #718096;
            line-height: 1.7;
            margin: 0;
        }
        
        /* 調整按鈕樣式以配合新設計 */
        .stButton > button[kind="primary"] {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            font-weight: 600 !important;
            padding: 0.75rem 2rem !important;
            font-size: 1.1rem !important;
            transition: all 0.3s ease !important;
        }
        
        .stButton > button[kind="primary"]:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4) !important;
        }
    </style>
    """, unsafe_allow_html=True)

# ==========================================
# 設定區
# ==========================================
# 本地 tessdata 資料夾
LOCAL_TESSDATA_DIR = os.path.join(os.getcwd(), "tessdata")

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
        
        msg.attach(MIMEText(body, 'html'))
        
        # 連線到 Gmail SMTP Server (使用 SSL)
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True, "發送成功"
    except Exception as e:
        return False, f"發送失敗: {e}"

def generate_email_html(title, recipient_name, content_html, highlight_info=None, color_theme="#1a365d"):
    """
    生成統一的 HTML 郵件模板（臺東縣消防局標準格式）
    
    Args:
        title (str): 郵件標題，顯示在 Header 區域
        recipient_name (str): 收件人稱呼
        content_html (str): 主要內容 HTML
        highlight_info (str, optional): 醒目資訊（如驗證碼、單號），將以大字體置中顯示
        color_theme (str, optional): 主題色，預設為消防局深藍色
            - "#1a365d" (深藍/預設)
            - "#38a169" (綠色/成功)
            - "#e53e3e" (紅色/警告)
            - "#d97706" (黃色/注意)
    
    Returns:
        str: 完整的響應式 HTML 郵件字串
    """
    # 醒目資訊區塊（如驗證碼、單號）
    highlight_section = ""
    if highlight_info:
        highlight_section = f"""
        <div style="background-color: #f8f9fa; border-left: 5px solid {color_theme}; 
                    padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center;">
            <p style="font-family: 'Courier New', monospace; font-size: 32px; 
                      font-weight: bold; color: #2d3748; margin: 10px 0; 
                      letter-spacing: 4px; word-break: break-all;">
                {highlight_info}
            </p>
        </div>
        """
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0; padding:0; font-family: 'Microsoft JhengHei', 'PingFang TC', 'Apple LiGothic Medium', sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; 
                                                   border-radius: 8px; overflow: hidden; 
                                                   box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-collapse: collapse;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: {color_theme}; padding: 20px; text-align: center;">
                            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold;">
                                {title}
                            </h2>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px; color: #333333; line-height: 1.6;">
                            <p style="margin-top: 0;"><strong>{recipient_name}</strong> 您好：</p>
                            {content_html}
                            {highlight_section}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #edf2f7; padding: 20px; text-align: center; 
                                   font-size: 12px; color: #718096; line-height: 1.5;">
                            <p style="margin: 5px 0; font-weight: bold;">{cfg.CONFIG["email"]["signature_org"]}</p>
                            <p style="margin: 5px 0;">電話：{cfg.CONTACT_PHONE}</p>
                            <p style="margin: 10px 0 0 0; color: #e53e3e; font-weight: bold;">
                                {cfg.CONFIG["email"]["auto_reply_notice"]}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    return html

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

import shutil
import uuid

def get_default_tesseract_path():
    """自動偵測 Tesseract 執行檔路徑"""
    possible_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"D:\Program Files\Tesseract-OCR\tesseract.exe",
        r"E:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"D:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # 若都找不到，返回預設第一個路徑（即使不存在）
    return possible_paths[0] if possible_paths else ""

def get_default_excel_path():
    """回傳預設的系統列管 Excel 路徑"""
    return r"d:\下載\downloads\00. 列管場所資料.xls"

def render_equipment_diff(sys_set, ocr_set):
    """
    渲染消防設備比對結果（視覺化 Diff View）
    
    Args:
        sys_set: 系統列管設備集合
        ocr_set: 申報設備集合
    
    Returns:
        HTML 字串，包含顏色標記的比對結果
    """
    html = "<div style='line-height: 2.5;'>"
    
    # 1. 顯示系統有的 (漏報的標紅，吻合的標綠)
    html += "<strong>系統列管：</strong><br>"
    for item in sorted(sys_set):
        if item in ocr_set:
            # 吻合 (綠色底)
            html += f"<span style='background-color:#d1fae5; color:#065f46; padding:4px 8px; border-radius:4px; margin-right:5px; margin-bottom:5px; display:inline-block;'>✅ {item}</span>"
        else:
            # 漏報 (紅色底)
            html += f"<span style='background-color:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:4px; margin-right:5px; margin-bottom:5px; display:inline-block;'>❌ {item} (漏報)</span>"
    
    html += "<br><br><strong>申報資料：</strong><br>"
    for item in sorted(ocr_set):
        if item in sys_set:
            # 吻合 (綠色底)
            html += f"<span style='background-color:#d1fae5; color:#065f46; padding:4px 8px; border-radius:4px; margin-right:5px; margin-bottom:5px; display:inline-block;'>✅ {item}</span>"
        else:
            # 多報 (黃色底)
            html += f"<span style='background-color:#fef3c7; color:#92400e; padding:4px 8px; border-radius:4px; margin-right:5px; margin-bottom:5px; display:inline-block;'>⚠️ {item} (新增)</span>"
            
    html += "</div>"
    return html

@st.cache_data
def load_system_data(excel_path):
    """讀取系統列管資料 Excel (使用複製策略以避免檔案鎖定)"""
    if not os.path.exists(excel_path):
        return None
        
    temp_path = f"temp_system_data_{uuid.uuid4().hex[:8]}.xls"
    
    try:
        # 1. 複製檔案到暫存檔
        shutil.copy2(excel_path, temp_path)
        
        # 2. 讀取暫存檔
        if excel_path.endswith('.xls'):
            df = pd.read_excel(temp_path, header=1, engine='xlrd')
        else:
            df = pd.read_excel(temp_path, header=1)
            
        # 清理欄位名稱 (去除前後空白、換行符號)
        df.columns = df.columns.astype(str).str.strip().str.replace('\n', '').str.replace('\r', '')
        return df
        
    except Exception as e:
        st.error(f"讀取 Excel 失敗: {e}")
        return None
        
    finally:
        # 3. 刪除暫存檔
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass # 刪除失敗不影響流程

def pdf_to_images(pdf_file):
    """將 PDF 轉為圖片列表 (每一頁一張圖)"""
    # 如果是 bytes (從 DB 或 upload 讀取)，直接用
    # 如果是 file-like object，用 .read()
    if hasattr(pdf_file, 'read'):
        stream = pdf_file.read()
    else:
        stream = pdf_file # 假設已經是 bytes 或路徑
        
    # fitz.open 支援路徑或 stream
    if isinstance(stream, str):
        doc = fitz.open(stream)
    else:
        doc = fitz.open(stream=stream, filetype="pdf")
        
    images = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=300) # 高解析度以利 OCR
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
    return images

def perform_ocr(image, tesseract_cmd):
    """對圖片進行 OCR 辨識"""
    temp_img_path = os.path.join(os.getcwd(), "temp_ocr_image.png")
    try:
        image.save(temp_img_path)
        
        cmd = [
            tesseract_cmd,
            temp_img_path,
            "stdout",
            "-l", "chi_tra+eng",
            "--tessdata-dir", LOCAL_TESSDATA_DIR
        ]
        
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        
        process = subprocess.run(
            cmd,
            capture_output=True,
            startupinfo=startupinfo
        )
        
        stdout_data = process.stdout
        stderr_data = process.stderr
        
        if process.returncode != 0:
            try:
                err_msg = stderr_data.decode('utf-8')
            except:
                err_msg = stderr_data.decode('cp950', errors='ignore')
            return f"OCR Error (Code {process.returncode}): {err_msg}"

        try:
            text = stdout_data.decode('utf-8')
        except UnicodeDecodeError:
            text = stdout_data.decode('cp950', errors='ignore')
            
        return text

    except Exception as e:
        return f"Error: {e}"
    finally:
        if os.path.exists(temp_img_path):
            try:
                os.remove(temp_img_path)
            except:
                pass

def normalize_equipment_str(text):
    """將輸入的文字進行模糊比對，只保留標準設備清單中的項目"""
    if not text or not isinstance(text, str):
        return ""
    
    found_items = []
    clean_text = text.replace(" ", "").replace("　", "").replace("\n", "")
    
    for item in VALID_EQUIPMENT_LIST:
        if item in clean_text:
            found_items.append(item)
            
    return "、".join(found_items)

def extract_info_from_ocr(text, pages_text_list=None):
    """從 OCR 文字中提取關鍵資訊"""
    info = {}
    
    # --- 第一頁解析 (基本資料) ---
    if text:
        lines = text.split('\n')
        for line in lines:
            clean_line = line.replace(" ", "").replace("　", "").strip()
            if not clean_line: continue
            
            # 1. 管理權人
            if "管理權人" in clean_line:
                match = re.search(r"管理權人[:：|](.*)", clean_line)
                if match:
                    val = match.group(1)
                    if "通訊處" not in val:
                        info['管理權人'] = val
            
            # 備用：找 "姓名"
            if "姓名" in clean_line and "檢修人員" not in clean_line and "管理權人" not in info:
                 match = re.search(r"姓名[:：|](.*)", clean_line)
                 if match:
                     val = match.group(1)
                     if "身分證" in val:
                         val = val.split("身分證")[0]
                     info['管理權人'] = val
            
            # 2. 地址
            if "地址" in clean_line:
                 if "場所地址" in clean_line:
                     match = re.search(r"場所地址[:：|](.*)", clean_line)
                     if match:
                         info['場所地址'] = match.group(1)
                 elif "地址" in clean_line and '場所地址' not in info:
                     match = re.search(r"地址[:：|](.*)", clean_line)
                     if match:
                         info['場所地址'] = match.group(1)

            # 3. 電話
            if "電話" in clean_line:
                if '場所電話' not in info:
                    match = re.search(r"電話[:：|]([\d\-\(\)\s]+)", clean_line)
                    if match:
                        val = match.group(1).strip()
                        if any(char.isdigit() for char in val):
                            info['場所電話'] = val
                     
            # 4. 場所名稱
            if "場所名稱" in clean_line:
                match = re.search(r"場所名稱[:：|](.*)", clean_line)
                if match:
                    info['場所名稱'] = match.group(1)

            # 5. 消防設備種類 (第一頁備用)
            if not pages_text_list:
                if "申報項目" in clean_line or "檢修項目" in clean_line:
                     match = re.search(r"(申報項目|檢修項目)[:：|](.*)", clean_line)
                     if match:
                         info['消防設備種類'] = normalize_equipment_str(match.group(2))

    # --- 多頁解析 (尋找消防設備種類) ---
    if pages_text_list and isinstance(pages_text_list, list):
        target_page_text = None
        
        for page_text in pages_text_list:
            if "消防安全設備檢修申報書目錄" in page_text.replace(" ", ""):
                target_page_text = page_text
                break
        
        if not target_page_text and len(pages_text_list) > 1:
            target_page_text = pages_text_list[1]
            
        if target_page_text:
            clean_page_text = target_page_text.replace(" ", "").replace("　", "")
            if "消防安全設備檢查表" in clean_page_text:
                relevant_text = clean_page_text.split("消防安全設備檢查表", 1)[1]
                normalized_eq = normalize_equipment_str(relevant_text)
                if normalized_eq:
                    info['消防設備種類'] = normalized_eq
                 
    return info
