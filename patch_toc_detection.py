"""
自動修補 extract_info_from_ocr 函數的腳本
添加動態目錄頁偵測功能
"""

def patch_file():
    file_path = r"d:\下載\fire_dept_automation\pages\5_自動比對系統.py"
    
    # 讀取檔案
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 定義要替換的舊程式碼片段
    old_code = '''    # --- 多頁解析 (尋找消防設備種類) ---
    if pages_text_list and isinstance(pages_text_list, list):
        target_page_text = None
        
        # 1. 優先尋找包含 "消防安全設備檢修申報書目錄" 的頁面
        for page_text in pages_text_list:
            if "消防安全設備檢修申報書目錄" in page_text.replace(" ", ""):
                target_page_text = page_text
                break
        
        # 2. 如果找不到，回退使用第二頁 (Index 1)
        if not target_page_text and len(pages_text_list) > 1:
            target_page_text = pages_text_list[1]'''
    
    # 定義新的程式碼片段
    new_code = '''    # --- 多頁解析 (尋找消防設備種類) ---
    if pages_text_list and isinstance(pages_text_list, list):
        target_page_text = None
        
        # 1. 優先尋找以「目錄」開頭的頁面（動態偵測，不固定第2頁）
        for page_text in pages_text_list:
            clean_text = page_text.replace(" ", "").replace("　", "").strip()
            # 檢查頁面開頭是否有「目錄」兩個字
            if clean_text.startswith("目錄"):
               target_page_text = page_text
                break
        
        # 2. 如果找不到開頭有「目錄」的頁面，搜尋包含「消防安全設備檢修申報書目錄」的頁面
        if not target_page_text:
            for page_text in pages_text_list:
                if "消防安全設備檢修申報書目錄" in page_text.replace(" ", ""):
                    target_page_text = page_text
                    break
        
        # 3. 如果還是找不到，搜尋任何包含「目錄」的頁面
        if not target_page_text:
            for page_text in pages_text_list:
                if "目錄" in page_text.replace(" ", ""):
                    target_page_text = page_text
                    break
        
        # 4. 最後回退：使用第二頁 (Index 1)
        if not target_page_text and len(pages_text_list) > 1:
            target_page_text = pages_text_list[1]'''
    
    # 檢查舊程式碼是否存在
    if old_code in content:
        # 進行替換
        new_content = content.replace(old_code, new_code)
        
        # 寫回檔案
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("✅ 成功更新檔案！")
        print("\n已添加動態目錄頁偵測功能：")
        print("  1. 優先搜尋以「目錄」開頭的頁面")
        print("  2. 次優先搜尋包含「消防安全設備檢修申報書目錄」的頁面")
        print("  3. 第三順位搜尋任何包含「目錄」的頁面")
        print("  4. 最後回退使用第2頁")
        return True
    else:
        print("❌ 找不到要替換的程式碼片段")
        print("\n可能原因：")
        print("  1. 檔案已經被修改過")
        print("  2. 檔案內容格式不符")
        return False

if __name__ == "__main__":
    try:
        patch_file()
    except Exception as e:
        print(f"\n❌ 處理失敗: {e}")
        import traceback
        traceback.print_exc()
