# Railway 部署快速檢查清單

這是一份簡化的部署檢查清單，適合快速參考。詳細說明請參考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)。

---

## 📋 部署前準備

- [ ] 擁有 GitHub 帳號
- [ ] 擁有 `taitungaibookingsystem.cc` 網域的 DNS 控制權
- [ ] 準備好信用卡（Railway 需要）
- [ ] 準備好所有必要的 API 金鑰和憑證

---

## 🚀 Railway 設定

### 1. 帳號設定

- [ ] 註冊 Railway 帳號（使用 GitHub 登入）
- [ ] 綁定信用卡
- [ ] 選擇方案（建議 Hobby $5/月）

### 2. 建立專案

- [ ] 建立新專案
- [ ] 從 GitHub 部署（選擇 `Swiftarian/CivicTech`）
- [ ] 設定根目錄為 `fire_volunteer_management`

### 3. 設定資料庫

- [ ] 新增 MySQL 服務
- [ ] 確認 `DATABASE_URL` 自動注入

---

## ⚙️ 環境變數配置

### 必填變數

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] `JWT_SECRET` = `<至少32字元的強密碼>`
- [ ] `VITE_APP_ID` = `<Manus OAuth App ID>`
- [ ] `VITE_APP_TITLE` = `台東防災館綜合管理系統`
- [ ] `VITE_APP_LOGO` = `/logo.png`
- [ ] `VITE_OAUTH_PORTAL_URL` = `https://oauth.manus.space`
- [ ] `OAUTH_SERVER_URL` = `https://oauth.manus.space`
- [ ] `VITE_APP_URL` = `https://taitungaibookingsystem.cc`
- [ ] `APP_URL` = `https://taitungaibookingsystem.cc`

### 選填變數（依需求）

**AWS S3**

- [ ] `AWS_REGION`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_S3_BUCKET`

**Email (SMTP)**

- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `SMTP_FROM`

**SMS (Twilio)**

- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`

**LINE**

- [ ] `LINE_CHANNEL_ACCESS_TOKEN`
- [ ] `LINE_CHANNEL_SECRET`

---

## 🌐 網域設定

### Railway 端

- [ ] 在 Railway 添加自訂網域 `taitungaibookingsystem.cc`
- [ ] 複製 Railway 提供的 CNAME 目標值

### DNS 端（Cloudflare 或其他）

- [ ] 登入 DNS 管理介面
- [ ] 刪除現有的 A 記錄（如有）
- [ ] 添加 CNAME 記錄：
  - Type: `CNAME`
  - Name: `@`
  - Target: `<your-app>.up.railway.app`
  - Proxy: **關閉**（重要！）
- [ ] 儲存變更
- [ ] 等待 DNS 生效（5-30 分鐘）

---

## 🗄️ 資料庫遷移

選擇以下任一方法：

### 方法 1: Railway CLI

```bash
railway login
railway link
railway run pnpm db:push
```

- [ ] 安裝 Railway CLI
- [ ] 登入並連接專案
- [ ] 執行遷移指令

### 方法 2: Railway Dashboard

- [ ] 開啟 Railway Shell
- [ ] 執行 `pnpm db:push`

### 方法 3: MySQL 客戶端

- [ ] 連接到 Railway MySQL
- [ ] 手動執行 SQL 檔案

---

## ✅ 驗證部署

### 基本檢查

- [ ] 訪問 `https://taitungaibookingsystem.cc`
- [ ] 確認首頁正常顯示
- [ ] 確認 SSL 憑證有效（鎖頭圖示）
- [ ] 檢查 Railway 日誌無錯誤

### 功能測試

- [ ] 首頁載入正常
- [ ] 導航選單可用
- [ ] 預約功能可用
- [ ] 查詢功能可用
- [ ] 登入功能正常（OAuth）

### 資料庫測試

- [ ] 建立測試預約
- [ ] 查詢測試預約
- [ ] 確認資料正確儲存

---

## 🔧 部署後設定

### Manus OAuth

- [ ] 在 Manus OAuth 設定中添加回調網址：
  - `https://taitungaibookingsystem.cc/api/oauth/callback`

### 監控設定

- [ ] 設定 Railway 告警通知
- [ ] 整合錯誤追蹤服務（如 Sentry）
- [ ] 設定網站監控（如 UptimeRobot）

### 備份設定

- [ ] 設定資料庫自動備份
- [ ] 測試備份還原流程

---

## 📊 效能優化

- [ ] 監控 Railway Metrics
- [ ] 檢查資料庫查詢效能
- [ ] 優化圖片和靜態資源
- [ ] 考慮啟用 CDN（Cloudflare Proxy）

---

## 🆘 故障排除

### 如果部署失敗

1. [ ] 檢查 Railway 建置日誌
2. [ ] 確認環境變數完整
3. [ ] 確認 `railway.json` 正確
4. [ ] 嘗試本地建置測試

### 如果網域無法訪問

1. [ ] 確認 DNS 記錄正確
2. [ ] 確認 Cloudflare Proxy 已關閉
3. [ ] 等待 DNS 生效（最多 48 小時）
4. [ ] 清除瀏覽器快取

### 如果應用程式崩潰

1. [ ] 檢查 Railway 日誌
2. [ ] 確認資料庫連線正常
3. [ ] 確認環境變數正確
4. [ ] 確認資料庫遷移已執行

---

## 📚 相關文件

- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [開發環境設定](./DEVELOPMENT_SETUP.md)
- [環境變數範例](./.env.production.example)
- [Railway 官方文件](https://docs.railway.app)

---

## ✨ 完成！

恭喜！如果所有項目都已勾選，您的應用程式應該已經成功部署到 `https://taitungaibookingsystem.cc`！

**預估完成時間**: 30-60 分鐘（不含 DNS 生效時間）

---

**最後更新**: 2026-01-21
