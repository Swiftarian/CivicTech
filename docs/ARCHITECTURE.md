# 🏛️ CivicTech System Architecture

**[English](ARCHITECTURE_EN.md)** | 繁體中文

> 本文件詳細說明 CivicTech 公私協力防災整合系統的技術架構、子系統組成與技術棧。

---

## 📊 系統總覽

CivicTech 採用 **Monorepo** 架構，整合兩個獨立但互補的子系統：

```mermaid
graph TB
    subgraph CivicTech["🏛️ CivicTech 公私協力防災整合平台"]
        direction TB
        
        subgraph FD["🔥 消防申報自動化系統<br/>fire_dept_automation"]
            FD_UI[Streamlit Web UI]
            FD_BE[Python 3.12+ Backend]
            FD_DB[(SQLite)]
        end
        
        subgraph VM["👥 志工管理系統<br/>fire_volunteer_management"]
            VM_UI[React 19 + TypeScript]
            VM_API[tRPC 11 API Layer]
            VM_BE[Express 4 + Node.js 22]
            VM_DB[(MySQL / TiDB)]
        end
        
        subgraph Shared["🔧 共用基礎設施"]
            PKG[pnpm / uv]
            HOOKS[Husky + Lint-Staged]
            LINT[Prettier + ESLint]
        end
    end
    
    FD_UI --> FD_BE
    FD_BE --> FD_DB
    
    VM_UI --> VM_API
    VM_API --> VM_BE
    VM_BE --> VM_DB
    
    style FD fill:#ff6b35,color:#fff
    style VM fill:#4ecdc4,color:#fff
    style Shared fill:#2c3e50,color:#fff
```

---

## 🔥 消防申報自動化系統

### 系統架構圖

```mermaid
graph TB
    subgraph Frontend["📱 前端介面"]
        HOME[home.py<br/>首頁入口]
        P1[1_防災館預約]
        P2[2_社區送餐]
        P3[3_民眾申辦查詢]
        P4[4_案件審核]
        P5[5_自動比對系統]
    end
    
    subgraph Backend["⚙️ 業務邏輯層"]
        AUTH[auth.py<br/>身份驗證]
        UTILS[utils.py<br/>工具函式]
        DB_MGR[db_manager.py<br/>資料庫操作]
        AI[ai_engine.py<br/>AI/OCR 引擎]
        CONFIG[config_loader.py<br/>設定載入]
    end
    
    subgraph Data["💾 資料層"]
        SQLITE[(cases.db<br/>SQLite)]
        UPLOADS[/uploads/<br/>檔案儲存/]
    end
    
    subgraph External["🌐 外部服務"]
        OCR1[Tesseract OCR]
        OCR2[PaddleOCR]
        EMAIL[SMTP Email]
    end
    
    subgraph Config["📁 設定檔"]
        TOML[config.toml<br/>系統設定]
        SECRETS[secrets.toml<br/>機密資訊]
    end
    
    HOME --> P1 & P2 & P3 & P4 & P5
    P1 & P2 & P3 & P4 & P5 --> AUTH
    AUTH --> DB_MGR
    P5 --> AI
    AI --> OCR1 & OCR2
    UTILS --> EMAIL
    DB_MGR --> SQLITE
    P1 & P2 & P3 --> UPLOADS
    CONFIG --> TOML
    AUTH --> SECRETS
    
    style Frontend fill:#FF4B4B,color:#fff
    style Backend fill:#1f77b4,color:#fff
    style Data fill:#2ca02c,color:#fff
    style External fill:#9467bd,color:#fff
```

### 技術棧

| 類別 | 技術 | 版本 | 說明 |
|------|------|------|------|
| **框架** | Streamlit | 1.31+ | Python Web 應用框架 |
| **語言** | Python | 3.12+ | 主要程式語言 |
| **資料庫** | SQLite | 3.x | 輕量級嵌入式資料庫 |
| **OCR** | Tesseract | 5.x | 開源 OCR 引擎 |
| **OCR** | PaddleOCR | 2.x | 高精度中文 OCR |
| **PDF** | PyMuPDF | 1.x | PDF 處理與轉換 |
| **資料處理** | Pandas | 2.x | 資料分析與處理 |
| **加密** | bcrypt | 4.x | 密碼雜湊加密 |
| **圖像** | Pillow | 10.x | 圖像處理 |
| **郵件** | smtplib | - | SMTP 郵件發送 |

### 功能模組

```mermaid
mindmap
  root((消防申報系統))
    消防檢修申報
      線上表單填寫
      文件上傳
      進度查詢
      Email 通知
    OCR 自動比對
      申報書辨識
      資料比對
      差異報告
    社區送餐服務
      餐食配送管理
      GPS 路線追蹤
      拍照驗證
      核銷報表
    防災教育館預約
      團體預約
      個人預約
      時段管理
      通知提醒
    案件審核管理
      案件總覽
      批量操作
      狀態更新
      稽核紀錄
```

### 資料庫結構

```mermaid
erDiagram
    CASES {
        int id PK
        string applicant_name
        string applicant_email
        string applicant_phone
        string line_id
        string place_name
        string place_address
        string file_path
        string status
        datetime submission_date
        string review_notes
        string assigned_to
    }
    
    USERS {
        int id PK
        string username UK
        string password_salt
        string password_hash
        string role
        string email
        datetime created_at
        datetime last_login
    }
    
    AUDIT_LOGS {
        int log_id PK
        string username FK
        string action
        text details
        datetime timestamp
    }
    
    USERS ||--o{ AUDIT_LOGS : creates
    USERS ||--o{ CASES : reviews
```

---

## 👥 志工管理系統

### 系統架構圖

```mermaid
graph TB
    subgraph Client["📱 前端 Client"]
        REACT[React 19]
        TS[TypeScript 5]
        UI[shadcn/ui]
        TW[Tailwind CSS 4]
        TQ[TanStack Query]
        WOUTER[Wouter Router]
    end
    
    subgraph API["🔌 API 層"]
        TRPC[tRPC 11<br/>端到端型別安全]
    end
    
    subgraph Server["⚙️ 後端 Server"]
        EXPRESS[Express 4]
        NODE[Node.js 22]
        DRIZZLE[Drizzle ORM]
    end
    
    subgraph Database["💾 資料庫"]
        MYSQL[(MySQL / TiDB)]
    end
    
    subgraph External["🌐 外部服務"]
        S3[AWS S3<br/>檔案儲存]
        OAUTH[OAuth Server<br/>身份驗證]
        SMS[SMS Gateway<br/>簡訊通知]
    end
    
    REACT --> TS
    TS --> UI & TW & TQ
    TQ --> TRPC
    TRPC --> EXPRESS
    EXPRESS --> NODE
    NODE --> DRIZZLE
    DRIZZLE --> MYSQL
    NODE --> S3 & OAUTH & SMS
    
    style Client fill:#61DAFB,color:#000
    style API fill:#398CCB,color:#fff
    style Server fill:#339933,color:#fff
    style Database fill:#4479A1,color:#fff
    style External fill:#FF9900,color:#000
```

### 技術棧

| 類別 | 技術 | 版本 | 說明 |
|------|------|------|------|
| **前端框架** | React | 19 | 使用者介面函式庫 |
| **型別系統** | TypeScript | 5.x | 靜態型別檢查 |
| **UI 組件** | shadcn/ui | - | 可自訂 UI 組件庫 |
| **CSS 框架** | Tailwind CSS | 4 | Utility-first CSS |
| **狀態管理** | TanStack Query | 5.x | 伺服器狀態管理 |
| **路由** | Wouter | 3.x | 輕量級路由 |
| **API** | tRPC | 11 | 端到端型別安全 API |
| **後端框架** | Express | 4.x | Node.js Web 框架 |
| **執行環境** | Node.js | 22.x | JavaScript 執行環境 |
| **ORM** | Drizzle | - | TypeScript ORM |
| **資料庫** | MySQL/TiDB | 8.x | 關聯式資料庫 |
| **檔案儲存** | AWS S3 | - | 雲端物件儲存 |
| **測試** | Vitest | 2.x | 單元測試框架 |

### 功能模組

```mermaid
mindmap
  root((志工管理系統))
    公開功能
      首頁展示
      團體預約
      個人預約
      預約查詢
      交通指引
    志工功能
      個人班表
      打卡簽到
      送餐任務
      請假換班
      時數統計
    管理功能
      預約管理
      志工管理
      排班管理
      送餐管理
      統計儀表板
    送餐服務
      任務建立
      志工指派
      路徑追蹤
      QR 驗證
      送達確認
```

### 資料庫結構

```mermaid
erDiagram
    USERS {
        int id PK
        string manus_id UK
        string email
        string name
        string role
        string avatar_url
        datetime created_at
    }
    
    VOLUNTEERS {
        int id PK
        int user_id FK
        string phone
        string emergency_contact
        string skills
        boolean is_active
    }
    
    BOOKINGS {
        int id PK
        string booking_number UK
        string type
        string contact_name
        string contact_phone
        date booking_date
        string time_slot
        int group_size
        string status
    }
    
    SCHEDULES {
        int id PK
        int volunteer_id FK
        date schedule_date
        string shift_type
        string status
    }
    
    MEAL_DELIVERIES {
        int id PK
        int volunteer_id FK
        string recipient_name
        string recipient_address
        string status
        string qr_code
        datetime delivered_at
    }
    
    ATTENDANCES {
        int id PK
        int volunteer_id FK
        int schedule_id FK
        datetime check_in
        datetime check_out
        string location
    }
    
    USERS ||--o| VOLUNTEERS : has
    VOLUNTEERS ||--o{ SCHEDULES : assigned
    VOLUNTEERS ||--o{ MEAL_DELIVERIES : handles
    VOLUNTEERS ||--o{ ATTENDANCES : records
    SCHEDULES ||--o{ ATTENDANCES : tracks
```

---

## 🔧 共用基礎設施

### 開發工具鏈

```mermaid
graph LR
    subgraph PackageManagers["📦 套件管理"]
        PNPM[pnpm 9.x<br/>Node.js]
        UV[uv<br/>Python]
    end
    
    subgraph GitHooks["🪝 Git Hooks"]
        HUSKY[Husky 9.x]
        LINT_STAGED[Lint-Staged]
    end
    
    subgraph CodeQuality["✨ 程式碼品質"]
        PRETTIER[Prettier 3.x<br/>格式化]
        ESLINT[ESLint<br/>JS/TS Lint]
    end
    
    subgraph CI["🔄 CI/CD"]
        GITHUB[GitHub Actions]
    end
    
    PNPM --> HUSKY
    UV --> HUSKY
    HUSKY --> LINT_STAGED
    LINT_STAGED --> PRETTIER & ESLINT
    PRETTIER & ESLINT --> GITHUB
    
    style PackageManagers fill:#f39c12,color:#000
    style GitHooks fill:#9b59b6,color:#fff
    style CodeQuality fill:#3498db,color:#fff
    style CI fill:#2ecc71,color:#000
```

### 專案目錄結構

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
│   ├── db_manager.py               # 資料庫操作
│   ├── ai_engine.py                # AI/OCR 引擎
│   ├── utils.py                    # 工具函式
│   ├── config.toml                 # 系統設定
│   ├── pyproject.toml              # Python 依賴
│   └── tests/                      # 測試檔案
│
├── 📂 fire_volunteer_management/   # 👥 志工管理系統
│   ├── client/                     # 前端 React 應用
│   │   └── src/
│   │       ├── pages/              # 頁面組件
│   │       ├── components/         # UI 組件
│   │       └── hooks/              # 自訂 Hooks
│   ├── server/                     # 後端 Express + tRPC
│   ├── drizzle/                    # 資料庫 Schema
│   ├── shared/                     # 共用型別
│   ├── package.json                # Node.js 依賴
│   └── vitest.config.ts            # 測試設定
│
├── 📂 docs/                        # 📚 文件
│   ├── ARCHITECTURE.md             # 系統架構（本文件）
│   ├── QUICK_REFERENCE.md          # 快速參考
│   └── SYSTEM_INTEGRATION.md       # 系統整合
│
├── start-all.ps1                   # 整合啟動腳本
├── package.json                    # Monorepo 設定
├── .husky/                         # Git Hooks
└── .prettierrc                     # Prettier 設定
```

---

## 🚀 部署架構

### 開發環境

```mermaid
graph LR
    DEV[開發者] --> |localhost:8501| FD[消防申報系統<br/>Streamlit]
    DEV --> |localhost:3000| VM[志工管理系統<br/>Vite Dev Server]
    FD --> FD_DB[(SQLite<br/>本機檔案)]
    VM --> VM_DB[(MySQL<br/>本機/Docker)]
```

### 生產環境

```mermaid
graph TB
    Users[使用者] --> LB[負載平衡器]
    
    LB --> FD_PROD[消防申報系統<br/>Docker Container]
    LB --> VM_PROD[志工管理系統<br/>Docker Container]
    
    FD_PROD --> FD_DB_PROD[(SQLite<br/>Volume Mount)]
    VM_PROD --> VM_DB_PROD[(TiDB Cloud<br/>或 MySQL)]
    VM_PROD --> S3_PROD[AWS S3<br/>檔案儲存]
    
    style Users fill:#e74c3c,color:#fff
    style LB fill:#3498db,color:#fff
    style FD_PROD fill:#ff6b35,color:#fff
    style VM_PROD fill:#4ecdc4,color:#fff
```

---

## 📝 更新紀錄

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2026-01-31 | 1.0.0 | 初始版本 |

---

<div align="center">

**CivicTech - 打造整合的公私協力防災平台**

[← 返回 README](../README.md) | [系統整合說明 →](SYSTEM_INTEGRATION.md)

</div>
