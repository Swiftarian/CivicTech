import re
from PIL import Image, ImageOps
import pytesseract

# ==========================================
# 1. 頁面識別邏輯
# ==========================================

def identify_page_type(header_text):
    """
    根據頁面前 30 個字識別文件類型
    """
    if not header_text:
        return "未知頁面"
    
    text = header_text.replace(" ", "").replace("\n", "")
    
    # 關鍵字對應表
    keywords = {
        "目錄": "目錄",
        "檢修申報表": "消防安全設備檢修申報表",
        "檢修報告書": "消防安全設備檢修報告書",
        "改善計畫書": "消防安全設備改善計畫書",
        "種類及數量表": "消防安全設備種類及數量表",
        "滅火器": "滅火器檢查表",
        "室內消防栓": "室內消防栓設備檢查表",
        "自動撒水": "自動撒水設備檢查表",
        "泡沫": "泡沫滅火設備檢查表",
        "火警自動警報": "火警自動警報設備檢查表",
        "緊急廣播": "緊急廣播設備檢查表",
        "標示設備": "標示設備檢查表",
        "避難設備": "避難設備檢查表",
        "緊急照明": "緊急照明設備檢查表",
        "連結送水管": "連結送水管檢查表",
        "排煙": "排煙設備檢查表",
        "無線電": "無線電通信輔助設備檢查表",
        "使用執照": "建築物使用執照影本",
        "營利事業": "營利事業登記證影本",
        "開業證書": "專業機構合格證書影本",
        "設備師": "消防設備師(士)證書影本",
        "身分證": "管理權人身分證影本"
    }
    
    for key, value in keywords.items():
        if key in text:
            return value
            
    return "其他文件"

# ==========================================
# 2. Checkbox 檢測邏輯 (Pixel Analysis)
# ==========================================

def detect_checkbox_state(image, text_box):
    """
    分析文字左側區域的像素密度來判斷是否打勾
    
    Args:
        image: 原始圖片 (PIL Image)
        text_box: 文字區域 (left, top, width, height)
    
    Returns:
        bool: True (有打勾), False (未打勾)
    """
    left, top, width, height = text_box
    
    # 定義檢查區域：文字左側
    # 假設 checkbox 在文字左邊約 20-50 pixels 處，大小約 20x20
    # 這裡需要根據實際圖片解析度調整
    
    # 寬鬆設定：往左抓 50px，高度與文字相同
    check_region_width = 50 
    check_region_left = max(0, left - check_region_width)
    
    # 裁切出檢查區域
    region = image.crop((check_region_left, top, left, top + height))
    
    # 轉為灰階並二值化
    gray = region.convert('L')
    # 簡單二值化：低於 128 視為黑色 (筆跡)
    bw = gray.point(lambda x: 0 if x < 150 else 255, '1')
    
    # 計算黑色像素比例
    # Checkbox 區域應該會有方框線條 + 打勾線條
    # 空白區域則是全白
    
    # 取得像素數據
    pixels = list(bw.getdata())
    total_pixels = len(pixels)
    black_pixels = pixels.count(0)
    
    if total_pixels == 0: return False
    
    density = black_pixels / total_pixels
    
    # 閾值判斷
    # 如果是單純方框 (□)，密度較低
    # 如果是打勾方框 (☑)，密度較高
    # 這裡可能需要實驗調整閾值。
    # 假設方框佔 10%，打勾可能佔 20% 以上
    
    # 為了更準確，我們假設 "有墨水" 就是有東西。
    # 但要區分 "空框" 和 "打勾框" 比較難單純用密度。
    # 替代方案：OCR 雖然不準，但可以輔助。
    # 或者：我們只判斷 "是否有足夠的黑色像素" 代表有檢核項目。
    # 根據使用者需求 "方框內有打勾的就是有檢複"，
    # 我們假設 "打勾" 會顯著增加黑色像素。
    
    return density > 0.15  # 暫定閾值 15%

# ==========================================
# 3. TOC 解析邏輯
# ==========================================

def parse_toc_requirements(toc_image, toc_text):
    """
    解析目錄頁，找出被打勾的項目
    """
    required_docs = []
    
    # 使用 pytesseract 取得詳細資料 (包含座標)
    # pytesseract.image_to_data 回傳 dict
    data = pytesseract.image_to_data(toc_image, lang='chi_tra', output_type=pytesseract.Output.DICT)
    
    n_boxes = len(data['text'])
    
    # 欲搜尋的關鍵字清單 (對應標準文件名稱)
    target_docs = [
        "消防安全設備檢修申報表", "消防安全設備檢修報告書", "消防安全設備改善計畫書", "消防安全設備種類及數量表",
        "滅火器檢查表", "室內消防栓設備檢查表", "自動撒水設備檢查表", "泡沫滅火設備檢查表", 
        "火警自動警報設備檢查表", "緊急廣播設備檢查表", "標示設備檢查表", "避難設備檢查表",
        "緊急照明設備檢查表", "連結送水管檢查表", "排煙設備檢查表", "無線電通信輔助設備檢查表",
        "建築物使用執照影本", "營利事業登記證影本", "專業機構合格證書影本", 
        "消防設備師(士)證書影本", "管理權人身分證影本"
    ]
    
    # 簡單演算法：
    # 1. 遍歷 OCR 結果，找到包含關鍵字的行
    # 2. 取得該行的 bounding box
    # 3. 呼叫 detect_checkbox_state 判斷左側是否打勾
    
    # 為了避免重複處理同一行 (因為 image_to_data 是每個字分開的)，我們需要分組
    # 這裡簡化處理：如果偵測到關鍵字，就檢查該字左側
    # 但這樣不準，因為 checkbox 在整行文字的最左邊。
    
    # 改進：先將文字重組為行，並計算整行的 bbox
    lines = {} # block_num + par_num + line_num -> {text: [], left: min, top: min, width: sum, height: max}
    
    for i in range(n_boxes):
        if int(data['conf'][i]) > 0: # 過濾掉信心度過低的
            key = (data['block_num'][i], data['par_num'][i], data['line_num'][i])
            if key not in lines:
                lines[key] = {
                    'text': [], 
                    'left': data['left'][i], 
                    'top': data['top'][i], 
                    'right': data['left'][i] + data['width'][i],
                    'bottom': data['top'][i] + data['height'][i]
                }
            else:
                l = lines[key]
                l['text'].append(data['text'][i])
                l['left'] = min(l['left'], data['left'][i])
                l['top'] = min(l['top'], data['top'][i])
                l['right'] = max(l['right'], data['left'][i] + data['width'][i])
                l['bottom'] = max(l['bottom'], data['top'][i] + data['height'][i])
    
    # 分析每一行
    for key, line_data in lines.items():
        line_text = "".join(line_data['text'])
        
        # 比對關鍵字
        matched_doc = None
        for doc in target_docs:
            # 模糊比對：只要包含部分關鍵字
            # 例如 "滅火器檢查表" 可能 OCR 成 "滅火器檢表"
            # 取核心關鍵字
            core_key = doc[:4] # 取前4字
            if core_key in line_text:
                matched_doc = doc
                break
        
        if matched_doc:
            # 檢查 Checkbox
            bbox = (line_data['left'], line_data['top'], line_data['right'] - line_data['left'], line_data['bottom'] - line_data['top'])
            is_checked = detect_checkbox_state(toc_image, bbox)
            
            if is_checked:
                required_docs.append(matched_doc)
                
    return required_docs

