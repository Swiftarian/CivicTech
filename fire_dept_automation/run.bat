@echo off
chcp 65001 >nul
echo ====================================
echo 臺東縣消防局檢修申報系統
echo Fire Department Automation System
echo ====================================
echo.

REM 進入專案目錄
cd /d "%~dp0"

REM 檢查 uv 是否可用
uv --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] uv 未安裝或未加入 PATH
    echo [INFO] 請先安裝 uv（現代化的 Python 套件管理工具）
    echo [INFO] 執行: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    echo [INFO] 或訪問: https://docs.astral.sh/uv/
    pause
    exit /b 1
)

echo [INFO] 偵測到 uv 套件管理工具

REM 同步依賴
echo [INFO] 同步依賴套件...
uv sync
if errorlevel 1 (
    echo [ERROR] 套件同步失敗
    pause
    exit /b 1
)

REM 啟動 Streamlit
echo.
echo [INFO] 正在啟動系統...
echo [INFO] 系統將在瀏覽器自動開啟（預設 http://localhost:8501）
echo [INFO] 按 Ctrl+C 可停止系統
echo.

uv run streamlit run home.py

REM 如果 Streamlit 異常結束
if errorlevel 1 (
    echo.
    echo [ERROR] 系統啟動失敗，請檢查錯誤訊息
)

pause
