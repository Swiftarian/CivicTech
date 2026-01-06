"""
修改 OCR 執行邏輯以支援 PaddleOCR
"""

def modify_ocr_execution():
    file_path = r"d:\下載\fire_dept_automation\pages\5_自動比對系統.py"
    
    # 讀取檔案
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 找到要替換的行 (第623行: ocr_text = perform_ocr(img, tesseract_path))
    target_line = 622  # 0-indexed
    
    # 檢查是否找到正確的位置
    if 'ocr_text = perform_ocr(img, tesseract_path)' in lines[target_line]:
        print("✓ 找到 OCR 執行位置")
        
        # 新的程式碼 (使用條件判斷選擇引擎)
        new_code = [
            '                            # 執行 OCR (根據選定的引擎)\r\n',
            '                            if use_paddle:\r\n',
            '                                try:\r\n',
            '                                    import paddle_ocr\r\n',
            '                                    ocr_text = paddle_ocr.perform_paddle_ocr(img)\r\n',
            '                                except Exception as e:\r\n',
            '                                    st.warning(f"PaddleOCR 執行失敗，切換至 Tesseract: {e}")\r\n',
            '                                    ocr_text = perform_ocr(img, tesseract_path)\r\n',
            '                            else:\r\n',
            '                                ocr_text = perform_ocr(img, tesseract_path)\r\n',
        ]
        
        # 替換這一行
        lines[target_line:target_line+1] = new_code
        
        # 寫回檔案
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print("\n✅ 成功修改 OCR 執行邏輯！")
        print("\n修改內容:")
        print("  - 添加引擎選擇邏輯")
        print("  - PaddleOCR 優先（如果選用）")
        print("  - 失敗時自動回退至 Tesseract")
        return True
    else:
        print("❌ 找不到目標位置")
        print(f"\n實際內容 (第{target_line+1}行): {lines[target_line].strip()}")
        return False

if __name__ == "__main__":
    try:
        modify_ocr_execution()
    except Exception as e:
        print(f"\n❌ 處理失敗: {e}")
        import traceback
        traceback.print_exc()
