# 臺東縣消防局整合系統 CivicTech Integrated System

整合消防申報系統與志工管理系統的統一啟動平台。

## 📖 快速導航

- **⚡ [快速參考卡](docs/QUICK_REFERENCE.md)** - 常用指令和問題解決
- **🔗 [系統整合說明](docs/SYSTEM_INTEGRATION.md)** - 完整的連接和配置指南
- **🚀 快速啟動** - 見下方說明

---

## 🚀 快速啟動

### 一鍵啟動所有系統

```powershell
.\start-all.ps1
```

### 選項

```powershell
# 跳過依賴安裝（如果已經安裝過）
.\start-all.ps1 -SkipInstall

# 以生產模式啟動
.\start-all.ps1 -ProductionMode

# 組合使用
.\start-all.ps1 -SkipInstall -ProductionMode
```

## 📦 系統需求

- **uv** - 現代化的 Python 套件管理工具（替代 pip/venv）
- **Node.js 18+** - 用於志工管理系統 (React/Express)
- **pnpm** (可選) - 更快的 Node.js 套件管理工具

### 安裝 uv

```powershell
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

或訪問: https://docs.astral.sh/uv/

## 🌐 系統連結

啟動後可以訪問：

| 系統 | URL | 說明 |
|------|-----|------|
| 消防申報系統 | http://localhost:8501 | 基於 Streamlit 的防災申報平台 |
| 志工管理系統 | http://localhost:3000 | 基於 React 的志工管理系統 |

## 📋 初次使用設置

1. **複製環境變數範例檔案**
   
   首次執行時，腳本會自動從 `.env.example` 建立 `.env` 檔案。

2. **配置環境變數**（可選）
   
   編輯各專案的 `.env` 檔案以配置資料庫、API 金鑰等：
   
   - `fire_dept_automation/.env`
   - `fire_volunteer_management/.env`

3. **執行啟動腳本**
   
   ```powershell
   .\start-all.ps1
   ```

## 🛠️ 單獨啟動系統

### 消防申報系統

```powershell
cd fire_dept_automation
uv sync
uv run streamlit run home.py --server.port 8501
```

### 志工管理系統

```powershell
cd fire_volunteer_management
pnpm run dev
# 或
npm run dev
```

## 🔧 故障排除

### 埠號衝突

如果埠號被佔用，您可以：

1. 停止佔用埠號的程式
2. 修改 `.env` 檔案中的埠號設定

檢查埠號佔用：

```powershell
# 檢查 8501 埠
netstat -ano | findstr :8501

# 檢查 3000 埠
netstat -ano | findstr :3000
```

### Python 虛擬環境問題

```powershell
cd fire_dept_automation
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Node.js 依賴問題

```powershell
cd fire_volunteer_management
Remove-Item -Recurse -Force node_modules
pnpm install
# 或
npm install
```

## 📝 系統架構

```
CivicTech/
├── fire_dept_automation/          # 消防申報系統 (Streamlit/Python)
│   ├── home.py                    # 主頁面
│   ├── pages/                     # 各功能頁面
│   ├── .env                       # 環境變數
│   └── requirements.txt           # Python 依賴
│
├── fire_volunteer_management/     # 志工管理系統 (React/Node.js)
│   ├── client/                    # 前端 React 應用
│   ├── server/                    # 後端 Express 伺服器
│   ├── .env                       # 環境變數
│   └── package.json               # Node.js 依賴
│
└── start-all.ps1                  # 整合啟動腳本
```

## 🔐 預設帳號（開發環境）

請參考各系統的 README：

- 消防申報系統：`fire_dept_automation/README.md`
- 志工管理系統：`fire_volunteer_management/README.md`

## 📞 技術支援

### 文件資源

1. **[⚡ 快速參考卡](docs/QUICK_REFERENCE.md)** - 一頁式快速指令參考
2. **[🔗 系統整合說明](docs/SYSTEM_INTEGRATION.md)** - 系統架構與連接詳解
3. **[📋 消防系統文件](fire_dept_automation/README.md)** - Streamlit 應用詳細說明
4. **[👥 志工系統文件](fire_volunteer_management/README.md)** - React 應用詳細說明

### 常見問題速查

- **無法啟動**: 查看 [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md#常見問題快速解決)
- **連接失敗**: 查看 [SYSTEM_INTEGRATION.md](docs/SYSTEM_INTEGRATION.md#故障排除)
- **埠號衝突**: 查看 [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md#問題-2-埠號被佔用)

### 聯絡資訊

如有其他問題，請聯繫系統管理員或查看各子專案的文件。

## 🎯 專案目標

打造整合的公私協力防災平台，結合：
- ✅ 防災教育與宣導
- ✅ 社區資源調度
- ✅ 志工管理與優化
- ✅ 智能文件處理
- ✅ 即時通知系統

## 📄 授權

MIT License

---

**最後更新**: 2025-11-27  
**專案維護**: CivicTech Team 臺東縣消防局
