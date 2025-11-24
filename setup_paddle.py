"""
PaddleOCR Installation Helper
協助安裝和驗證 PaddleOCR 及其依賴套件
"""

import sys
import subprocess
import os

def check_system_requirements():
    """檢查系統需求"""
    print("=" * 60)
    print("PaddleOCR 系統需求檢查")
    print("=" * 60)
    
    # Check Python version
    py_version = sys.version_info
    print(f"\n✓ Python 版本: {py_version.major}.{py_version.minor}.{py_version.micro}")
    
    if py_version < (3, 7):
        print("❌ 需要 Python 3.7 或更高版本")
        return False
    
    # Check available memory (rough estimate)
    try:
        import psutil
        mem = psutil.virtual_memory()
        mem_gb = mem.total / (1024**3)
        print(f"✓ 系統記憶體: {mem_gb:.1f} GB")
        
        if mem_gb < 2:
            print("⚠️  警告: 建議至少 4GB RAM，目前記憶體可能不足")
        elif mem_gb < 4:
            print("⚠️  警告: 建議 4GB+ RAM 以獲得最佳效能")
    except ImportError:
        print("ℹ️  無法檢查記憶體（需安裝 psutil）")
    
    # Check disk space
    try:
        stat = os.statvfs(os.getcwd()) if hasattr(os, 'statvfs') else None
        if stat:
            free_gb = (stat.f_bavail * stat.f_frsize) / (1024**3)
            print(f"✓ 可用磁碟空間: {free_gb:.1f} GB")
    except:
        pass
    
    return True

def install_paddleocr():
    """安裝 PaddleOCR 及其依賴"""
    print("\n" + "=" * 60)
    print("開始安裝 PaddleOCR")
    print("=" * 60)
    
    packages = [
        ("paddlepaddle", "PaddlePaddle (CPU 版本)"),
        ("paddleocr", "PaddleOCR"),
    ]
    
    for package, description in packages:
        print(f"\n正在安裝 {description}...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", package, "--upgrade"
            ])
            print(f"✅ {description} 安裝成功")
        except subprocess.CalledProcessError as e:
            print(f"❌ {description} 安裝失敗: {e}")
            return False
    
    return True

def verify_installation():
    """驗證安裝"""
    print("\n" + "=" * 60)
    print("驗證 PaddleOCR 安裝")
    print("=" * 60)
    
    try:
        # Import modules
        print("\n正在檢查套件...")
        import paddlepaddle as paddle
        import paddleocr
        
        print(f"✅ PaddlePaddle 版本: {paddle.__version__}")
        print(f"✅ PaddleOCR 版本: {paddleocr.__version__}")
        
        # Try to initialize
        print("\n正在初始化 PaddleOCR (繁體中文)...")
        from paddleocr import PaddleOCR
        
        ocr = PaddleOCR(lang='chinese_cht', show_log=False)
        print("✅ PaddleOCR 初始化成功")
        
        # Download model
        print("\n首次使用會下載模型檔案（約 10-20MB）...")
        print("請稍候...")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 驗證失敗: {e}")
        return False

def test_ocr():
    """測試 OCR 功能"""
    print("\n" + "=" * 60)
    print("測試 OCR 功能")
    print("=" * 60)
    
    try:
        import paddle_ocr
        
        # Check availability
        if not paddle_ocr.is_paddle_available():
            print("❌ PaddleOCR 不可用")
            return False
        
        # Get info
        info = paddle_ocr.get_paddle_info()
        print("\nPaddleOCR 資訊:")
        for key, value in info.items():
            print(f"  {key}: {value}")
        
        print("\n✅ PaddleOCR 整合模組測試通過")
        return True
        
    except Exception as e:
        print(f"\n❌ 測試失敗: {e}")
        return False

def main():
    """主程式"""
    import argparse
    
    parser = argparse.ArgumentParser(description='PaddleOCR 安裝輔助程式')
    parser.add_argument('--test', action='store_true', help='只執行測試，不安裝')
    parser.add_argument('--check', action='store_true', help='只檢查系統需求')
    
    args = parser.parse_args()
    
    # Check system requirements
    if not check_system_requirements():
        sys.exit(1)
    
    if args.check:
        sys.exit(0)
    
    # Test mode
    if args.test:
        if test_ocr():
            print("\n" + "=" * 60)
            print("✅ 所有測試通過！PaddleOCR 已準備就緒")
            print("=" * 60)
            sys.exit(0)
        else:
            print("\n" + "=" * 60)
            print("❌ 測試失敗，請先安裝 PaddleOCR")
            print("=" * 60)
            sys.exit(1)
    
    # Install mode
    print("\n準備安裝 PaddleOCR...")
    input("按 Enter 繼續，或 Ctrl+C 取消...")
    
    if not install_paddleocr():
        print("\n安裝失敗")
        sys.exit(1)
    
    if not verify_installation():
        print("\n驗證失敗")
        sys.exit(1)
    
    if not test_ocr():
        print("\n測試失敗")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 PaddleOCR 安裝完成！")
    print("=" * 60)
    print("\n您現在可以在系統中使用 PaddleOCR 了")
    print("請重新啟動 Streamlit 應用程式以套用變更")

if __name__ == "__main__":
    main()
