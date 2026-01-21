# ==========================================
# 臺東縣消防局整合系統啟動腳本
# CivicTech Unified System Launcher
# ==========================================
# 此腳本會啟動兩個系統：
# 1. 消防申報系統 (Streamlit) - Port 8501
# 2. 志工管理系統 (Node.js/React) - Port 3000
# ==========================================

param(
    [switch]$SkipInstall,
    [switch]$ProductionMode
)

$ErrorActionPreference = "Continue"
$OriginalLocation = Get-Location

# 定義顏色函數
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-ColorOutput Cyan "═══════════════════════════════════════════════════════════"
    Write-ColorOutput Cyan "  $Text"
    Write-ColorOutput Cyan "═══════════════════════════════════════════════════════════"
    Write-Host ""
}

function Write-Success {
    param([string]$Text)
    Write-ColorOutput Green "✓ $Text"
}

function Write-Info {
    param([string]$Text)
    Write-ColorOutput Yellow "ℹ $Text"
}

function Write-Error-Custom {
    param([string]$Text)
    Write-ColorOutput Red "✗ $Text"
}

# 系統資訊
Write-Header "臺東縣消防局整合系統 - 啟動中"
Write-Host "🚒 Fire Department Integrated System Launcher"
Write-Host "📅 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# 檢查必要工具
Write-Header "檢查系統需求"

# 檢查 uv (現代化的 Python 套件管理工具)
Write-Info "檢查 uv 套件管理工具..."
$uvVersion = uv --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "uv 已安裝: $uvVersion"
} else {
    Write-Error-Custom "uv 未安裝"
    Write-Info "正在安裝 uv..."
    Write-Host "執行: powershell -c \"irm https://astral.sh/uv/install.ps1 | iex\""
    irm https://astral.sh/uv/install.ps1 | iex
    if ($LASTEXITCODE -eq 0) {
        Write-Success "uv 安裝完成"
        # 重新載入 PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Error-Custom "uv 安裝失敗"
        Write-Host "請手動安裝 uv: https://docs.astral.sh/uv/"
        pause
        exit 1
    }
}

# 檢查 Node.js
Write-Info "檢查 Node.js 環境..."
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Node.js 已安裝: $nodeVersion"
} else {
    Write-Error-Custom "Node.js 未安裝或未加入 PATH"
    Write-Host "請先安裝 Node.js 18 或以上版本"
    Write-Host "下載網址: https://nodejs.org/"
    pause
    exit 1
}

# 檢查 pnpm
Write-Info "檢查 pnpm 套件管理工具..."
$pnpmVersion = pnpm --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Info "pnpm 未安裝，正在安裝..."
    npm install -g pnpm
    if ($LASTEXITCODE -eq 0) {
        Write-Success "pnpm 安裝完成"
    } else {
        Write-Error-Custom "pnpm 安裝失敗，將改用 npm"
    }
} else {
    Write-Success "pnpm 已安裝: $pnpmVersion"
}

# ==========================================
# 設定環境變數
# ==========================================
Write-Header "設定系統環境變數"

# 消防申報系統環境變數
$env:STREAMLIT_SERVER_PORT = "8501"
$env:STREAMLIT_SERVER_ADDRESS = "localhost"
$env:VOLUNTEER_MANAGEMENT_URL = "http://localhost:3000"

# 志工管理系統環境變數
if ($ProductionMode) {
    $env:NODE_ENV = "production"
    Write-Success "環境模式: Production"
} else {
    $env:NODE_ENV = "development"
    Write-Success "環境模式: Development"
}
$env:PORT = "3000"

Write-Success "消防申報系統: http://localhost:8501"
Write-Success "志工管理系統: http://localhost:3000"

# ==========================================
# 消防申報系統設置 (Streamlit)
# ==========================================
Write-Header "設置消防申報系統 (Streamlit)"

Set-Location "$PSScriptRoot\fire_dept_automation"

# 檢查並創建 .env 檔案
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Info "創建 .env 檔案..."
        Copy-Item ".env.example" ".env"
        Write-Success ".env 檔案已創建"
    }
}

# 使用 uv 同步依賴
if (-not $SkipInstall) {
    Write-Info "使用 uv 同步 Python 依賴套件..."
    uv sync
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Python 依賴套件同步完成"
    } else {
        Write-Error-Custom "依賴同步失敗，但將繼續執行"
    }
} else {
    Write-Info "跳過依賴安裝（已使用 -SkipInstall 參數）"
}

# 初始化資料庫
if (-not (Test-Path "fire_dept.db")) {
    Write-Info "初始化資料庫..."
    python db_manager.py
    Write-Success "資料庫初始化完成"
}

# ==========================================
# 志工管理系統設置 (Node.js)
# ==========================================
Write-Header "設置志工管理系統 (Node.js/React)"

Set-Location "$PSScriptRoot\fire_volunteer_management"

# 檢查並創建 .env 檔案
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Info "創建 .env 檔案..."
        Copy-Item ".env.example" ".env"
        Write-Success ".env 檔案已創建"
    }
}

# 安裝依賴
if (-not $SkipInstall) {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Info "安裝 Node.js 依賴套件 (使用 pnpm)..."
        pnpm install
    } else {
        Write-Info "安裝 Node.js 依賴套件 (使用 npm)..."
        npm install
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js 依賴套件安裝完成"
    } else {
        Write-Error-Custom "依賴套件安裝失敗"
        Set-Location $OriginalLocation
        pause
        exit 1
    }
}

# 初始化資料庫
if (-not (Test-Path "local.db")) {
    Write-Info "初始化資料庫 (Drizzle ORM)..."
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm run db:push
    } else {
        npm run db:push
    }
    Write-Success "資料庫初始化完成"
}

# ==========================================
# 啟動系統
# ==========================================
Write-Header "啟動系統"

Set-Location $PSScriptRoot

Write-Host ""
Write-ColorOutput Green "🎉 所有系統準備就緒！"
Write-Host ""
Write-ColorOutput Cyan "═══════════════════════════════════════════════════════════"
Write-ColorOutput Cyan "  系統連結資訊"
Write-ColorOutput Cyan "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-ColorOutput Yellow "📋 消防申報系統 (Streamlit):"
Write-ColorOutput White "   🌐 http://localhost:8501"
Write-Host ""
Write-ColorOutput Yellow "👥 志工管理系統 (React):"
Write-ColorOutput White "   🌐 http://localhost:3000"
Write-Host ""
Write-ColorOutput Cyan "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-Info "提示: 按 Ctrl+C 停止所有服務"
Write-Host ""

# 啟動消防申報系統
Write-Info "啟動消防申報系統..."
Set-Location "$PSScriptRoot\fire_dept_automation"
$streamlitJob = Start-Job -ScriptBlock {
    param($workDir)
    Set-Location $workDir
    $env:STREAMLIT_SERVER_PORT = "8501"
    $env:STREAMLIT_SERVER_ADDRESS = "localhost"
    uv run streamlit run home.py --server.port 8501 --server.address localhost
} -ArgumentList $PWD.Path

Start-Sleep -Seconds 2
Write-Success "消防申報系統啟動中... (Job ID: $($streamlitJob.Id))"

# 啟動志工管理系統
Write-Info "啟動志工管理系統..."
Set-Location "$PSScriptRoot\fire_volunteer_management"

if ($ProductionMode) {
    Write-Info "建置生產版本..."
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        pnpm run build
        $nodeJob = Start-Job -ScriptBlock {
            param($workDir)
            Set-Location $workDir
            $env:NODE_ENV = "production"
            $env:PORT = "3000"
            node dist/index.js
        } -ArgumentList $PWD.Path
    } else {
        npm run build
        $nodeJob = Start-Job -ScriptBlock {
            param($workDir)
            Set-Location $workDir
            $env:NODE_ENV = "production"
            $env:PORT = "3000"
            node dist/index.js
        } -ArgumentList $PWD.Path
    }
} else {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        $nodeJob = Start-Job -ScriptBlock {
            param($workDir)
            Set-Location $workDir
            $env:NODE_ENV = "development"
            $env:PORT = "3000"
            pnpm run dev
        } -ArgumentList $PWD.Path
    } else {
        $nodeJob = Start-Job -ScriptBlock {
            param($workDir)
            Set-Location $workDir
            $env:NODE_ENV = "development"
            $env:PORT = "3000"
            npm run dev
        } -ArgumentList $PWD.Path
    }
}

Start-Sleep -Seconds 2
Write-Success "志工管理系統啟動中... (Job ID: $($nodeJob.Id))"

# 等待系統完全啟動
Write-Host ""
Write-Info "等待系統完全啟動..."
Start-Sleep -Seconds 5

# 檢查服務狀態
Write-Header "檢查服務狀態"

$streamlitRunning = $false
$nodeRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8501" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $streamlitRunning = $true
    Write-Success "消防申報系統運行正常"
} catch {
    Write-Info "消防申報系統仍在啟動中..."
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $nodeRunning = $true
    Write-Success "志工管理系統運行正常"
} catch {
    Write-Info "志工管理系統仍在啟動中..."
}

Write-Host ""
Write-ColorOutput Green "═══════════════════════════════════════════════════════════"
Write-ColorOutput Green "  ✓ 系統啟動完成！"
Write-ColorOutput Green "═══════════════════════════════════════════════════════════"
Write-Host ""

if (-not $streamlitRunning) {
    Write-Info "消防申報系統可能需要更多時間啟動"
    Write-Info "請稍後訪問: http://localhost:8501"
}

if (-not $nodeRunning) {
    Write-Info "志工管理系統可能需要更多時間啟動"
    Write-Info "請稍後訪問: http://localhost:3000"
}

Write-Host ""
Write-Info "查看即時日誌:"
Write-Host "  消防申報系統: Receive-Job -Id $($streamlitJob.Id) -Keep"
Write-Host "  志工管理系統: Receive-Job -Id $($nodeJob.Id) -Keep"
Write-Host ""

# 監控執行
try {
    Write-Info "系統正在運行中... (按 Ctrl+C 停止)"
    Write-Host ""

    while ($true) {
        Start-Sleep -Seconds 5

        # 檢查 Job 狀態
        $streamlitState = (Get-Job -Id $streamlitJob.Id).State
        $nodeState = (Get-Job -Id $nodeJob.Id).State

        if ($streamlitState -ne "Running") {
            Write-Error-Custom "消防申報系統已停止 (狀態: $streamlitState)"
            Write-Host ""
            Write-Host "系統輸出:"
            Receive-Job -Id $streamlitJob.Id
            break
        }

        if ($nodeState -ne "Running") {
            Write-Error-Custom "志工管理系統已停止 (狀態: $nodeState)"
            Write-Host ""
            Write-Host "系統輸出:"
            Receive-Job -Id $nodeJob.Id
            break
        }
    }
} finally {
    Write-Header "正在停止所有服務"

    Write-Info "停止消防申報系統..."
    Stop-Job -Id $streamlitJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $streamlitJob.Id -Force -ErrorAction SilentlyContinue

    Write-Info "停止志工管理系統..."
    Stop-Job -Id $nodeJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $nodeJob.Id -Force -ErrorAction SilentlyContinue

    # 清理可能殘留的進程
    Get-Process | Where-Object {$_.ProcessName -like "*streamlit*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.Path -like "*fire_volunteer_management*"} | Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Success "所有服務已停止"

    Set-Location $OriginalLocation
    Write-Host ""
    Write-ColorOutput Cyan "感謝使用臺東縣消防局整合系統！"
    Write-Host ""
}
