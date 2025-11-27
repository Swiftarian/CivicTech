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
        # 強制結構化輸出的 prompt
        prompt = """這是一張檢修項目清單。請仔細觀察每一項前面的方框 (□)。

請列出所有【方框內有打勾 (✓, v)】、【被塗黑】或【有任何手寫標記】的項目名稱。

規則：
1. 只要方框內不是空白的，就視為已勾選。
2. 如果方框被塗滿黑色，視為已勾選。
3. 如果方框內有打勾或打叉，視為已勾選。
4. 忽略完全空白的方框。

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
                import os
                import tempfile
                temp_dir = tempfile.gettempdir()
                temp_path = os.path.join(temp_dir, f"temp_page_{page_num}.png")
                img.save(temp_path)
                doc_type = classify_page_with_vision(temp_path, model)
                try:
                    os.remove(temp_path)
                except:
                    pass  # 忽略刪除錯誤
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
                    import os
                    import tempfile
                    temp_dir = tempfile.gettempdir()
                    temp_path = os.path.join(temp_dir, "temp_toc.png")
                    img.save(temp_path)
                    required_items = extract_checked_items_with_vision(temp_path, model)
                    try:
                        os.remove(temp_path)
                    except:
                        pass
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

    prompt = f"""你是一個專業的消防安全檢查員。請從以下 OCR 文字中提取關鍵資訊。
    
    OCR 文字:
    ----------------
    {text_content}
    ----------------
    
    📌 **核心規則（最高優先級 - 必須嚴格遵守）**：
    
    ⚠️ **勾選符號識別規則（這是最重要的規則！）**：
    1. 在目錄頁（「消防安全設備檢修申報書目錄」）中，每個設備前面都有方框
    2. **主要判斷依據：方框內有打勾（✓、☑、√、✔、■、●）的項目**
    3. **💡 上下文推斷 (Context Inference) - 容錯機制**：
       - 如果 OCR 沒有辨識出方框或勾選符號，但該項目後面**有填寫數量、頁碼或備註** (例如 "滅火器.....7" 或 "避難器具...3具")，**請視為已勾選**。
       - 這是因為 OCR 常會漏掉方框，但後面的數字通常代表該設備有實際檢修。
    
    ✅ **正確範例**（應該提取）：
    - "☑ 滅火器" → 提取 "滅火器" (有勾選)
    - "✓ 火警自動警報設備" → 提取 "火警自動警報設備" (有勾選)
    - "滅火器 .......... 3" → 提取 "滅火器" (雖無勾選，但有頁碼/數量)
    - "避難器具 5 具" → 提取 "避難器具" (雖無勾選，但有數量)
    
    ❌ **錯誤範例**（絕對不要提取）：
    - "☐ 室外消防栓設備" → **不提取**（明確的空白方框）
    - "□ 排煙設備" → **不提取**（明確的空白方框）
    - "連結送水管" → **不提取**（無勾選，且後面無任何數字或內容）
    
    💡 **實際案例**：
    如果 OCR 文字顯示：
    ```
    ☑ 滅火器 _____ 3
    ☐ 室外消防栓設備 _____ 4
    火警自動警報設備 ..... 7  <-- (OCR 漏了勾勾，但有頁碼 7)
    □ 排煙設備 _____ 17
    ```
    正確的 equipment_list 應該是：["滅火器", "火警自動警報設備"]
    (室外消防栓和排煙設備明確未勾選，所以不提取)
    
    ---
    
    請提取以下欄位並以 JSON 格式回傳。
    
    ⚠️ **其他重要規則**：
    0. **強制使用繁體中文**：所有輸出必須使用台灣繁體中文，嚴禁使用簡體字（例如：「台東」而非「台东」、「綱」而非「纲」）。
    1. **去除所有空格**：所有輸出的值都必須去除所有空格 (例如 "鳳 仙" -> "鳳仙")。
    2. **單一字串**：地址和管理權人必須是單一字串，嚴禁使用巢狀 JSON (例如不要回傳 {{'city': ...}})。
    3. **OCR 容錯**：OCR 可能有錯字、缺字、多字或空格問題，請使用模糊比對，相似度 80% 以上即可接受。
    
    欄位說明：
    1. document_type: 文件類型
    2. place_name: 場所名稱 (去除空格)
    3. address: 地址 (完整地址字串，去除空格)
    4. management_person: 管理權人 (姓名字串，去除空格)
    5. equipment_list: 消防設備列表 (Array，每個項目也要去除空格)

    📋 **標準設備清單** (請優先從以下清單中比對，使用模糊比對):
    - 滅火器
    - 室內消防栓設備
    - 室外消防栓設備
    - 自動撒水設備
    - 水霧滅火設備
    - 泡沫滅火設備
    - 二氧化碳滅火設備
    - 乾粉滅火設備
    - 海龍滅火設備(含海龍替代品)
    - 火警自動警報設備
    - 瓦斯漏氣火警自動警報設備
    - 緊急廣播設備
    - 標示設備
    - 避難器具
    - 緊急照明設備
    - 連結送水管
    - 消防專用蓄水池
    - 排煙設備
    - 無線電通信輔助設備
    
    🔍 **模糊比對規則**：
    - OCR 可能將「內」識別為「内」、「栓」識別為「拴」
    - 可能有多餘空格：「室 內 消 防 栓」-> 「室內消防栓設備」
    - 可能缺少「設備」二字：「室內消防栓」-> 「室內消防栓設備」
    - 簡體轉繁體：「灭火器」-> 「滅火器」
    - 全形轉半形：「(含海龍替代品)」-> 「(含海龍替代品)」
    
    OCR 輸入: "室 内 消 防 拴"
    正確輸出: "室內消防栓設備"
    
    OCR 輸入: "火警自動警報"
    正確輸出: "火警自動警報設備"

    如果找不到欄位，請填 null。只回傳 JSON，不要有其他文字。
    """
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            response_text = result['response']
            
            if not response_text or not response_text.strip():
                return {"error": "AI returned empty response"}

            # Debug: Print raw response
            print(f"🤖 AI Raw Response: {response_text}")

            # 嘗試使用 Regex 提取 JSON (處理 Markdown 標記)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            
            try:
                if json_match:
                    return json.loads(json_match.group(0))
                else:
                    # 如果 Regex 失敗，檢查是否像 JSON
                    clean_text = response_text.strip()
                    if not clean_text.startswith("{"):
                        return {"error": "No JSON object found in AI response", "raw_response": response_text}
                    return json.loads(clean_text)
            except json.JSONDecodeError as je:
                # JSON 解析失敗，回傳原始文字供除錯
                # 嘗試修復常見的 JSON 錯誤 (例如單引號)
                try:
                    import ast
                    return ast.literal_eval(response_text)
                except:
                    pass
                return {"error": f"JSON Parse Error: {je}", "raw_response": response_text}
                
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
    # 優化：同時分析第一頁(基本資料)和目錄頁(設備清單)
    if pages_text:
        combined_text = pages_text[0] # 預設包含第一頁
        
        # 尋找目錄頁 (關鍵字: 目錄, 附表, 檢查表)
        toc_keywords = ["目錄", "附表", "檢查表"]
        toc_text = ""
        
        # 從第二頁開始找 (index 1)
        if len(pages_text) > 1:
            for i in range(1, len(pages_text)):
                page_content = pages_text[i]
                # 簡單判斷
                if any(kw in page_content for kw in toc_keywords):
                    toc_text = page_content
                    break
            
            # 如果沒找到明確的目錄頁，但有第二頁，就預設抓第二頁 (通常目錄在第二頁)
            if not toc_text and len(pages_text) > 1:
                toc_text = pages_text[1]
        
        if toc_text:
            combined_text += "\n\n--- (以下為目錄頁內容) ---\n\n" + toc_text
            
        return analyze_page_with_ai(combined_text, model)
    return {}
