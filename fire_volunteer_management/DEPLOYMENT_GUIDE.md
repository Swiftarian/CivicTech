# Railway 部署完整指南

本指南將協助您將台東防災館綜合管理系統部署到 Railway，並綁定自訂網域 `taitungaibookingsystem.cc`。

---

## 📋 目錄

1. [前置準備](#前置準備)
2. [Railway 帳號設定](#railway-帳號設定)
3. [建立 Railway 專案](#建立-railway-專案)
4. [設定 MySQL 資料庫](#設定-mysql-資料庫)
5. [配置環境變數](#配置環境變數)
6. [部署應用程式](#部署應用程式)
7. [綁定自訂網域](#綁定自訂網域)
8. [資料庫遷移](#資料庫遷移)
9. [驗證部署](#驗證部署)
10. [常見問題](#常見問題)

---

## 前置準備

### 必要條件

- ✅ GitHub 帳號（您的專案已在 GitHub 上）
- ✅ 擁有 `taitungaibookingsystem.cc` 網域的 DNS 控制權
- ✅ Railway 帳號（免費或付費方案）
- ✅ 信用卡（Railway 需要綁定信用卡，但有免費額度）

### 費用估算

**Railway 定價**：
- **免費方案**: $5 USD 免費額度/月（適合測試）
- **Hobby 方案**: $5 USD/月起（適合小型專案）
- **Pro 方案**: $20 USD/月起（適合生產環境）

**預估月費**（Hobby 方案）：
- 應用程式運行: ~$5-10 USD
- MySQL 資料庫: ~$5 USD
- **總計**: 約 $10-15 USD/月

---

## Railway 帳號設定

### 步驟 1: 註冊 Railway 帳號

1. 前往 [Railway.app](https://railway.app)
2. 點擊 **"Login"** 或 **"Start a New Project"**
3. 選擇 **"Login with GitHub"**
4. 授權 Railway 存取您的 GitHub 帳號

### 步驟 2: 綁定信用卡

1. 登入後，前往 [Account Settings](https://railway.app/account)
2. 點擊 **"Billing"** 標籤
3. 點擊 **"Add Payment Method"**
4. 輸入信用卡資訊
5. 選擇方案（建議選擇 **Hobby** 方案）

---

## 建立 Railway 專案

### 步驟 1: 建立新專案

1. 在 Railway Dashboard，點擊 **"New Project"**
2. 選擇 **"Deploy from GitHub repo"**
3. 選擇 **"Swiftarian/CivicTech"** 倉庫
4. Railway 會自動偵測到 `fire_volunteer_management` 目錄

### 步驟 2: 設定專案根目錄

由於您的專案在子目錄中，需要設定根目錄：

1. 在專案設定中，找到 **"Settings"** 標籤
2. 找到 **"Root Directory"** 設定
3. 輸入: `fire_volunteer_management`
4. 點擊 **"Save"**

---

## 設定 MySQL 資料庫

### 步驟 1: 新增 MySQL 服務

1. 在 Railway 專案中，點擊 **"+ New"**
2. 選擇 **"Database"**
3. 選擇 **"Add MySQL"**
4. Railway 會自動建立並啟動 MySQL 資料庫

### 步驟 2: 連接資料庫到應用程式

Railway 會自動將 MySQL 連線資訊注入到應用程式的環境變數中：

- `DATABASE_URL`: 完整的 MySQL 連線字串

**注意**: Railway 會自動提供這個變數，您不需要手動設定。

---

## 配置環境變數

### 步驟 1: 進入環境變數設定

1. 在 Railway 專案中，選擇您的應用程式服務
2. 點擊 **"Variables"** 標籤
3. 點擊 **"+ New Variable"**

### 步驟 2: 添加必要的環境變數

根據 `.env.production.example` 檔案，添加以下變數：

#### 必填變數

| 變數名稱 | 範例值 | 說明 |
|---------|--------|------|
| `NODE_ENV` | `production` | 生產環境標記 |
| `PORT` | `3000` | 應用程式端口（Railway 會自動設定） |
| `JWT_SECRET` | `your-super-secret-jwt-key-min-32-chars` | JWT 簽章密鑰（至少 32 字元）|
| `VITE_APP_ID` | `your-manus-app-id` | Manus OAuth 應用程式 ID |
| `VITE_APP_TITLE` | `台東防災館綜合管理系統` | 應用程式標題 |
| `VITE_APP_LOGO` | `/logo.png` | Logo 路徑 |
| `VITE_OAUTH_PORTAL_URL` | `https://oauth.manus.space` | OAuth 入口網址 |
| `OAUTH_SERVER_URL` | `https://oauth.manus.space` | OAuth 伺服器網址 |
| `VITE_APP_URL` | `https://taitungaibookingsystem.cc` | 您的網域 |
| `APP_URL` | `https://taitungaibookingsystem.cc` | 您的網域 |

#### 選填變數（依需求添加）

**AWS S3（檔案上傳）**：
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

**Email 通知（SMTP）**：
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

**SMS 通知（Twilio）**：
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

**LINE 通知**：
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

### 步驟 3: 儲存變數

添加完所有變數後，Railway 會自動觸發重新部署。

---

## 部署應用程式

### 自動部署

Railway 會在以下情況自動部署：

1. **首次設定完成**
2. **GitHub 推送新代碼**
3. **環境變數變更**

### 手動部署

如需手動觸發部署：

1. 在 Railway 專案中，選擇您的應用程式服務
2. 點擊 **"Deployments"** 標籤
3. 點擊 **"Deploy"** 按鈕

### 監控部署進度

1. 在 **"Deployments"** 標籤中查看即時日誌
2. 等待建置完成（通常需要 3-5 分鐘）
3. 確認狀態顯示為 **"Active"**

---

## 綁定自訂網域

### 步驟 1: 在 Railway 中添加網域

1. 在 Railway 專案中，選擇您的應用程式服務
2. 點擊 **"Settings"** 標籤
3. 找到 **"Domains"** 區塊
4. 點擊 **"+ Custom Domain"**
5. 輸入: `taitungaibookingsystem.cc`
6. 點擊 **"Add Domain"**

### 步驟 2: 獲取 DNS 設定資訊

Railway 會提供 DNS 設定資訊，通常是：

**選項 A: CNAME 記錄**（推薦）
```
Type: CNAME
Name: @（或留空）
Value: <your-app>.up.railway.app
```

**選項 B: A 記錄**
```
Type: A
Name: @（或留空）
Value: <Railway 提供的 IP 位址>
```

### 步驟 3: 設定 DNS

前往您的網域註冊商（購買 taitungaibookingsystem.cc 的地方）：

#### 如果使用 Cloudflare

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇 `taitungaibookingsystem.cc` 網域
3. 前往 **"DNS"** 標籤
4. 刪除現有的 A 記錄（如果有）
5. 添加新的 CNAME 記錄：
   - **Type**: CNAME
   - **Name**: @
   - **Target**: `<your-app>.up.railway.app`（Railway 提供的值）
   - **Proxy status**: 關閉（灰色雲朵）⚠️ 重要！
6. 點擊 **"Save"**

#### 如果使用其他 DNS 服務商

1. 登入您的 DNS 管理介面
2. 找到 DNS 記錄管理
3. 添加 CNAME 記錄（參考上方設定）
4. 儲存變更

### 步驟 4: 等待 DNS 生效

- DNS 變更通常需要 **5-30 分鐘**生效
- 最長可能需要 **24-48 小時**（視 DNS 服務商而定）

### 步驟 5: 驗證網域

1. 在 Railway 中，等待網域狀態變為 **"Active"**
2. Railway 會自動配置 SSL 憑證（Let's Encrypt）
3. 訪問 `https://taitungaibookingsystem.cc` 確認

---

## 資料庫遷移

部署完成後，需要初始化資料庫結構。

### 方法 1: 使用 Railway CLI（推薦）

#### 安裝 Railway CLI

```bash
# macOS / Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex
```

#### 執行遷移

```bash
# 登入 Railway
railway login

# 連接到專案
railway link

# 執行資料庫遷移
railway run pnpm db:push
```

### 方法 2: 使用 Railway Dashboard

1. 在 Railway 專案中，選擇您的應用程式服務
2. 點擊右上角的 **"..."** 選單
3. 選擇 **"Shell"**
4. 在終端機中執行:
   ```bash
   pnpm db:push
   ```

### 方法 3: 使用 MySQL 客戶端

1. 在 Railway 中，選擇 MySQL 服務
2. 點擊 **"Connect"** 標籤
3. 複製連線資訊
4. 使用 MySQL Workbench 或其他工具連接
5. 手動執行 `drizzle/` 目錄中的 SQL 檔案

---

## 驗證部署

### 步驟 1: 檢查應用程式狀態

1. 訪問 `https://taitungaibookingsystem.cc`
2. 確認首頁正常顯示
3. 檢查是否有 SSL 憑證（瀏覽器顯示鎖頭圖示）

### 步驟 2: 測試核心功能

- ✅ 首頁載入
- ✅ 導航選單正常
- ✅ 預約功能可用
- ✅ 查詢功能可用
- ✅ 登入功能正常（OAuth）

### 步驟 3: 檢查資料庫連線

1. 在 Railway Dashboard 查看應用程式日誌
2. 確認沒有資料庫連線錯誤
3. 測試建立一筆預約資料

### 步驟 4: 監控效能

1. 在 Railway Dashboard 查看 **"Metrics"** 標籤
2. 監控 CPU、記憶體、網路使用量
3. 確認應用程式運行穩定

---

## 常見問題

### Q1: 部署失敗，顯示建置錯誤

**解決方案**：
1. 檢查 Railway 日誌中的錯誤訊息
2. 確認所有環境變數已正確設定
3. 確認 `railway.json` 配置正確
4. 嘗試在本地執行 `pnpm build` 確認可以成功建置

### Q2: 網域無法訪問，顯示 Cloudflare Error 1000

**解決方案**：
1. 確認 Cloudflare 的 Proxy 狀態已**關閉**（灰色雲朵）
2. 確認 CNAME 記錄指向正確的 Railway 網址
3. 等待 DNS 生效（最多 48 小時）
4. 清除瀏覽器快取並重試

### Q3: 應用程式啟動後立即崩潰

**解決方案**：
1. 檢查環境變數是否完整
2. 確認 `DATABASE_URL` 正確
3. 檢查 Railway 日誌中的錯誤訊息
4. 確認資料庫遷移已執行

### Q4: 資料庫連線失敗

**解決方案**：
1. 確認 MySQL 服務正在運行
2. 檢查 `DATABASE_URL` 格式是否正確
3. 確認應用程式和資料庫在同一個 Railway 專案中
4. 重新啟動應用程式服務

### Q5: OAuth 登入失敗

**解決方案**：
1. 確認 `VITE_APP_ID` 正確
2. 確認 `VITE_APP_URL` 和 `APP_URL` 設定為正確的網域
3. 在 Manus OAuth 設定中添加回調網址：
   - `https://taitungaibookingsystem.cc/api/oauth/callback`
4. 重新部署應用程式

### Q6: 檔案上傳失敗

**解決方案**：
1. 確認 AWS S3 環境變數已設定
2. 檢查 S3 bucket 權限設定
3. 確認 AWS 憑證有效
4. 檢查應用程式日誌中的錯誤訊息

### Q7: Email/SMS 通知無法發送

**解決方案**：
1. 確認相關環境變數已設定
2. 檢查 SMTP/Twilio 憑證是否有效
3. 確認服務商帳號餘額充足
4. 檢查應用程式日誌中的錯誤訊息

### Q8: 如何更新應用程式？

**解決方案**：
1. 在本地修改代碼
2. 提交並推送到 GitHub
3. Railway 會自動偵測並重新部署
4. 等待部署完成（通常 3-5 分鐘）

### Q9: 如何查看應用程式日誌？

**解決方案**：
1. 在 Railway Dashboard 選擇應用程式服務
2. 點擊 **"Deployments"** 標籤
3. 選擇最新的部署
4. 查看即時日誌

### Q10: 如何備份資料庫？

**解決方案**：

**方法 1: 使用 Railway CLI**
```bash
railway run mysqldump -u root -p database_name > backup.sql
```

**方法 2: 使用 MySQL 客戶端**
1. 連接到 Railway MySQL
2. 使用 mysqldump 或 MySQL Workbench 匯出

**方法 3: 使用 Railway 快照功能**（Pro 方案）
1. 在 MySQL 服務中點擊 **"Snapshots"**
2. 建立新快照

---

## 進階配置

### 設定自動備份

建議使用 Railway 的 Cron Jobs 或外部服務定期備份資料庫。

### 設定監控與告警

1. 整合 Sentry 進行錯誤追蹤
2. 使用 UptimeRobot 監控網站可用性
3. 設定 Railway 的告警通知

### 效能優化

1. 啟用 Cloudflare CDN（Proxy 模式）
2. 優化資料庫查詢
3. 設定適當的快取策略
4. 監控並調整 Railway 資源配置

---

## 支援資源

### Railway 官方文件
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### 專案相關
- [GitHub Repository](https://github.com/Swiftarian/CivicTech)
- [專案 README](./README.md)
- [開發環境設定](./DEVELOPMENT_SETUP.md)

---

## 總結

完成以上步驟後，您的台東防災館綜合管理系統應該已經成功部署到 `https://taitungaibookingsystem.cc`！

**部署檢查清單**：
- ✅ Railway 專案已建立
- ✅ MySQL 資料庫已設定
- ✅ 環境變數已配置
- ✅ 應用程式已部署
- ✅ 自訂網域已綁定
- ✅ SSL 憑證已配置
- ✅ 資料庫已遷移
- ✅ 功能測試通過

如有任何問題，請參考常見問題章節或聯繫技術支援。

---

**最後更新**: 2026-01-21  
**版本**: 1.0.0
