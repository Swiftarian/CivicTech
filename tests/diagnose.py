"""
診斷腳本：測試 Streamlit AppTest 基本功能
"""

print("=" * 50)
print("診斷測試 1: 檢查 Streamlit 版本")
print("=" * 50)

try:
    import streamlit as st
    print(f"✅ Streamlit 已安裝，版本: {st.__version__}")
except ImportError as e:
    print(f"❌ Streamlit 未安裝: {e}")
    exit(1)

print("\n" + "=" * 50)
print("診斷測試 2: 檢查 AppTest 是否可用")
print("=" * 50)

try:
    from streamlit.testing.v1 import AppTest
    print("✅ AppTest 已成功導入")
except ImportError as e:
    print(f"❌ AppTest 導入失敗: {e}")
    print("提示: AppTest 需要 Streamlit >= 1.28.0")
    exit(1)

print("\n" + "=" * 50)
print("診斷測試 3: 測試最簡單的頁面載入")
print("=" * 50)

try:
    # 創建一個最簡單的測試頁面
    import tempfile
    import os
    
    # 創建臨時測試文件
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write("""
import streamlit as st
st.title("測試頁面")
st.write("Hello World")
""")
        temp_file = f.name
    
    print(f"臨時文件: {temp_file}")
    
    # 測試載入
    at = AppTest.from_file(temp_file)
    print("✅ AppTest.from_file() 成功")
    
    # 執行
    at.run()
    print("✅ at.run() 成功")
    
    # 檢查異常
    if at.exception:
        print(f"⚠️ 頁面有異常: {at.exception}")
    else:
        print("✅ 頁面執行無異常")
    
    # 清理
    os.unlink(temp_file)
    
except Exception as e:
    print(f"❌ 測試失敗: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("診斷測試 4: 測試 Home.py 載入")
print("=" * 50)

try:
    at = AppTest.from_file("Home.py")
    print("✅ Home.py 載入成功")
    
    at.run()
    print("✅ Home.py 執行成功")
    
    if at.exception:
        print(f"⚠️ Home.py 有異常:")
        print(at.exception)
    else:
        print("✅ Home.py 無異常")
        
except Exception as e:
    print(f"❌ Home.py 測試失敗: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("診斷完成")
print("=" * 50)
