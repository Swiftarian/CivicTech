# ⚡ 快速參考卡 Quick Reference Card

## 🚀 啟動系統

### Windows 一鍵啟動
```batch
start-all.bat
```
或
```powershell
.\start-all.ps1
```

## 🌐 系統網址

| 系統 | URL | 用途 |
|------|-----|------|
| 🚒 **消防申報系統** | **http://localhost:8501** | 防災館預約、送餐、申請、文件比對 |
| 👥 **志工管理系統** | **http://localhost:3000** | 志工管理、排班、送餐優化、通知 |

## ⌨️ 常用指令

### 停止系統
```powershell
# 按 Ctrl+C 停止所有服務
```

### 檢查埠號
```powershell
# 檢查 8501 (消防系統)
netstat -ano | findstr :8501

# 檢查 3000 (志工系統)
netstat -ano | findstr :3000
```

### 終止佔用埠號的進程
```powershell
# 查看 PID 後執行
Stop-Process -Id <PID> -Force
```

### 重新安裝依賴

#### Python (消防系統) - 使用 uv
```powershell
cd fire_dept_automation
uv sync --reinstall
```

#### Node.js (志工系統)
```powershell
cd fire_volunteer_management
pnpm install
# 或
npm install
```

## 🔧 常見問題快速解決

### 問題 1: PowerShell 執行政策限制
```powershell
powershell -ExecutionPolicy Bypass -File start-all.ps1
```

### 問題 2: 埠號被佔用
```powershell
# 方法 1: 找出並終止佔用進程
netstat -ano | findstr :8501
Stop-Process -Id <PID> -Force

# 方法 2: 修改 .env 中的埠號
```

### 問題 3: Python 依賴錯誤
```powershell
cd fire_dept_automation
Remove-Item -Recurse -Force .venv
uv sync --reinstall
```

### 問題 4: Node.js 模組錯誤
```powershell
cd fire_volunteer_management
Remove-Item -Recurse -Force node_modules
pnpm install
```

### 問題 5: 資料庫錯誤
```powershell
# 消防系統
cd fire_dept_automation
python db_manager.py

# 志工系統
cd fire_volunteer_management
pnpm run db:push
```

## 📁 重要檔案位置

| 檔案 | 位置 | 用途 |
|------|------|------|
| 啟動腳本 | `start-all.bat` / `start-all.ps1` | 啟動所有系統 |
| 環境設定 | `*/.env` | 環境變數配置 |
| 資料庫 | `fire_dept_automation/fire_dept.db` | 消防系統資料 |
| 資料庫 | `fire_volunteer_management/local.db` | 志工系統資料 |
| 設定檔 | `fire_dept_automation/config.toml` | 消防系統設定 |
| Streamlit設定 | `fire_dept_automation/.streamlit/config.toml` | UI主題設定 |

## 📊 系統狀態檢查

### 檢查服務是否運行
```powershell
# 使用網頁請求測試
Invoke-WebRequest -Uri "http://localhost:8501" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing

# 查看進程
Get-Process | Where-Object {
  $_.ProcessName -like "*python*" -or
  $_.ProcessName -like "*node*" -or
  $_.ProcessName -like "*streamlit*"
}
```

### 查看系統資源使用
```powershell
Get-Process | Where-Object {
  $_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"
} | Select-Object ProcessName, CPU, @{
  Name="Memory(MB)"; Expression={[math]::Round($_.WorkingSet/1MB, 2)}
} | Format-Table -AutoSize
```

## 🔄 重啟單一系統

### 只重啟消防申報系統
```powershell
cd fire_dept_automation
uv run streamlit run home.py --server.port 8501
```

### 只重啟志工管理系統
```powershell
cd fire_volunteer_management
pnpm run dev
# 或生產模式
pnpm run build
pnpm run start
```

## 🎯 開發模式 vs 生產模式

### 開發模式 (預設)
```powershell
.\start-all.ps1
```
- 啟用熱重載 (Hot Reload)
- 詳細錯誤訊息
- 開發工具可用

### 生產模式
```powershell
.\start-all.ps1 -ProductionMode
```
- 優化效能
- 壓縮資源
- 啟用快取

### 跳過依賴安裝
```powershell
.\start-all.ps1 -SkipInstall
```

## 📝 日誌檔案

### 查看即時日誌
腳本啟動後會顯示 Job ID，使用以下指令查看：

```powershell
# 消防系統日誌
Receive-Job -Id <StreamlitJobId> -Keep

# 志工系統日誌
Receive-Job -Id <NodeJobId> -Keep
```

## 🔐 預設帳號資訊

請參考各系統的 README 檔案：
- 消防系統: `fire_dept_automation/README.md`
- 志工系統: `fire_volunteer_management/README.md`

## 📞 緊急聯絡

遇到無法解決的問題時：

1. 檢查 `SYSTEM_INTEGRATION.md` 詳細文件
2. 查看各專案的 README
3. 聯繫系統管理員

## 📚 更多資訊

- [完整整合文件](SYSTEM_INTEGRATION.md)
- [專案 README](README.md)
- [部署文件](fire_dept_automation/DEPLOYMENT.md)
- [Railway 部署](fire_volunteer_management/docs/RAILWAY_DEPLOYMENT.md)

---

💡 **小提示**: 將此檔案加入書籤，隨時查閱！
