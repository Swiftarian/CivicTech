@echo off
chcp 65001 >nul
echo ========================================
echo   OCR 文件比對系統 - 安裝腳本
echo ========================================
echo.

echo [1/4] 檢查 Python 版本...
python --version
if errorlevel 1 (
    echo 錯誤：未安裝 Python，請先安裝 Python 3.10+
    pause
    exit /b 1
)

echo.
echo [2/4] 安裝 Python 依賴套件...
pip install opencv-python numpy Pillow PyMuPDF python-docx pandas openpyxl requests

echo.
echo [3/4] 安裝 PaddleOCR...
echo 提示：若您有 NVIDIA GPU，將安裝 GPU 版本
pip install paddlepaddle paddleocr

echo.
echo [4/4] 安裝 Ollama (本地 LLM)...
echo 請訪問 https://ollama.com 下載並安裝 Ollama
echo 安裝後執行：ollama pull qwen2.5-vl:7b
echo.

echo ========================================
echo   安裝完成！
echo ========================================
echo.
echo 使用方式：
echo   python main.py --input 掃描檔.pdf --output 結果.json
echo.
echo 進階用法（與 Excel 比對）：
echo   python main.py --input 掃描檔.pdf --reference 資料.xlsx --key-column 編號 --key-value A001
echo.
pause
