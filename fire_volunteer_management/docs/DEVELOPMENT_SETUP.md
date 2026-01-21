# 開發環境設置指南

本文件說明如何在本地環境設置並運行台東防災館綜合管理系統（fire_volunteer_management）。

## 環境需求

### 必要軟體版本

- **Node.js**: 22.x（建議使用 22.13.0 或更高版本）
- **pnpm**: 10.x（專案使用 pnpm 作為套件管理工具）
- **MySQL**: 8.x 或 **TiDB**（資料庫系統）
- **Git**: 用於版本控制

### 檢查環境

```bash
node --version   # 應顯示 v22.x.x
pnpm --version   # 應顯示 10.x.x
mysql --version  # 應顯示 8.x.x
```

## 安裝步驟

### 1. 克隆專案

```bash
git clone https://github.com/Swiftarian/CivicTech.git
cd CivicTech/fire_volunteer_management
```

### 2. 安裝依賴套件

```bash
pnpm install
```

此步驟會安裝所有前端和後端依賴，包括：

- React 19 + TypeScript（前端框架）
- Express 4（後端框架）
- tRPC 11（API 通訊）
- Drizzle ORM（資料庫 ORM）
- shadcn/ui + Tailwind CSS 4（UI 組件）

### 3. 配置環境變數

複製環境變數範例檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入必要的環境變數：

#### 必要配置

```env
# 資料庫連線（必填）
DATABASE_URL=mysql://username:password@localhost:3306/taitung_disaster

# JWT 認證（必填）
JWT_SECRET=your-secure-random-string-here

# OAuth 設定（必填）
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://oauth.manus.space
```

#### 選填配置

根據需要啟用的功能，配置以下環境變數：

**AWS S3（檔案上傳功能）**

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=your-bucket-name
```

**Email 通知**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**SMS 通知（Twilio）**

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**LINE 通知**

```env
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret
```

### 4. 設置資料庫

#### 建立資料庫

```bash
# 連線到 MySQL
mysql -u root -p

# 建立資料庫
CREATE DATABASE taitung_disaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 建立使用者（選填）
CREATE USER 'taitung_user'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON taitung_disaster.* TO 'taitung_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 執行資料庫遷移

```bash
pnpm db:push
```

此指令會：

1. 根據 `drizzle/schema.ts` 生成遷移檔案
2. 執行遷移，建立所有資料表

### 5. 啟動開發伺服器

```bash
pnpm dev
```

開發伺服器會在 `http://localhost:3000` 啟動。

## 開發指令

### 常用指令

```bash
# 啟動開發伺服器（熱重載）
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

# 執行測試（監看模式）
pnpm test --watch
```

### 資料庫指令

```bash
# 推送 schema 變更到資料庫
pnpm db:push

# 開啟 Drizzle Studio（資料庫 GUI）
pnpm db:studio
```

## 專案結構說明

```
fire_volunteer_management/
├── client/                    # 前端程式碼
│   ├── src/
│   │   ├── components/       # React 組件
│   │   │   └── ui/          # shadcn/ui 組件
│   │   ├── pages/           # 頁面組件
│   │   ├── contexts/        # React Contexts
│   │   ├── hooks/           # 自訂 Hooks
│   │   ├── lib/             # 工具函數
│   │   ├── App.tsx          # 路由配置
│   │   └── main.tsx         # 應用程式入口
│   └── index.html           # HTML 模板
├── server/                   # 後端程式碼
│   ├── _core/               # 核心功能（OAuth、Context）
│   ├── db.ts                # 資料庫查詢函數
│   ├── routers.ts           # tRPC 路由定義
│   └── *.test.ts            # 單元測試
├── drizzle/                 # 資料庫相關
│   └── schema.ts            # 資料庫結構定義
├── shared/                  # 共用常數和型別
├── docs/                    # 文件目錄
├── public/                  # 靜態資源
├── package.json             # 專案依賴
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── .env                     # 環境變數（不納入版控）
```

## 資料庫結構

系統包含以下主要資料表：

### 核心模組

- **users**: 使用者資料（支援 admin、volunteer、user 三種角色）
- **volunteers**: 志工資料擴展表
- **notifications**: 系統通知

### 導覽預約模組

- **bookings**: 預約記錄（團體與個人）
- **schedules**: 志工排班表
- **attendances**: 打卡記錄
- **leaveRequests**: 換班/請假申請

### 案件查詢模組

- **cases**: 案件申請表
- **caseProgress**: 案件進度記錄

### 送餐服務模組

- **mealDeliveries**: 送餐任務表
- **deliveryTracking**: 路徑追蹤記錄

## 測試帳號

系統提供測試帳號用於開發和測試，詳細資訊請參考 `docs/TEST_ACCOUNTS.md`。

## 開發工作流程

### 新增功能

1. **更新資料庫結構**
   - 編輯 `drizzle/schema.ts`
   - 執行 `pnpm db:push`

2. **新增 API**
   - 在 `server/db.ts` 新增資料庫查詢函數
   - 在 `server/routers.ts` 新增 tRPC procedure
   - 選擇適當的權限控制（publicProcedure、protectedProcedure、adminProcedure）

3. **建立前端頁面**
   - 在 `client/src/pages/` 新增頁面組件
   - 在 `client/src/App.tsx` 註冊路由
   - 使用 `trpc.*.useQuery/useMutation` 呼叫 API

4. **撰寫測試**
   - 在 `server/` 新增 `*.test.ts` 檔案
   - 執行 `pnpm test` 確認測試通過

### 程式碼風格

- 使用 TypeScript 進行型別檢查
- 遵循 ESLint 規則
- 使用 Prettier 格式化程式碼（執行 `pnpm format`）
- 組件使用 PascalCase 命名
- 函數使用 camelCase 命名

## 常見問題

### 1. 資料庫連線失敗

**錯誤訊息**: `Error: connect ECONNREFUSED`

**解決方法**:

- 確認 MySQL 服務正在運行
- 檢查 `.env` 中的 `DATABASE_URL` 是否正確
- 確認資料庫已建立

### 2. pnpm install 失敗

**解決方法**:

```bash
# 清除快取
pnpm store prune

# 重新安裝
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 3. TypeScript 型別錯誤

**解決方法**:

```bash
# 執行型別檢查
pnpm check

# 重新啟動 TypeScript 伺服器（VS Code）
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### 4. 開發伺服器無法啟動

**解決方法**:

- 確認 port 3000 未被佔用
- 檢查環境變數是否正確設置
- 查看終端機錯誤訊息

## 相關文件

- [README.md](./docs/README.md) - 專案總覽
- [TEST_ACCOUNTS.md](./docs/TEST_ACCOUNTS.md) - 測試帳號資訊
- [MEAL_DELIVERY_GUIDE.md](./docs/MEAL_DELIVERY_GUIDE.md) - 送餐服務使用說明
- [RAILWAY_DEPLOYMENT.md](./docs/RAILWAY_DEPLOYMENT.md) - 部署指南

## 技術支援

如有任何問題或建議，請透過以下方式聯繫：

- GitHub Issues: https://github.com/Swiftarian/CivicTech/issues
- Email: huanchenlin@gmail.com

---

© 2024 台東防災館綜合管理系統
