# 台東防災館綜合管理系統 - 資安掃描資訊

## 系統基本資訊

### 專案名稱

台東防災館綜合管理系統 (Taitung Disaster Management System)

### 系統域名

- 正式環境: https://taitungaibookingsystem.cc
- 備用網址: https://3000-il1io6hgxt6mik0thc87e-9837adb0.manus-asia.computer

### 系統版本

- 版本號: 1.0.0
- 最後更新: 2024年11月

---

## 技術架構

### 前端技術棧

- **框架**: React 19
- **建置工具**: Vite 7
- **UI框架**: Tailwind CSS 4
- **路由**: Wouter
- **狀態管理**: React Query (tRPC)
- **表單處理**: React Hook Form + Zod

### 後端技術棧

- **運行環境**: Node.js 22
- **框架**: Express 4
- **API層**: tRPC 11
- **資料庫**: MySQL/TiDB (Drizzle ORM)
- **認證**: Manus OAuth + JWT
- **Session**: Cookie-based (httpOnly, secure, sameSite)

### 第三方服務整合

- **Email**: SMTP (Nodemailer)
- **SMS**: Twilio
- **地圖**: Google Maps API (透過Manus代理)
- **檔案儲存**: AWS S3 (透過Manus)
- **AI**: OpenAI API (透過Manus)

---

## 測試帳號資訊

### 管理員帳號（完整權限）

**登入方式：測試專用登入功能**

為了方便資安掃描測試，系統已建立測試專用的直接登入功能：

**測試登入頁面：**
https://taitungaibookingsystem.cc/test-login

**測試帳號1：**

```
Email: jacky.hsieh@insight.ntu.edu.tw
密碼: SecurityTest2024!
角色: 管理員 (admin)
```

**測試帳號2：**

```
Email: chelsea.juan@udngroup.com.tw
密碼: SecurityTest2024!
角色: 管理員 (admin)
```

**重要說明：**

- 此功能僅供資安掃描測試使用
- 測試完成後將被移除
- 兩個帳號均具備完整管理員權限
- 可存取所有系統功能和資料
- 請勿刪除或修改重要資料
- 測試完成後請通知我們清理測試資料

---

## 系統功能模組

### 1. 預約管理系統

- **路徑**: `/bookings`
- **功能**:
  - 團體預約管理（20人以上）
  - 一般民眾預約（1-19人）
  - 預約審核流程
  - Email通知
  - 預約提醒排程

### 2. 志工管理系統

- **路徑**: `/volunteers`
- **功能**:
  - 志工資料CRUD
  - Excel批量匯入
  - 請假管理
  - 績效統計

### 3. 送餐服務系統

- **路徑**: `/meal-delivery`
- **功能**:
  - 送餐任務建立
  - 志工送餐追蹤
  - GPS定位記錄
  - QR Code簽收
  - SMS通知

### 4. 案件查詢系統

- **路徑**: `/case-search`
- **功能**:
  - 多條件搜尋
  - 地圖視覺化
  - 統計分析

### 5. 送餐驗證系統

- **路徑**: `/confirm-receipt/:id`
- **功能**:
  - 收餐人確認
  - 驗證序號輸入
  - GPS位置記錄

### 6. 管理員後台

- **路徑**: `/admin/*`
- **功能**:
  - 系統設定
  - 用戶管理
  - Email測試
  - SMS測試
  - 資料庫管理

---

## API端點清單

### 認證相關

- `GET /api/oauth/callback` - OAuth回調處理
- `POST /api/trpc/auth.me` - 取得當前用戶資訊
- `POST /api/trpc/auth.logout` - 登出

### 預約管理

- `POST /api/trpc/bookings.create` - 建立預約
- `POST /api/trpc/bookings.list` - 查詢預約列表
- `POST /api/trpc/bookings.approve` - 審核預約
- `POST /api/trpc/bookings.cancel` - 取消預約

### 志工管理

- `POST /api/trpc/volunteers.create` - 新增志工
- `POST /api/trpc/volunteers.list` - 查詢志工列表
- `POST /api/trpc/volunteers.update` - 更新志工資料
- `POST /api/trpc/volunteers.delete` - 刪除志工
- `POST /api/trpc/volunteers.importFromExcel` - Excel匯入

### 送餐服務

- `POST /api/trpc/mealDeliveries.create` - 建立送餐任務
- `POST /api/trpc/mealDeliveries.list` - 查詢送餐列表
- `POST /api/trpc/mealDeliveries.confirmReceipt` - 確認收餐
- `POST /api/trpc/mealDeliveries.getDeliveryDetails` - 取得送餐詳情

### 系統管理

- `POST /api/trpc/system.notifyOwner` - 系統通知
- `POST /api/trpc/emailTest.sendTest` - Email測試
- `POST /api/trpc/smsTest.testDeliveryNotification` - SMS測試

---

## 安全措施說明

### 認證與授權

- **OAuth 2.0**: 使用Manus OAuth進行身份驗證
- **JWT Token**: Session管理使用JWT，存儲在httpOnly cookie中
- **角色權限**: 區分admin和user角色，API層面進行權限檢查
- **CSRF保護**: Cookie設定sameSite=none, secure=true

### 資料保護

- **輸入驗證**: 使用Zod進行所有輸入資料驗證
- **SQL注入防護**: 使用Drizzle ORM參數化查詢
- **XSS防護**: React自動轉義輸出，Markdown使用sanitize
- **敏感資料**: 環境變數存儲API金鑰，不提交到版本控制

### 網路安全

- **HTTPS**: 強制使用HTTPS連線
- **CORS**: 設定適當的CORS政策
- **Rate Limiting**: API請求頻率限制（待實作）
- **Content Security Policy**: CSP headers（待實作）

### 檔案上傳

- **檔案類型驗證**: 限制上傳檔案類型（Excel, 圖片）
- **檔案大小限制**: 限制上傳檔案大小
- **檔案掃描**: 上傳前進行基本檢查
- **儲存隔離**: 使用S3儲存，不直接存取本地檔案系統

### 日誌與監控

- **操作日誌**: 記錄重要操作（Email發送、SMS發送）
- **錯誤日誌**: 記錄系統錯誤和異常
- **存取日誌**: 記錄API存取（待強化）

---

## 已知限制與待改進項目

### 安全性待改進

1. **Rate Limiting**: 尚未實作API請求頻率限制
2. **CSP Headers**: 尚未設定Content Security Policy
3. **CAPTCHA**: 公開表單未加入驗證碼機制
4. **密碼政策**: OAuth登入，無自訂密碼政策
5. **Session過期**: Session過期時間可能需要調整

### 功能性限制

1. **檔案上傳**: 檔案大小限制為10MB
2. **並發處理**: 高並發場景未經壓力測試
3. **資料備份**: 自動備份機制待建立
4. **災難復原**: DR計畫待完善

### 第三方依賴

1. **Manus平台**: 依賴Manus提供的OAuth、S3、AI服務
2. **Twilio SMS**: SMS發送依賴Twilio（台灣號碼有限制）
3. **Google Maps**: 地圖功能依賴Google Maps API

---

## 測試建議

### Fortify源碼掃描重點

1. **SQL注入**: 檢查資料庫查詢是否安全
2. **XSS漏洞**: 檢查輸出是否正確轉義
3. **路徑遍歷**: 檢查檔案操作是否安全
4. **敏感資料**: 檢查是否有硬編碼的密碼或金鑰
5. **加密強度**: 檢查加密演算法是否安全

### Acunetix弱點掃描重點

1. **認證繞過**: 測試未授權存取
2. **Session管理**: 測試Session劫持和固定
3. **CSRF攻擊**: 測試跨站請求偽造
4. **檔案上傳**: 測試惡意檔案上傳
5. **API安全**: 測試API端點的安全性

### 測試注意事項

1. **資料庫**: 測試環境使用獨立資料庫，可隨意測試
2. **第三方服務**: Email和SMS會實際發送，請注意測試量
3. **檔案儲存**: S3儲存空間有限，請勿上傳大量檔案
4. **效能測試**: 建議使用測試環境，避免影響正式服務

---

## 聯絡資訊

### 技術負責人

- **姓名**: （請填寫）
- **Email**: （請填寫）
- **電話**: （請填寫）

### 資安掃描聯絡人

- **Acky Hsieh**: acky.hsieh@insight.ntu.edu.tw
- **Chelsea Juan**: Chelsea.juan@udngroup.com.tw

### 掃描時程

- **源碼掃描**: Fortify
- **弱點掃描**: Acunetix
- **預計完成**: （請填寫）

---

## 附件清單

1. **原始碼壓縮檔**: `taitung-disaster-system-source.zip` (1.3MB)
2. **資料庫Schema**: 見 `drizzle/schema.ts`
3. **API文件**: 見 `server/routers.ts`
4. **環境變數範例**: 見 `.env.example`（如有）
5. **部署文件**: 見 `RAILWAY_DEPLOYMENT.md`

---

## 版本歷史

- **v1.0.0** (2024-11-26): 初始版本，包含所有核心功能
- 預約管理系統
- 志工管理系統
- 送餐服務系統
- SMS通知整合
- Email通知整合

---

**文件更新日期**: 2024年11月26日  
**文件版本**: 1.0  
**準備人**: Manus AI Assistant
