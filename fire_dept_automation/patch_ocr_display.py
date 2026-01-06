"""
修補 OCR 文字預覽顯示
讓每一頁都顯示前30個字和完整內容
"""

def patch_ocr_display():
    file_path = r"d:\下載\fire_dept_automation\pages\5_自動比對系統.py"
    
    # 讀取檔案
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 找到要替換的行（667-670）
    # 注意：Python list是0-indexed，所以667行是lines[666]
    target_start = 666  # 第667行 (0-indexed)
    target_end = 670    # 第670行 (0-indexed, exclusive end)
    
    # 檢查是否找到正確的位置
    if 'with st.expander(f"第 {i+1} 頁 OCR 文字內容 (除錯用)"' in lines[target_start]:
        print("✓ 找到目標位置")
        
        # 新的程式碼（保持相同的縮排）
        new_code = [
            '                with st.expander(f"第 {i+1} 頁 OCR 文字內容 (除錯用)", expanded=False):\r\n',
            '                    # 顯示每一頁的前30個字和完整內容\r\n',
            '                    if i < len(pages_text):\r\n',
            '                        page_text = pages_text[i]\r\n',
            '                        preview_text = page_text[:30] if len(page_text) > 30 else page_text\r\n',
            '                        st.text(f"前30字: {preview_text}")\r\n',
            '                        st.text(f"\\n完整內容:\\n{page_text}")\r\n',
            '                    else:\r\n',
            '                        st.text("(無法取得此頁內容)")\r\n'
        ]
        
        # 替換這4行
        lines[target_start:target_end] = new_code
        
        # 寫回檔案
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print("\n✅ 成功更新 OCR 文字預覽顯示！")
        print("\n修改內容：")
        print("  - 移除了只顯示第1、2頁的限制")
        print("  - 每一頁都會顯示前30個字的預覽")
        print("  - 每一頁都會顯示完整的 OCR 內容")
        print("\n請重新整理網頁（F5）查看效果！")
        return True
    else:
        print("❌ 找不到目標位置，檔案可能已經被修改")
        print(f"\n實際內容: {lines[target_start].strip()}")
        return False

if __name__ == "__main__":
    try:
        patch_ocr_display()
    except Exception as e:
        print(f"\n❌ 處理失敗: {e}")
        import traceback
        traceback.print_exc()
