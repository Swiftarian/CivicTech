# 🏛️ CivicTech 公私協力防災整合系統

**[English](README_EN.md)** | 繁體中文

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

> **臺東縣消防局公私協力防災媒合平台** - 整合消防申報、志工管理、送餐服務與防災教育的一站式解決方案

---

## 📖 快速導航

| 文件 | 說明 |
|------|------|
| [🏗️ 系統架構](docs/ARCHITECTURE.md) | 技術架構與 Mermaid 圖表 |
| [⚡ 快速參考卡](docs/QUICK_REFERENCE.md) | 常用指令和問題解決 |
| [🔗 系統整合說明](docs/SYSTEM_INTEGRATION.md) | 完整的連接和配置指南 |
| [📋 貢獻指南](CONTRIBUTING.md) | 如何參與這個專案 |
| [📜 行為準則](CODE_OF_CONDUCT.md) | 社群行為準則 |

---

## 🎯 專案概述

CivicTech 是一個**開源的公私協力防災整合平台**，旨在協助消防機關提升行政效率、強化社區防災韌性，並優化志工服務管理。本專案採用 Monorepo 架構，整合兩大核心子系統：

### � 消防申報自動化系統 (`fire_dept_automation`)

基於 **Python + Streamlit** 的防災服務平台，提供：

- **📝 消防檢修線上申報** - 民眾可線上填寫表單、上傳文件
- **🔍 OCR 自動比對** - Tesseract OCR 辨識申報書與系統資料自動比對
- **🍱 社區互助送餐服務** - 長照餐食配送管理、GPS 路線追蹤、拍照驗證
- **🏛️ 防災教育館預約** - 團體/個人預約、時段管理
- **👮 案件審核管理** - 批量操作、狀態更新、Email 自動通知

### 👥 志工管理系統 (`fire_volunteer_management`)

基於 **React + TypeScript + Node.js** 的全端應用程式，提供：

- **📅 智慧排班系統** - 拖拉式志工排班管理
- **⏰ 打卡簽到/簽退** - QR Code 驗證、GPS 定位
- **🚗 送餐任務追蹤** - 即時路徑追蹤、送達驗證
- **📊 績效儀表板** - 服務時數統計、貢獻分析
- **📱 響應式設計** - 桌面與行動裝置完美適配

---

## 🚀 快速開始

### 系統需求

| 工具 | 版本 | 說明 |
|------|------|------|
| **Python** | 3.12+ | 消防申報系統 |
| **uv** | 最新版 | Python 套件管理 ([安裝指南](https://docs.astral.sh/uv/)) |
| **Node.js** | 22.x | 志工管理系統 |
| **pnpm** | 9.x+ | Node.js 套件管理 |

### 一鍵啟動所有系統

```powershell
# Windows PowerShell 一鍵啟動
.\start-all.ps1
```

### 啟動選項

```powershell
# 跳過依賴安裝（如果已經安裝過）
.\start-all.ps1 -SkipInstall

# 以生產模式啟動
.\start-all.ps1 -ProductionMode

# 組合使用
.\start-all.ps1 -SkipInstall -ProductionMode
```

### 手動啟動個別系統

```powershell
# 消防申報系統 (Streamlit)
cd fire_dept_automation
uv sync
uv run streamlit run home.py --server.port 8501

# 志工管理系統 (React + Node.js)
cd fire_volunteer_management
pnpm install
pnpm run dev
```

---

## 🌐 系統連結

啟動後可訪問：

| 系統 | URL | 技術棧 |
|------|-----|--------|
| 🔥 消防申報系統 | http://localhost:8501 | Streamlit + Python |
| 👥 志工管理系統 | http://localhost:3000 | React + Express |

---

## � 專案架構

```
CivicTech/
├── 📂 fire_dept_automation/        # 🔥 消防申報自動化系統
│   ├── home.py                     # 主程式入口
│   ├── pages/                      # Streamlit 多頁面
│   │   ├── 1_disaster_prevention_museum_booking.py
│   │   ├── 2_community_meal_delivery.py
│   │   ├── 3_public_application_and_inquiry.py
│   │   ├── 4_case_review.py
│   │   └── 5_auto_comparison_system.py
│   ├── db_manager.py               # SQLite 資料庫操作
│   ├── ai_engine.py                # AI/OCR 引擎
│   ├── utils.py                    # 工具函式
│   ├── config.toml                 # 系統設定（支援多縣市部署）
│   └── pyproject.toml              # Python 依賴 (uv)
│
├── 📂 fire_volunteer_management/   # 👥 志工管理系統
│   ├── client/                     # 前端 React 應用
│   │   └── src/
│   │       ├── pages/              # 頁面組件
│   │       ├── components/         # UI 組件
│   │       └── hooks/              # 自訂 Hooks
│   ├── server/                     # 後端 Express + tRPC
│   ├── drizzle/                    # 資料庫 Schema (Drizzle ORM)
│   ├── shared/                     # 前後端共用型別
│   └── package.json                # Node.js 依賴
│
├── 📂 docs/                        # 📚 文件
│   ├── QUICK_REFERENCE.md
│   ├── SYSTEM_INTEGRATION.md
│   ├── AWS_S3_SETUP_GUIDE.md
│   └── GOOGLE_MAPS_SETUP_GUIDE.md
│
├── start-all.ps1                   # Windows 整合啟動腳本
├── start-all.bat                   # Windows Batch 啟動腳本
├── package.json                    # Monorepo 設定 (Husky, Lint-Staged)
├── CODE_OF_CONDUCT.md              # 行為準則
├── CONTRIBUTING.md                 # 貢獻指南
├── SECURITY.md                     # 安全政策
└── LICENSE                         # MIT 授權
```

---

## 🛠️ 技術棧

### 消防申報系統 (Python)

| 類別 | 技術 |
|------|------|
| 框架 | Streamlit |
| 資料庫 | SQLite |
| OCR | Tesseract OCR + PaddleOCR |
| PDF 處理 | PyMuPDF (fitz) |
| 資料處理 | Pandas |
| 密碼加密 | bcrypt |

### 志工管理系統 (TypeScript)

| 類別 | 技術 |
|------|------|
| 前端框架 | React 19 |
| 型別系統 | TypeScript 5 |
| UI 組件 | shadcn/ui + Tailwind CSS 4 |
| 狀態管理 | TanStack Query |
| 路由 | Wouter |
| 後端框架 | Express 4 |
| API | tRPC 11 (端到端型別安全) |
| 資料庫 ORM | Drizzle ORM |
| 資料庫 | MySQL / TiDB |
| 檔案儲存 | AWS S3 |
| 測試 | Vitest |

### 開發工具鏈

| 工具 | 用途 |
|------|------|
| pnpm | Node.js 套件管理 |
| uv | Python 套件管理 |
| Husky | Git Hooks |
| Lint-Staged | 提交前 Lint |
| Prettier | 程式碼格式化 |
| ESLint | JavaScript/TypeScript Lint |

---

## 📋 初次使用設置

### 1. 複製環境變數範例

```powershell
# 消防申報系統
copy fire_dept_automation\.env.example fire_dept_automation\.env

# 志工管理系統
copy fire_volunteer_management\.env.example fire_volunteer_management\.env
```

### 2. 配置環境變數

編輯 `.env` 檔案以配置：
- 📧 Email SMTP 設定
- 🗄️ 資料庫連線
- 🔑 API 金鑰 (Google Maps, AWS S3 等)
- � JWT 密鑰

### 3. 安裝 Tesseract OCR（如需 OCR 功能）

```powershell
# Windows - 下載安裝程式
# https://github.com/UB-Mannheim/tesseract/wiki
# 預設路徑：C:\Program Files\Tesseract-OCR\
# 需安裝繁體中文語言包
```

---

## 🔧 故障排除

### 埠號衝突

```powershell
# 檢查埠號佔用
netstat -ano | findstr :8501
netstat -ano | findstr :3000

# 終止特定程序
taskkill /PID <PID> /F
```

### 依賴安裝問題

```powershell
# 消防申報系統 - 重新安裝依賴
cd fire_dept_automation
Remove-Item -Recurse -Force .venv
uv sync

# 志工管理系統 - 重新安裝依賴
cd fire_volunteer_management
Remove-Item -Recurse -Force node_modules
pnpm install
```

更多問題請參考 [快速參考卡](docs/QUICK_REFERENCE.md)。

---

## 🌏 多縣市部署

本系統設計為**可輕鬆移植至其他縣市消防局**！只需修改 `config.toml` 設定檔：

```toml
[agency]
name = "花蓮縣消防局"
department = "預防調查科"
phone = "03-8234567"
email = "fire@hualien.gov.tw"

[features]
enable_meal_delivery = true
enable_museum_booking = false  # 停用未使用的功能
enable_ocr = true
```

詳細說明請參考 [消防系統 README](fire_dept_automation/README.md)。

---

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！請先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md) 了解：

- 如何回報 Bug
- 如何提出新功能建議
- Pull Request 流程
- 程式碼風格規範

---

## 📄 授權條款

本專案採用 **MIT License** 授權 - 詳見 [LICENSE](LICENSE) 檔案。

```
Copyright (c) 2026 Swiftarian
```

---

## 📞 聯絡資訊

### 文件資源

- � [消防系統詳細文件](fire_dept_automation/README.md)
- � [志工系統詳細文件](fire_volunteer_management/README.md)
- 📖 [送餐服務使用說明](fire_volunteer_management/MEAL_DELIVERY_GUIDE.md)

### 回報問題

- 🐛 [GitHub Issues](https://github.com/Swiftarian/CivicTech/issues)
- 📧 技術支援：請透過 GitHub Issues 回報

---

## 🙏 致謝

- 感謝臺東縣消防局同仁的需求回饋與測試協助
- 感謝所有開源專案的貢獻者
- 感謝志工社群的持續支持

---

<div align="center">

**打造整合的公私協力防災平台**

✅ 防災教育與宣導 | ✅ 社區資源調度 | ✅ 志工管理與優化 | ✅ 智能文件處理 | ✅ 即時通知系統

---

**最後更新**：2026-01-31 | **專案維護**：[Swiftarian](https://github.com/Swiftarian)

</div>
