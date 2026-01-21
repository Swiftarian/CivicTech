# 開發環境初始化摘要

## 已完成的設置

### ✅ 專案克隆
- 已從 GitHub 克隆專案到本地環境
- 專案路徑: `/home/ubuntu/CivicTech/fire_volunteer_management`

### ✅ 依賴安裝
- 已使用 pnpm 安裝所有依賴套件
- 前端依賴: React 19, TypeScript, Vite, shadcn/ui, Tailwind CSS 4
- 後端依賴: Express 4, tRPC 11, Drizzle ORM, MySQL2
- 開發工具: tsx, vitest, prettier, eslint

### ✅ TypeScript 型別檢查
- 已執行 `pnpm check`，無型別錯誤
- 專案程式碼結構完整

### ✅ 文件建立
已建立以下開發文件：

1. **DEVELOPMENT_SETUP.md** - 完整的開發環境設置指南
   - 環境需求說明
   - 詳細安裝步驟
   - 環境變數配置說明
   - 資料庫設置指南
   - 開發指令參考
   - 專案結構說明
   - 常見問題解決

2. **.env.example** - 環境變數範例檔案
   - 資料庫連線配置
   - JWT 認證設定
   - OAuth 設定
   - AWS S3 設定
   - Email/SMS/LINE 通知設定

3. **scripts/setup-dev.sh** - 自動化設置腳本
   - 環境檢查（Node.js, pnpm, MySQL）
   - 依賴安裝
   - 環境變數檔案建立
   - TypeScript 型別檢查

## 專案資訊

### 技術架構
**前端**
- React 19 + TypeScript
- Wouter (路由)
- TanStack Query (狀態管理)
- tRPC 11 (API 通訊)
- shadcn/ui + Tailwind CSS 4 (UI)

**後端**
- Express 4 + Node.js 22
- tRPC 11 (端到端型別安全)
- Drizzle ORM (資料庫 ORM)
- MySQL/TiDB (資料庫)
- Manus OAuth + JWT (認證)

**開發工具**
- Vite (建置工具)
- Vitest (測試框架)
- Prettier (程式碼格式化)

### 資料庫結構
系統包含 11 個資料表：

**核心模組**
- users (使用者資料)
- volunteers (志工資料)
- notifications (系統通知)

**導覽預約模組**
- bookings (預約記錄)
- schedules (志工排班表)
- attendances (打卡記錄)
- leaveRequests (換班/請假申請)

**案件查詢模組**
- cases (案件申請表)
- caseProgress (案件進度記錄)

**送餐服務模組**
- mealDeliveries (送餐任務表)
- deliveryTracking (路徑追蹤記錄)

### 使用者角色
- **admin** (管理員): 完整系統管理權限
- **volunteer** (志工): 查看班表、打卡、送餐任務
- **user** (一般使用者): 建立預約、查詢案件

## 下一步操作

### 1. 配置環境變數 (必要)
```bash
# 複製環境變數範例檔案
cp .env.example .env

# 編輯 .env 檔案，填入必要資訊
nano .env  # 或使用其他編輯器
```

**必填項目**:
- `DATABASE_URL`: MySQL 資料庫連線字串
- `JWT_SECRET`: JWT 簽章密鑰（建議使用隨機字串）
- `VITE_APP_ID`: Manus OAuth 應用程式 ID
- `OAUTH_SERVER_URL`: OAuth 伺服器網址

### 2. 設置資料庫 (必要)
```bash
# 連線到 MySQL 並建立資料庫
mysql -u root -p
CREATE DATABASE taitung_disaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 執行資料庫遷移
pnpm db:push
```

### 3. 啟動開發伺服器
```bash
# 啟動開發模式（熱重載）
pnpm dev

# 開發伺服器會在 http://localhost:3000 啟動
```

### 4. 驗證設置
開啟瀏覽器訪問 `http://localhost:3000`，確認：
- 首頁正常顯示
- 可以瀏覽公開頁面
- 登入功能正常運作

## 常用開發指令

```bash
# 開發模式
pnpm dev

# 建置生產版本
pnpm build

# 啟動生產伺服器
pnpm start

# TypeScript 型別檢查
pnpm check

# 程式碼格式化
pnpm format

# 執行測試
pnpm test

# 資料庫操作
pnpm db:push      # 推送 schema 變更
pnpm db:studio    # 開啟資料庫 GUI
```

## 專案目錄結構

```
fire_volunteer_management/
├── client/                    # 前端程式碼
│   ├── src/
│   │   ├── components/       # React 組件
│   │   ├── pages/           # 頁面組件
│   │   ├── contexts/        # React Contexts
│   │   ├── hooks/           # 自訂 Hooks
│   │   └── lib/             # 工具函數
├── server/                   # 後端程式碼
│   ├── _core/               # 核心功能
│   ├── db.ts                # 資料庫查詢
│   └── routers.ts           # tRPC 路由
├── drizzle/                 # 資料庫相關
│   └── schema.ts            # 資料庫結構
├── docs/                    # 文件目錄
├── scripts/                 # 工具腳本
└── shared/                  # 共用程式碼
```

## 相關文件

- **DEVELOPMENT_SETUP.md** - 完整開發環境設置指南
- **docs/README.md** - 專案總覽與功能說明
- **docs/TEST_ACCOUNTS.md** - 測試帳號資訊
- **docs/MEAL_DELIVERY_GUIDE.md** - 送餐服務使用說明
- **docs/RAILWAY_DEPLOYMENT.md** - 部署指南

## 需要協助？

如遇到問題，請參考：
1. **DEVELOPMENT_SETUP.md** 中的「常見問題」章節
2. 專案 GitHub Issues: https://github.com/Swiftarian/CivicTech/issues
3. 聯絡開發者: huanchenlin@gmail.com

---

**初始化完成時間**: 2026-01-21  
**專案版本**: 1.0.0  
**Node.js 版本**: 22.13.0  
**pnpm 版本**: 10.4.1
