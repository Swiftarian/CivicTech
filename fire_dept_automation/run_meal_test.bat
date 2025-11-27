@echo off
chcp 65001
echo ==========================================
echo 正在驗證送餐系統後端邏輯...
echo ==========================================

cd /d "%~dp0"
if not exist "venv" (
    echo ⚠️ 未偵測到虛擬環境，嘗試直接執行...
    python -m unittest tests\test_meal_backend.py
) else (
    echo ✅ 啟動虛擬環境...
    call venv\Scripts\activate
    python -m unittest tests\test_meal_backend.py
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 後端邏輯測試全部通過！
) else (
    echo.
    echo ❌ 測試失敗，請檢查錯誤訊息。
)

pause
