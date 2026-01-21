"""
插入 OCR 引擎選擇器到側邊欄
"""

def insert_ocr_selector():
    file_path = r"d:\下載\fire_dept_automation\pages\5_自動比對系統.py"

    # 讀取檔案
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 找到插入位置 (在 st.divider() 之後, 第456行)
    insert_pos = 456  # 第457行之前 (0-indexed: lines[456])

    # 檢查是否找到正確的位置
    if 'st.divider()' in lines[insert_pos-1]:
        print("✓ 找到插入位置")

        # 新增的程式碼
        new_code = [
            '        \r\n',
            '        # OCR 引擎選擇\r\n',
            '        st.markdown("#### 📝 OCR 辨識引擎")\r\n',
            '        ocr_engine = st.radio(\r\n',
            '            "選擇辨識引擎",\r\n',
            '            options=["Tesseract (傳統)", "PaddleOCR (高準確率)"],\r\n',
            '            index=0,\r\n',
            '            help="PaddleOCR 提供更高的繁體中文辨識準確率（+30%），但需要較多記憶體（4GB+）"\r\n',
            '        )\r\n',
            '        \r\n',
            '        use_paddle = (ocr_engine == "PaddleOCR (高準確率)")\r\n',
            '        \r\n',
            '        # 顯示引擎狀態\r\n',
            '        if use_paddle:\r\n',
            '            try:\r\n',
            '                import paddle_ocr\r\n',
            '                if paddle_ocr.is_paddle_available():\r\n',
            '                    info = paddle_ocr.get_paddle_info()\r\n',
            '                    st.success(f"✅ PaddleOCR {info.get(\'paddleocr_version\', \'\')} 可用")\r\n',
            '                else:\r\n',
            '                    st.warning("⚠️ PaddleOCR 未安裝，將使用 Tesseract")\r\n',
            '                    st.caption("執行安裝: `python setup_paddle.py`")\r\n',
            '                    use_paddle = False\r\n',
            '            except Exception as e:\r\n',
            '                st.error(f"❌ PaddleOCR 載入失敗: {e}")\r\n',
            '                use_paddle = False\r\n',
            '        else:\r\n',
            '            st.info("ℹ️ 使用 Tesseract OCR")\r\n',
            '        \r\n',
            '        st.divider()\r\n',
        ]

        # 插入程式碼
        lines[insert_pos:insert_pos] = new_code

        # 寫回檔案
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        print("\n✅ 成功插入 OCR 引擎選擇器！")
        print(f"\n插入位置: 第 {insert_pos + 1} 行")
        print("新增內容: OCR 引擎選擇器 (30 行)")
        return True
    else:
        print("❌ 找不到插入位置")
        print(f"\n實際內容 (第{insert_pos}行): {lines[insert_pos-1].strip()}")
        return False

if __name__ == "__main__":
    try:
        insert_ocr_selector()
    except Exception as e:
        print(f"\n❌ 處理失敗: {e}")
        import traceback
        traceback.print_exc()
