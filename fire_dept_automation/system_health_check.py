"""
系統健康檢查 - 紅黃綠燈測試
檢查所有主要功能的狀態並以顏色標示
"""

import sys
import os

# ANSI 顏色碼
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_status(status, message):
    """打印狀態訊息"""
    if status == "PASS":
        print(f"{Colors.GREEN}● 綠燈{Colors.END} {message}")
        return True
    elif status == "WARN":
        print(f"{Colors.YELLOW}● 黃燈{Colors.END} {message}")
        return True
    else:  # FAIL
        print(f"{Colors.RED}● 紅燈{Colors.END} {message}")
        return False

def test_python_version():
    """測試 Python 版本"""
    version = sys.version_info
    if version >= (3, 8):
        return print_status("PASS", f"Python 版本: {version.major}.{version.minor}.{version.micro} ✓")
    else:
        return print_status("FAIL", f"Python 版本過舊: {version.major}.{version.minor}.{version.micro} (需要 3.8+)")

def test_core_modules():
    """測試核心模組"""
    modules = {
        'streamlit': '網頁框架',
        'pandas': '資料處理',
        'PIL': '圖片處理',
        'fitz': 'PDF 處理',
    }
    
    all_pass = True
    for module, desc in modules.items():
        try:
            __import__(module)
            print_status("PASS", f"{desc} ({module}) ✓")
        except ImportError:
            print_status("FAIL", f"{desc} ({module}) 缺少")
            all_pass = False
    
    return all_pass

def test_ocr_engines():
    """測試 OCR 引擎"""
    print(f"\n{Colors.BOLD}OCR 引擎檢查:{Colors.END}")
    
    all_pass = True
    
    # Test Tesseract
    try:
        import pytesseract
        print_status("PASS", "Tesseract OCR (傳統引擎) ✓")
    except ImportError:
        print_status("FAIL", "Tesseract OCR 缺少")
        all_pass = False
    
    # Test PaddleOCR
    try:
        import paddle_ocr
        if paddle_ocr.is_paddle_available():
            info = paddle_ocr.get_paddle_info()
            version = info.get('paddleocr_version', 'unknown')
            print_status("PASS", f"PaddleOCR (高準確率引擎) v{version} ✓")
        else:
            print_status("WARN", "PaddleOCR 未安裝（可選）")
    except Exception as e:
        print_status("WARN", f"PaddleOCR 檢查失敗: {e}（可選）")
    
    return all_pass

def test_ai_engines():
    """測試 AI 引擎"""
    print(f"\n{Colors.BOLD}AI 引擎檢查:{Colors.END}")
    
    # Test Ollama
    try:
        import ai_engine
        if ai_engine.is_ollama_available():
            print_status("PASS", "Ollama AI 服務運行中 ✓")
        else:
            print_status("WARN", "Ollama AI 服務未運行（可選）")
    except Exception as e:
        print_status("WARN", f"AI 引擎檢查失敗: {e}（可選）")
    
    return True  # AI engines are optional

def test_file_structure():
    """測試檔案結構"""
    print(f"\n{Colors.BOLD}檔案結構檢查:{Colors.END}")
    
    required_files = {
        'pages/5_自動比對系統.py': '自動比對系統',
        'db_manager.py': '資料庫管理',
        'utils.py': '工具函數',
        'doc_integrity.py': '文件完整性',
        'paddle_ocr.py': 'PaddleOCR 模組',
    }
    
    all_pass = True
    for file, desc in required_files.items():
        if os.path.exists(file):
            print_status("PASS", f"{desc} ({file}) ✓")
        else:
            print_status("FAIL", f"{desc} ({file}) 缺少")
            all_pass = False
    
    return all_pass

def test_database():
    """測試資料庫"""
    print(f"\n{Colors.BOLD}資料庫檢查:{Colors.END}")
    
    try:
        import db_manager
        # Try to get cases
        cases = db_manager.get_all_cases()
        print_status("PASS", f"資料庫連線正常，共 {len(cases)} 筆案件 ✓")
        return True
    except Exception as e:
        print_status("WARN", f"資料庫檢查失敗: {e}")
        return True  # Not critical

def test_configuration():
    """測試設定檔"""
    print(f"\n{Colors.BOLD}設定檔檢查:{Colors.END}")
    
    all_pass = True
    
    # Check secrets.toml
    secrets_path = ".streamlit/secrets.toml"
    if os.path.exists(secrets_path):
        print_status("PASS", "Streamlit secrets 設定檔 ✓")
    else:
        print_status("WARN", "Streamlit secrets 設定檔不存在（可選）")
    
    # Check config files
    config_files = ['config_loader.py', 'requirements.txt']
    for config in config_files:
        if os.path.exists(config):
            print_status("PASS", f"{config} ✓")
        else:
            print_status("FAIL", f"{config} 缺少")
            all_pass = False
    
    return all_pass

def run_all_tests():
    """執行所有測試"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 60)
    print("消防局自動化系統 - 紅黃綠燈健康檢查")
    print("=" * 60)
    print(f"{Colors.END}\n")
    
    results = []
    
    print(f"{Colors.BOLD}基礎環境檢查:{Colors.END}")
    results.append(("Python 版本", test_python_version()))
    
    print(f"\n{Colors.BOLD}核心模組檢查:{Colors.END}")
    results.append(("核心模組", test_core_modules()))
    
    results.append(("OCR 引擎", test_ocr_engines()))
    results.append(("AI 引擎", test_ai_engines()))
    results.append(("檔案結構", test_file_structure()))
    results.append(("資料庫", test_database()))
    results.append(("設定檔", test_configuration()))
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("=" * 60)
    print("測試摘要")
    print("=" * 60)
    print(f"{Colors.END}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\n通過率: {passed}/{total} ({passed/total*100:.0f}%)\n")
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        color = Colors.GREEN if result else Colors.RED
        print(f"{color}{status}{Colors.END} - {name}")
    
    print(f"\n{Colors.BOLD}系統狀態:{Colors.END}")
    if passed == total:
        print(f"{Colors.GREEN}● 綠燈 - 所有系統正常運作{Colors.END}")
    elif passed >= total * 0.8:
        print(f"{Colors.YELLOW}● 黃燈 - 系統大致正常，有些可選功能未啟用{Colors.END}")
    else:
        print(f"{Colors.RED}● 紅燈 - 發現嚴重問題，需要修復{Colors.END}")
    
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.END}\n")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n{Colors.RED}測試執行失敗: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
