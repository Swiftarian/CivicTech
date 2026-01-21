# 台東防災館綜合管理系統 - 原始碼說明

**專案名稱**：taitung-disaster-system  
**打包日期**：2025-12-08  
**版本**：dc79592e

---

## 檔案內容

此壓縮檔包含台東防災館綜合管理系統的完整原始碼，已排除以下檔案：

- `node_modules/` - Node.js套件（需重新安裝）
- `.git/` - Git版本控制資料
- `dist/`, `build/`, `.next/` - 編譯產出檔案
- `.env`, `.env.local` - 環境變數檔案（包含敏感資訊）
- `*.log` - 日誌檔案

---

## 系統需求

### 開發環境

- **Node.js**：22.13.0 或以上
- **pnpm**：8.0.0 或以上
- **資料庫**：MySQL 8.0 或 TiDB Cloud

### 作業系統

- macOS、Linux、Windows（需WSL2）

---

## 安裝步驟

### 1. 解壓縮檔案

```bash
tar -xzf taitung-disaster-system-source-20251208.tar.gz
cd taitung-disaster-system
```

### 2. 安裝相依套件

```bash
pnpm install
```

### 3. 設定環境變數

複製 `.env.example` 為 `.env` 並填入必要的環境變數：

```bash
cp .env.example .env
```

**必要的環境變數**：

```env
# 資料庫連線
DATABASE_URL=mysql://user:password@host:port/database

# JWT密鑰
JWT_SECRET=your-secret-key

# Manus OAuth（如果使用Manus平台）
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Email SMTP設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# LINE Messaging API（選用）
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-access-token
LINE_BOT_BASIC_ID=@your-bot-id

# Twilio SMS（選用）
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# 測試登入功能（生產環境請設為false）
ENABLE_TEST_LOGIN=true
```

### 4. 初始化資料庫

```bash
# 推送資料庫schema
pnpm db:push

# 或使用migration（推薦）
pnpm db:generate
pnpm db:migrate
```

### 5. 啟動開發伺服器

```bash
pnpm dev
```

開發伺服器會在 http://localhost:3000 啟動。

---

## 專案結構

```
taitung-disaster-system/
├── client/                 # 前端程式碼
│   ├── src/
│   │   ├── pages/         # 頁面組件
│   │   ├── components/    # UI組件
│   │   ├── lib/           # 工具函數
│   │   └── App.tsx        # 路由設定
│   └── public/            # 靜態資源
├── server/                # 後端程式碼
│   ├── routers.ts         # tRPC路由
│   ├── db.ts              # 資料庫查詢函數
│   └── _core/             # 核心功能
├── drizzle/               # 資料庫schema
│   └── schema.ts          # 資料表定義
├── shared/                # 共用程式碼
└── package.json           # 專案設定
```

---

## 主要功能模組

### 1. 使用者認證系統

- Manus OAuth登入
- 測試登入功能（開發用）
- 角色權限管理（管理員、義工、一般使用者）

### 2. 導覽預約管理

- 團體預約（20-50人）
- 個人預約（1-19人）
- 預約查詢功能
- Email通知和提醒

### 3. 志工管理系統

- 志工資料管理
- 排班管理
- 請假申請和審核
- 服務時數統計

### 4. 送餐服務系統

- 送餐任務建立和指派
- 義工送餐介面
- QR Code和驗證碼確認
- GPS路徑追蹤
- LINE和SMS通知

### 5. 案件管理系統

- 案件申請
- 進度查詢
- 狀態管理

---

## 測試帳號

系統提供測試登入功能（需設定 `ENABLE_TEST_LOGIN=true`）：

| 角色 | Email | 密碼 |
|------|-------|------|
| 管理員 | jacky.hsieh@insight.ntu.edu.tw | SecurityTest2024! |
| 管理員 | chelsea.juan@udngroup.com.tw | SecurityTest2024! |
| 義工 | vol1@taitung.gov.tw | Volunteer2024! |
| 義工 | vol2@taitung.gov.tw | Volunteer2024! |

**測試登入頁面**：http://localhost:3000/test-login

---

## 開發指令

```bash
# 安裝相依套件
pnpm install

# 啟動開發伺服器
pnpm dev

# 建置生產版本
pnpm build

# 啟動生產伺服器
pnpm start

# 執行測試
pnpm test

# 資料庫操作
pnpm db:push      # 推送schema到資料庫
pnpm db:generate  # 產生migration檔案
pnpm db:migrate   # 執行migration
pnpm db:studio    # 開啟Drizzle Studio

# 程式碼檢查
pnpm lint
pnpm type-check
```

---

## 部署說明

### 使用Manus平台部署（推薦）

1. 在Manus平台建立新專案
2. 上傳程式碼或連結GitHub倉庫
3. 設定環境變數
4. 點擊「發佈」按鈕

### 使用其他平台部署

系統支援部署到以下平台：

- **Vercel**：適合前端部署
- **Railway**：支援全端部署
- **Render**：支援全端部署
- **Heroku**：支援全端部署

詳細部署步驟請參考 `DEPLOYMENT_GUIDE.md`。

---

## 技術棧

### 前端

- **React 19** - UI框架
- **Tailwind CSS 4** - 樣式框架
- **shadcn/ui** - UI組件庫
- **tRPC** - 型別安全的API
- **Wouter** - 路由管理

### 後端

- **Express 4** - Web框架
- **tRPC 11** - API框架
- **Drizzle ORM** - 資料庫ORM
- **MySQL / TiDB** - 資料庫

### 整合服務

- **LINE Messaging API** - LINE通知
- **Twilio** - SMS簡訊
- **Google Maps API** - 地圖和導航
- **Nodemailer** - Email發送

---

## 相關文件

- `README.md` - 專案說明
- `MEAL_DELIVERY_TEST_GUIDE.md` - 送餐系統測試流程
- `MEAL_DELIVERY_GUIDE.md` - 送餐服務使用說明
- `LINE_INTEGRATION.md` - LINE整合說明
- `SMS_TEST_GUIDE.md` - SMS簡訊測試說明
- `TEST_ACCOUNTS.md` - 測試帳號說明
- `DEPLOYMENT_GUIDE.md` - 部署指南

---

## 授權

此專案為台東防災館專屬系統，未經授權不得使用或散布。

---

## 技術支援

如有任何問題，請聯絡：

**系統管理員**：EDDIE (huanchenlin@gmail.com)

**開發團隊**：Manus AI

---

**文件結束**
