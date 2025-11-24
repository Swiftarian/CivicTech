import requests
import json
import re
import base64
import pandas as pd
from pathlib import Path

# Ollama API 設定
OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate"
DEFAULT_TEXT_MODEL = "llama3"
DEFAULT_VISION_MODEL = "llama3.2-vision"

def is_ollama_available():
    """檢查 Ollama 服務是否運作中"""
    try:
        response = requests.get("http://localhost:11434/", timeout=2)
        return response.status_code == 200
    except:
        return False

def check_vision_model_available(model_name=DEFAULT_VISION_MODEL):
    """檢查指定的 Vision 模型是否可用"""
    if not is_ollama_available():
        return False
    
    try:
        # 嘗試列出可用模型
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            return any(model_name in m['name'] for m in models)
        return False
    except:
        return False

def image_to_base64(image_path):
    """將圖片檔案轉換為 base64 編碼"""
    with open(image_path, 'rb') as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

def classify_page_with_vision(image_path, model=DEFAULT_VISION_MODEL):
    """
    使用 Vision AI 辨識頁面類型
    
    Args:
        image_path (str): 圖片檔案路徑
        model (str): Vision 模型名稱
        
    Returns:
        str: 文件類型 (例如: "檢修申報書", "檢修目錄", "未知頁面")
    """
    try:
        # 將圖片轉為 base64
        img_base64 = image_to_base64(image_path)
        
        # 構建 prompt
        prompt = """這是一份消防申報文件的掃描圖。請辨識這頁最上方的標題（通常在前 30% 區域），判斷這是什麼文件？

請只回傳文件名稱（例如：'檢修申報書'、'檢修目錄'、'平面圖'、'滅火器檢查表'、'消防栓檢查表'），不要回傳其他說明文字。

如果無法確定，請回傳 '未知頁面'。"""
        
        # 呼叫 Ollama Chat API (支援 vision)
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                    "images": [img_base64]
                }
            ],
            "stream": False
        }
        
        response = requests.post(OLLAMA_CHAT_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            doc_type = result['message']['content'].strip()
            # 移除可能的引號
            doc_type = doc_type.strip('"\'')
            return doc_type
        else:
            return "未知頁面"
            
    except Exception as e:
        print(f"Vision AI 辨識失敗: {e}")
        return "未知頁面"

def extract_checked_items_with_vision(image_path, model=DEFAULT_VISION_MODEL):
    """
    使用 Vision AI 偵測目錄頁的勾選項目
    
    Args:
        image_path (str): 目錄頁圖片路徑
        model (str): Vision 模型名稱
        
    Returns:
        list: 已勾選的項目列表
    """
    try:
        img_base64 = image_to_base64(image_path)
        
        # 強制結構化輸出的 prompt
        prompt = """這是一張檢修項目清單。請仔細觀察每一項前面的方框 (□)。

列出所有【方框內有打勾 (✓, v)】或【被塗黑】的項目名稱。

IMPORTANT: Do NOT output any markdown, explanations, or code blocks. Only output a valid JSON array of strings.

Example: ["滅火器", "避難器具", "火警自動警報設備"]

如果沒有任何項目被勾選，請回傳空陣列: []"""
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                    "images": [img_base64]
                }
            ],
            "stream": False
        }
        
        response = requests.post(OLLAMA_CHAT_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            content = result['message']['content'].strip()
            
            # 使用 Regex 提取 JSON 陣列（防止模型輸出多餘文字）
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                checked_items = json.loads(json_str)
                return checked_items
            else:
                # 如果找不到 JSON，回傳空列表
                print(f"無法從回應中提取 JSON: {content}")
                return []
        else:
            return []
            
    except Exception as e:
        print(f"勾選項目提取失敗: {e}")
        return []

def analyze_document_structure(pdf_images_or_path, model=DEFAULT_VISION_MODEL):
    """
    完整的文件結構分析 (4-step 流程)
    
    Args:
        pdf_images_or_path: 可以是以下之一:
            - list of PIL Images
            - list of image file paths
            - PDF file path (會自動轉換為圖片)
        model (str): Vision 模型名稱
        
    Returns:
        dict: {
            'page_map': {頁碼: 文件類型},
            'toc_page': 目錄頁碼 (or None),
            'required_items': [已勾選項目列表],
            'validation_report': pd.DataFrame,
            'error': error message (if any)
        }
    """
    # 環境檢查
    if not is_ollama_available():
        raise RuntimeError("Ollama 服務未啟動，請先執行 'ollama serve' 或啟動 Ollama Desktop")
    
    if not check_vision_model_available(model):
        raise RuntimeError(f"Vision 模型 '{model}' 未安裝，請執行: ollama pull {model}")
    
    # 處理輸入 (如果是 PDF 路徑，需要轉換為圖片)
    # 這裡假設已經由調用方轉換好（因為主程式已有轉換邏輯）
    if isinstance(pdf_images_or_path, (str, Path)):
        # 如果傳入的是 PDF path，這裡可以添加 pdf2image 轉換邏輯
        # 但為了簡化，我們假設主程式已處理好圖片列表
        raise NotImplementedError("請先將 PDF 轉為圖片列表再傳入")
    
    images = pdf_images_or_path
    
    # 結果容器
    result = {
        'page_map': {},
        'toc_page': None,
        'required_items': [],
        'validation_report': None,
        'error': None
    }
    
    try:
        # Step 1: 頁面識別 (Page Classification)
        print("🔍 Step 1: 正在進行頁面識別...")
        for i, img in enumerate(images):
            page_num = i + 1
            
            # 如果是 PIL Image，需要先儲存為臨時檔案
            if hasattr(img, 'save'):
                temp_path = f"temp_page_{page_num}.png"
                img.save(temp_path)
                doc_type = classify_page_with_vision(temp_path, model)
                import os
                os.remove(temp_path)
            else:
                # 假設是檔案路徑
                doc_type = classify_page_with_vision(img, model)
            
            result['page_map'][page_num] = doc_type
            print(f"  第 {page_num} 頁: {doc_type}")
        
        # Step 2: 偵測「檢修目錄」與勾選項目
        print("\n📋 Step 2: 正在尋找目錄頁並提取勾選項目...")
        
        # 尋找目錄頁
        toc_keywords = ['目錄', '檢修項目', '申報項目', '清單']
        for page_num, doc_type in result['page_map'].items():
            if any(keyword in doc_type for keyword in toc_keywords):
                result['toc_page'] = page_num
                print(f"  ✅ 找到目錄頁: 第 {page_num} 頁")
                
                # 提取勾選項目
                img = images[page_num - 1]
                if hasattr(img, 'save'):
                    temp_path = f"temp_toc.png"
                    img.save(temp_path)
                    required_items = extract_checked_items_with_vision(temp_path, model)
                    import os
                    os.remove(temp_path)
                else:
                    required_items = extract_checked_items_with_vision(img, model)
                
                result['required_items'] = required_items
                print(f"  找到 {len(required_items)} 個勾選項目: {required_items}")
                break
        
        if not result['toc_page']:
            print("  ⚠️ 未找到目錄頁")
        
        # Step 3 & 4: 交叉比對 & 生成報告
        print("\n✅ Step 3 & 4: 正在進行交叉比對並生成報告...")
        
        report_data = []
        for item in result['required_items']:
            # 判定規則: 在 page_map 中尋找包含該項目名稱的頁面
            found_pages = []
            for page_num, doc_type in result['page_map'].items():
                # 模糊匹配 (例如 "滅火器" 應該匹配 "滅火器檢查表")
                if item in doc_type or doc_type in item:
                    found_pages.append(page_num)
            
            status = "✅ 合規" if found_pages else "❌ 缺件"
            page_list = ", ".join([f"第{p}頁" for p in found_pages]) if found_pages else "-"
            
            report_data.append({
                '應檢附項目': item,
                '是否勾選': '✓',
                '實際頁數': page_list,
                '狀態': status
            })
        
        result['validation_report'] = pd.DataFrame(report_data)
        
        print("  ✅ 報告生成完成")
        return result
        
    except Exception as e:
        result['error'] = str(e)
        print(f"❌ 分析過程發生錯誤: {e}")
        return result

# === 舊版文字分析函式 (保留向後兼容) ===
def analyze_page_with_ai(text_content, model=DEFAULT_TEXT_MODEL):
    """
    使用 AI 分析單頁內容 (基於文字的 OCR 結果)
    
    Args:
        text_content (str): OCR 辨識出的文字
        model (str): 使用的模型名稱
        
    Returns:
        dict: AI 分析結果
    """
    if not text_content.strip():
        return {"error": "No text content"}

    prompt = f"""你是一個專業的消防安全檢查員。請分析以下文件內容，並提取關鍵資訊。
    
    文件內容:
    {text_content}
    
    請以 JSON 格式回傳以下欄位 (如果找不到請填 null):
    - document_type: 文件類型 (例如: 檢修申報表, 檢查表, 證書)
    - place_name: 場所名稱
    - address: 地址
    - management_person: 管理權人
    - equipment_list: 提到的消防設備列表 (Array)
    
    只回傳 JSON，不要有其他廢話。
    """
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    try:
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return json.loads(result['response'])
        else:
            return {"error": f"API Error: {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def analyze_document(pages_text, model=DEFAULT_TEXT_MODEL):
    """
    分析整份文件 (多頁) - 基於 OCR 文字
    
    Args:
        pages_text (list): 每一頁的 OCR 文字列表
        
    Returns:
        dict: 整合後的分析結果
    """
    if not is_ollama_available():
        return {"error": "Ollama service not available"}
        
    # 這裡可以實作更複雜的邏輯，例如只分析第一頁，或是彙整所有頁面
    # 目前先示範分析第一頁
    if pages_text:
        return analyze_page_with_ai(pages_text[0], model)
    return {}
