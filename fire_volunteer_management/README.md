# 台東防災館綜合管理系統

台東防災館綜合管理系統是一個全端網站應用程式，提供導覽預約管理、案件查詢與進度通知、送餐服務與路徑追蹤等功能，支援管理員、志工和民眾三種使用者角色。

## 🌟 主要功能

### 公開功能（所有訪客可用）
- **首頁展示**：輪播圖、服務項目介紹、參訪流程說明
- **團體預約**：20-50人團體預約服務
- **一般民眾預約**：1-19人個人/家庭預約服務
- **預約查詢**：透過預約編號查詢預約狀態
- **案件查詢**：透過案件編號查詢案件進度
- **交通指引**：館址資訊、交通路線、大眾運輸指南

### 管理功能（需登入）
- **管理員後台**：
  - 預約管理（審核、指派志工、狀態更新）
  - 志工管理（新增、查詢、排班）
  - 案件管理（建立、追蹤、進度更新）
  - 送餐服務管理（建立任務、指派志工、QR Code 驗證）
  - 請假/換班審核
  - 統計儀表板

- **志工功能**（規劃中）：
  - 個人班表查看
  - 打卡簽到/簽退
  - 送餐任務管理
  - 服務時數統計

## 🛠️ 技術架構

### 前端
- **框架**：React 19 + TypeScript
- **路由**：Wouter
- **UI 組件**：shadcn/ui + Tailwind CSS 4
- **狀態管理**：TanStack Query (React Query)
- **API 通訊**：tRPC 11
- **表單處理**：React Hook Form
- **日期處理**：date-fns
- **QR Code**：react-qr-code

### 後端
- **框架**：Express 4 + Node.js
- **API**：tRPC 11（端到端型別安全）
- **認證**：Manus OAuth + JWT
- **資料庫 ORM**：Drizzle ORM
- **資料庫**：MySQL/TiDB
- **檔案儲存**：AWS S3

### 開發工具
- **建置工具**：Vite
- **測試框架**：Vitest
- **程式碼風格**：ESLint + Prettier
- **版本控制**：Git

## 📦 專案結構

```
taitung-disaster-system/
├── client/                 # 前端程式碼
│   ├── public/            # 靜態資源
│   │   └── images/        # 圖片資源
│   ├── src/
│   │   ├── components/    # React 組件
│   │   │   └── ui/        # shadcn/ui 組件
│   │   ├── pages/         # 頁面組件
│   │   ├── contexts/      # React Contexts
│   │   ├── hooks/         # 自訂 Hooks
│   │   ├── lib/           # 工具函數
│   │   ├── App.tsx        # 路由配置
│   │   ├── main.tsx       # 應用程式入口
│   │   └── index.css      # 全域樣式
│   └── index.html         # HTML 模板
├── server/                # 後端程式碼
│   ├── _core/             # 核心功能（OAuth、Context）
│   ├── db.ts              # 資料庫查詢函數
│   ├── routers.ts         # tRPC 路由定義
│   └── *.test.ts          # 單元測試
├── drizzle/               # 資料庫相關
│   └── schema.ts          # 資料庫結構定義
├── storage/               # S3 檔案儲存
├── shared/                # 共用常數和型別
├── MEAL_DELIVERY_GUIDE.md # 送餐服務使用說明
└── package.json           # 專案依賴
```

## 🗄️ 資料庫結構

系統包含 11 個資料表：

### 核心資料表
- **users**：使用者資料（支援 admin、volunteer、user 三種角色）
- **volunteers**：志工資料擴展表
- **notifications**：系統通知

### 導覽預約模組
- **bookings**：預約記錄（團體與個人）
- **schedules**：志工排班表
- **attendances**：打卡記錄
- **leaveRequests**：換班/請假申請

### 案件查詢模組
- **cases**：案件申請表
- **caseProgress**：案件進度記錄

### 送餐服務模組
- **mealDeliveries**：送餐任務表
- **deliveryTracking**：路徑追蹤記錄

## 🚀 快速開始

### 環境需求
- Node.js 22.x
- pnpm 9.x
- MySQL 8.x 或 TiDB

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/Eddycollab/taitung-community.git
cd taitung-community
```

2. **安裝依賴**
```bash
pnpm install
```

3. **配置環境變數**

系統使用 Manus 平台提供的環境變數，包括：
- `DATABASE_URL`：資料庫連線字串
- `JWT_SECRET`：JWT 簽章密鑰
- `VITE_APP_ID`：OAuth 應用程式 ID
- `OAUTH_SERVER_URL`：OAuth 伺服器網址
- 其他 S3、通知等服務的環境變數

4. **初始化資料庫**
```bash
pnpm db:push
```

5. **啟動開發伺服器**
```bash
pnpm dev
```

開發伺服器會在 `http://localhost:3000` 啟動。

### 可用指令

```bash
# 開發模式
pnpm dev

# 建置生產版本
pnpm build

# 啟動生產伺服器
pnpm start

# 執行測試
pnpm test

# 資料庫操作
pnpm db:push      # 推送資料庫結構變更
pnpm db:studio    # 開啟 Drizzle Studio（資料庫 GUI）

# 程式碼檢查
pnpm lint
```

## 👥 使用者角色與權限

### 管理員 (admin)
- 完整的系統管理權限
- 預約審核與志工指派
- 案件管理與進度更新
- 送餐服務管理
- 志工排班與請假審核
- 查看所有統計資料

### 志工 (volunteer)
- 查看個人班表
- 打卡簽到/簽退
- 查看指派的送餐任務
- 申請請假/換班
- 查看個人服務時數

### 一般使用者 (user)
- 建立預約
- 查詢預約狀態
- 建立案件申請
- 查詢案件進度

## 📱 主要頁面

### 公開頁面
- `/` - 首頁
- `/booking/group` - 團體預約
- `/booking/individual` - 一般民眾預約
- `/booking/query` - 預約查詢
- `/case/query` - 案件查詢
- `/traffic` - 交通指引

### 管理頁面（需登入）
- `/admin` - 管理員後台
- `/meal-delivery` - 送餐服務管理
- `/volunteer` - 志工專區（規劃中）

## 🔐 認證流程

系統使用 Manus OAuth 進行身份驗證：

1. 使用者點擊「登入」按鈕
2. 跳轉到 Manus OAuth 登入頁面
3. 使用者完成登入（Google、GitHub 等）
4. 回調到 `/api/oauth/callback`
5. 系統建立 Session Cookie
6. 使用者可以存取受保護的功能

## 📊 API 架構

系統使用 tRPC 提供端到端型別安全的 API：

### 主要 Router
- `auth`：認證相關（me、logout）
- `users`：使用者管理
- `volunteers`：志工管理
- `bookings`：預約管理
- `schedules`：排班管理
- `attendances`：打卡管理
- `leaveRequests`：請假/換班管理
- `cases`：案件管理
- `mealDeliveries`：送餐服務管理
- `notifications`：通知管理

### 權限控制
- `publicProcedure`：公開 API
- `protectedProcedure`：需登入
- `volunteerProcedure`：需志工權限
- `adminProcedure`：需管理員權限

## 🧪 測試

專案包含單元測試，使用 Vitest 框架：

```bash
# 執行所有測試
pnpm test

# 執行特定測試檔案
pnpm test server/bookings.test.ts

# 監看模式
pnpm test --watch
```

測試檔案位於 `server/*.test.ts`。

## 📚 文件

- [送餐服務使用說明](docs/MEAL_DELIVERY_GUIDE.md)
- [快速開始指南](./QUICKSTART.md)（如果存在）

## 🚢 部署

### Manus 平台部署

1. 在 Manus 管理介面點擊「Publish」按鈕
2. 等待部署完成（約 2-5 分鐘）
3. 獲得正式網址：`https://your-project.manus.space`

### 自訂網域

1. 在 Manus 管理介面進入「Settings → Domains」
2. 輸入您的網域名稱
3. 按照指示設定 DNS 記錄
4. 等待驗證完成

## 🔧 開發指南

### 新增功能

1. **更新資料庫結構**
   - 編輯 `drizzle/schema.ts`
   - 執行 `pnpm db:push`

2. **新增 API**
   - 在 `server/db.ts` 新增資料庫查詢函數
   - 在 `server/routers.ts` 新增 tRPC procedure
   - 選擇適當的權限控制

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
- 使用 Prettier 格式化程式碼
- 組件使用 PascalCase 命名
- 函數使用 camelCase 命名

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

本專案採用 MIT 授權條款。

## 👨‍💻 作者

**EDDIE LIN**
- GitHub: [@Eddycollab](https://github.com/Eddycollab)
- Email: huanchenlin@gmail.com

## 🙏 致謝

- 感謝 Manus 平台提供開發和部署服務
- 感謝所有開源專案的貢獻者

## 📞 聯絡資訊

如有任何問題或建議，請透過以下方式聯繫：

- GitHub Issues: https://github.com/Eddycollab/taitung-community/issues
- Email: huanchenlin@gmail.com

---

© 2024 台東防災館綜合管理系統. All rights reserved.
