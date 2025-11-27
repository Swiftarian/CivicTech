@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ═══════════════════════════════════════════════════════════
echo   臺東縣消防局整合系統 - 快速啟動
echo   CivicTech Integrated System Quick Start
echo ═══════════════════════════════════════════════════════════
echo.
echo 🚒 消防申報系統: http://localhost:8501
echo 👥 志工管理系統: http://localhost:3000
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo [INFO] 正在啟動 PowerShell 腳本...
echo [INFO] 如果需要，請允許執行腳本
echo.

REM 檢查 PowerShell 執行政策
powershell -Command "Get-ExecutionPolicy" | findstr /i "Restricted" >nul
if %errorlevel% equ 0 (
    echo [WARNING] PowerShell 執行政策受限
    echo [INFO] 嘗試以 Bypass 模式執行...
    echo.
    powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
) else (
    powershell -File "%~dp0start-all.ps1"
)

if errorlevel 1 (
    echo.
    echo [ERROR] 啟動失敗
    echo.
    echo 可能的解決方案:
    echo 1. 以系統管理員身分執行此腳本
    echo 2. 手動執行: powershell -ExecutionPolicy Bypass -File start-all.ps1
    echo 3. 分別啟動各系統（參考 README.md）
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] 系統已停止
pause
