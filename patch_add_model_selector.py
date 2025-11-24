"""
添加 AI 模型選擇器到側邊欄
"""

def add_model_selector():
    file_path = r"d:\下載\fire_dept_automation\pages\5_自動比對系統.py"
    
    # 讀取檔案
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 找到插入位置（在 use_vision_ai checkbox 之後，第523行之後）
    insert_pos = 523  # 第524行之前 (0-indexed: lines[523])
    
    # 檢查是否找到正確的位置
    if 'use_vision_ai = st.checkbox' in lines[insert_pos-1]:
        print("✓ 找到插入位置")
        
        # 新增的程式碼
        new_code = [
            '        \r\n',
            '        # AI 模型選擇器\r\n',
            '        if use_ai_mode or use_vision_ai:\r\n',
            '            st.markdown("##### 模型選擇")\r\n',
            '            \r\n',
            '            # 文字 LLM 模型選擇\r\n',
            '            if use_ai_mode:\r\n',
            '                text_model = st.selectbox(\r\n',
            '                    "文字分析模型",\r\n',
            '                    options=["llama3", "gemma3:4b"],\r\n',
            '                    index=0,\r\n',
            '                    help="選擇用於文字分析的 LLM 模型"\r\n',
            '                )\r\n',
            '            else:\r\n',
            '                text_model = "llama3"  # 預設值\r\n',
            '            \r\n',
            '            # Vision AI 模型選擇\r\n',
            '            if use_vision_ai:\r\n',
            '                vision_model = st.selectbox(\r\n',
            '                    "視覺分析模型",\r\n',
            '                    options=["llama3.2-vision", "minicpm-v", "qwen2.5vl:7b"],\r\n',
            '                    index=0,\r\n',
            '                    help="選擇用於視覺分析的 Vision AI 模型"\r\n',
            '                )\r\n',
            '            else:\r\n',
            '                vision_model = "llama3.2-vision"  # 預設值\r\n',
            '        else:\r\n',
            '            text_model = "llama3"\r\n',
            '            vision_model = "llama3.2-vision"\r\n',
            '        \r\n',
        ]
        
        # 插入程式碼
        lines[insert_pos:insert_pos] = new_code
        
        # 寫回檔案
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print("\n✅ 成功添加 AI 模型選擇器！")
        print(f"\n插入位置: 第 {insert_pos + 1} 行")
        print("新增內容: AI 模型選擇下拉選單 (30 行)")
        return True
    else:
        print("❌ 找不到插入位置")
        print(f"\n實際內容 (第{insert_pos}行): {lines[insert_pos-1].strip()}")
        return False

if __name__ == "__main__":
    try:
        add_model_selector()
    except Exception as e:
        print(f"\n❌ 處理失敗: {e}")
        import traceback
        traceback.print_exc()
