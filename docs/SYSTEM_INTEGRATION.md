# 系統連結與整合說明
# System Integration and Connectivity Guide

## 🔗 系統架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                    使用者瀏覽器 (Browser)                      │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               │                          │
       Port 8501│                  Port 3000│
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌─────────────────────────────┐
│   消防申報系統            │  │   志工管理系統               │
│   Fire Dept System       │  │   Volunteer Management      │
│   (Streamlit/Python)     │◄─┤   (React/Node.js/Express)   │
│                          │  │                             │
│  • 防災館預約            │  │  • 志工資料管理              │
│  • 社區送餐              │  │  • 排班系統                  │
│  • 公共申請              │  │  • 送餐優化                  │
│  • 案件審查              │  │  • 簡訊/Email通知            │
│  • 文件比對              │  │  • QR Code簽到               │
└──────────┬───────────────┘  └──────────┬──────────────────┘
           │                             │
           │ SQLite                      │ SQLite/PostgreSQL
           ▼                             ▼
   ┌───────────────┐            ┌──────────────────┐
   │ fire_dept.db  │            │    local.db      │
   │               │            │ (Drizzle ORM)    │
   └───────────────┘            └──────────────────┘
```

## 📡 連接設定

### 環境變數配置

#### 消防申報系統 (fire_dept_automation/.env)
```bash
# 本系統運行在
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=localhost

# 可以連接到志工管理系統
VOLUNTEER_MANAGEMENT_URL=http://localhost:3000
```

#### 志工管理系統 (fire_volunteer_management/.env)
```bash
# 本系統運行在
NODE_ENV=development
PORT=3000

# 可以連接到消防申報系統
VITE_FIRE_DEPT_APP_URL=http://localhost:8501
```

## 🌐 系統間通訊

### 1. 從消防申報系統訪問志工管理系統

在 Streamlit 應用中，可以添加連結：

```python
import os
import streamlit as st

# 讀取環境變數
volunteer_url = os.getenv('VOLUNTEER_MANAGEMENT_URL', 'http://localhost:3000')

# 添加連結到頁面
st.markdown(f"""
    <a href="{volunteer_url}" target="_blank">
        前往志工管理系統 →
    </a>
""", unsafe_allow_html=True)
```

### 2. 從志工管理系統訪問消防申報系統

在 React 組件中：

```typescript
// 在 client/src/const.ts 或組件中
const FIRE_DEPT_URL = import.meta.env.VITE_FIRE_DEPT_APP_URL || 'http://localhost:8501';

// 在組件中使用
<a href={FIRE_DEPT_URL} target="_blank" rel="noopener noreferrer">
  前往消防申報系統
</a>
```

### 3. API 整合（未來擴展）

如果需要系統間 API 通訊：

#### Streamlit → Node.js API
```python
import requests
import os

volunteer_api = os.getenv('VOLUNTEER_MANAGEMENT_URL', 'http://localhost:3000')

# 取得志工資料
response = requests.get(f"{volunteer_api}/api/trpc/volunteers.list")
volunteers = response.json()
```

#### React → Streamlit（透過 REST API）
```typescript
// 如果 Streamlit 有提供 API endpoint
const fireDeptApi = import.meta.env.VITE_FIRE_DEPT_APP_URL;

const response = await fetch(`${fireDeptApi}/api/bookings`);
const bookings = await response.json();
```

## 🚀 啟動順序

使用 `start-all.ps1` 或 `start-all.bat` 腳本會自動按正確順序啟動：

1. **檢查系統需求** - Python, Node.js, pnpm
2. **設置環境變數** - 設定正確的 PORT 和 URL
3. **消防申報系統** - 啟動 Streamlit (Port 8501)
4. **志工管理系統** - 啟動 Node.js (Port 3000)
5. **健康檢查** - 驗證兩個系統都正常運行

## 🔍 連接測試

### 手動測試連接

#### 1. 測試消防申報系統
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:8501" -UseBasicParsing
```

#### 2. 測試志工管理系統
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

#### 3. 測試 API (如果有)
```powershell
# 測試 tRPC API
Invoke-WebRequest -Uri "http://localhost:3000/api/trpc/volunteers.list" -UseBasicParsing
```

### 使用瀏覽器測試

直接訪問以下網址：

- 消防申報系統: http://localhost:8501
- 志工管理系統: http://localhost:3000
- 志工管理 API 文件: http://localhost:3000/api

## 🛠️ 故障排除

### 連接失敗

**症狀**: 無法從一個系統連接到另一個系統

**解決方案**:
1. 確認兩個系統都在運行
   ```powershell
   netstat -ano | findstr "8501 3000"
   ```

2. 檢查環境變數
   ```powershell
   # 在 PowerShell 中查看
   $env:VOLUNTEER_MANAGEMENT_URL
   $env:VITE_FIRE_DEPT_APP_URL
   ```

3. 檢查防火牆設定
   - Windows 防火牆可能阻擋 localhost 連接
   - 允許 Python 和 Node.js 通過防火牆

### Python 依賴問題

**症狀**: 模組導入失敗或套件版本衝突

**解決方案** (使用 uv):
```powershell
cd fire_dept_automation
# 清理並重新同步
uv sync --reinstall

# 或清除快取
Remove-Item -Recurse -Force .venv
uv sync
```

### 埠號衝突

**症狀**: 系統啟動失敗，顯示埠號已被使用

**解決方案**:
```powershell
# 查找佔用埠號的程序
netstat -ano | findstr :8501
netstat -ano | findstr :3000

# 終止進程 (替換 PID)
Stop-Process -Id <PID> -Force
```

### CORS 錯誤

**症狀**: 前端無法連接後端 API

**解決方案**: 在 Node.js 伺服器添加 CORS 設定
```typescript
// server/_core/index.ts
import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:8501', 'http://localhost:3000'],
  credentials: true
}));
```

## 📊 效能監控

### 檢查系統狀態

```powershell
# 查看 CPU 和記憶體使用
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"} | 
  Select-Object ProcessName, CPU, WorkingSet | 
  Format-Table -AutoSize
```

### 查看日誌

```powershell
# Streamlit 日誌 (在啟動腳本顯示的 Job ID)
Receive-Job -Id <StreamlitJobId> -Keep

# Node.js 日誌
Receive-Job -Id <NodeJobId> -Keep
```

## 🔒 安全性考量

### 開發環境 (Development)
- 使用 localhost
- 資料庫使用本地 SQLite
- 關閉 HTTPS 檢查

### 生產環境 (Production)
- 使用環境變數管理敏感資訊
- 啟用 HTTPS
- 設定正確的 CORS 來源
- 使用反向代理 (Nginx, Caddy)
- 資料庫使用 PostgreSQL

### 建議的生產環境架構

```
Internet
   ↓
[Nginx Reverse Proxy] - Port 80/443
   ├─→ /app1 → Streamlit (Port 8501)
   └─→ /app2 → Node.js (Port 3000)
```

配置範例 (Nginx):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /fire-dept/ {
        proxy_pass http://localhost:8501/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /volunteer/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📞 技術支援

如遇到連接問題：

1. 檢查 `start-all.ps1` 的輸出日誌
2. 確認 `.env` 檔案配置正確
3. 查看瀏覽器開發者工具的網絡請求
4. 查看系統日誌檔案

---

**最後更新**: 2025-11-27  
**維護者**: CivicTech Team
