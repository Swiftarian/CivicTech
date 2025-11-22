@echo off
chcp 65001 >nul
echo ====================================
echo 臺東縣消防局檢修申報系統
echo Fire Department Automation System
echo ====================================
echo.

REM 進入專案目錄
cd /d "%~dp0"

REM 檢查並啟用虛擬環境
if exist ".venv\Scripts\activate.bat" (
    echo [INFO] 偵測到虛擬環境，正在啟用...
    call .venv\Scripts\activate.bat
) else (
    echo [WARNING] 未偵測到虛擬環境 (.venv)
    echo [INFO] 建議執行: python -m venv .venv
    echo.
)

REM 檢查 Python 是否可用
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 未安裝或未加入 PATH
    echo [INFO] 請先安裝 Python 3.9 或以上版本
    pause
    exit /b 1
)

REM 檢查是否已安裝依賴
echo [INFO] 檢查依賴套件...
pip show streamlit >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 尚未安裝依賴套件
    echo [INFO] 正在安裝 requirements.txt...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] 套件安裝失敗
        pause
        exit /b 1
    )
)

REM 啟動 Streamlit
echo.
echo [INFO] 正在啟動系統...
echo [INFO] 系統將在瀏覽器自動開啟（預設 http://localhost:8501）
echo [INFO] 按 Ctrl+C 可停止系統
echo.

streamlit run 首頁.py

REM 如果 Streamlit 異常結束
if errorlevel 1 (
    echo.
    echo [ERROR] 系統啟動失敗，請檢查錯誤訊息
)

pause
