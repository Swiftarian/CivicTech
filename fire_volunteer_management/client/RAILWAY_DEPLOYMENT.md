# Railway 部署指南

本指南將協助您將台東防災館綜合管理系統部署到 Railway 平台，並綁定 Hostinger 網域。

---

## 📋 前置準備

### 1. 註冊 Railway 帳號
- 前往 [railway.app](https://railway.app)
- 使用 GitHub 帳號註冊（推薦）
- 免費方案提供 $5 美元額度/月

### 2. 準備 GitHub Repository
```bash
# 1. 下載程式碼（從管理介面的 Code 標籤）
# 2. 解壓縮到本地資料夾
# 3. 初始化 Git repository
cd taitung-disaster-system
git init
git add .
git commit -m "Initial commit"

# 4. 推送到 GitHub
git remote add origin https://github.com/你的帳號/taitung-disaster-system.git
git branch -M main
git push -u origin main
```

---

## 🚀 部署步驟

### 步驟一：建立 Railway 專案

1. 登入 Railway Dashboard
2. 點擊「**New Project**」
3. 選擇「**Deploy from GitHub repo**」
4. 選擇您剛才推送的 repository

### 步驟二：新增 MySQL 資料庫

1. 在專案中點擊「**+ New**」
2. 選擇「**Database → MySQL**」
3. Railway 會自動建立 MySQL 實例
4. 等待資料庫啟動完成

### 步驟三：設定環境變數

點擊您的應用服務，進入「**Variables**」標籤，新增以下環境變數：

#### 必要環境變數

```env
# 資料庫連線（從 MySQL 服務複製）
DATABASE_URL=${{MySQL.DATABASE_URL}}

# JWT 密鑰（自行生成隨機字串）
JWT_SECRET=your-super-secret-jwt-key-change-this

# 應用程式設定
VITE_APP_TITLE=台東防災館綜合管理系統
VITE_APP_LOGO=/logo.svg

# OAuth 設定（需要重新申請 Manus OAuth 應用）
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=your-name

# Manus API（如需使用 LLM、通知等功能）
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key

# S3 儲存（如需檔案上傳功能）
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=your-bucket-name
```

#### 環境變數說明

| 變數名稱 | 說明 | 如何取得 |
|---------|------|---------|
| `DATABASE_URL` | MySQL 連線字串 | Railway 自動提供 |
| `JWT_SECRET` | JWT 簽名密鑰 | 自行生成隨機字串（至少32字元） |
| `VITE_APP_ID` | Manus OAuth 應用ID | 需重新申請 OAuth 應用 |
| `OWNER_OPEN_ID` | 擁有者的 OpenID | 從 Manus 個人資料取得 |
| `BUILT_IN_FORGE_API_KEY` | Manus API 金鑰 | 從 Manus 平台取得 |
| `AWS_*` | S3 儲存憑證 | 從 AWS 控制台取得 |

### 步驟四：執行資料庫遷移

1. 在 Railway 專案中，點擊您的應用服務
2. 進入「**Settings**」標籤
3. 找到「**Deploy Trigger**」區域
4. 點擊「**Deploy**」按鈕觸發部署

部署完成後，需要手動執行資料庫遷移：

```bash
# 方法一：使用 Railway CLI
railway run pnpm db:push

# 方法二：在 Railway Dashboard 的 Terminal 中執行
pnpm db:push
```

### 步驟五：設定自訂網域

1. 在應用服務中，進入「**Settings**」標籤
2. 找到「**Domains**」區域
3. 點擊「**+ Custom Domain**」
4. 輸入您的 Hostinger 網域（例如：`disaster.yourdomain.com`）

### 步驟六：設定 Hostinger DNS

登入 Hostinger 控制台，新增以下 DNS 記錄：

| 類型 | 名稱 | 值 | TTL |
|------|------|-----|-----|
| CNAME | disaster | your-app.up.railway.app | 3600 |

**注意：** Railway 會提供實際的 CNAME 值，請從 Railway Dashboard 複製。

---

## ✅ 驗證部署

1. 等待 DNS 生效（通常需要5-30分鐘）
2. 訪問您的網域：`https://disaster.yourdomain.com`
3. 測試以下功能：
   - ✅ 首頁載入正常
   - ✅ 登入功能正常
   - ✅ 預約功能正常
   - ✅ 管理後台可存取

---

## 🔧 常見問題

### 1. 部署失敗：找不到 pnpm

**解決方法：** Railway 應該會自動偵測 `packageManager` 欄位，如果沒有，請在專案設定中指定 Node.js 版本：

```json
// 在 package.json 中確認有此行
"packageManager": "pnpm@10.4.1"
```

### 2. 資料庫連線失敗

**解決方法：** 確認 `DATABASE_URL` 環境變數正確設定，格式應為：
```
mysql://user:password@host:port/database
```

### 3. OAuth 登入失敗

**原因：** Manus OAuth 回調 URL 需要更新

**解決方法：**
1. 前往 Manus 開發者平台
2. 更新 OAuth 應用的回調 URL 為：
   ```
   https://your-domain.com/api/oauth/callback
   ```

### 4. 檔案上傳失敗

**原因：** S3 憑證未設定或不正確

**解決方法：**
1. 確認 AWS S3 憑證已正確設定
2. 確認 S3 bucket 的 CORS 設定允許您的網域
3. 測試 S3 連線：
   ```bash
   railway run node -e "console.log(process.env.AWS_ACCESS_KEY_ID)"
   ```

---

## 💰 成本估算

### Railway 免費方案
- **免費額度：** $5 美元/月
- **包含：**
  - 500 小時執行時間
  - 100 GB 出站流量
  - 1 GB MySQL 儲存空間

### 預估月費用
- **小型網站（<1000 訪客/月）：** 免費方案足夠
- **中型網站（1000-10000 訪客/月）：** 約 $5-20 美元/月
- **大型網站（>10000 訪客/月）：** 約 $20-50 美元/月

---

## 📊 監控與維護

### 查看日誌
1. 在 Railway Dashboard 點擊您的服務
2. 進入「**Deployments**」標籤
3. 點擊最新的部署
4. 查看即時日誌

### 效能監控
Railway 提供內建的效能監控：
- CPU 使用率
- 記憶體使用率
- 網路流量
- 回應時間

### 自動重啟
如果應用程式崩潰，Railway 會自動重啟（最多重試10次）。

---

## 🔄 更新部署

### 方法一：自動部署（推薦）
1. 推送程式碼到 GitHub
   ```bash
   git add .
   git commit -m "Update features"
   git push
   ```
2. Railway 會自動偵測並部署

### 方法二：手動部署
1. 在 Railway Dashboard 點擊「**Deploy**」按鈕
2. 等待部署完成

---

## 🆘 需要協助？

如果遇到問題，可以：
1. 查看 Railway 官方文件：https://docs.railway.app
2. 加入 Railway Discord 社群
3. 聯繫 Railway 支援團隊

---

## ⚠️ 重要提醒

### 與 Manus 部署的差異

| 功能 | Manus 部署 | Railway 部署 |
|------|-----------|-------------|
| 資料庫 | ✅ 自動配置 | ⚠️ 需手動設定 |
| 環境變數 | ✅ 自動注入 | ⚠️ 需手動設定 |
| OAuth | ✅ 自動配置 | ⚠️ 需重新申請 |
| S3 儲存 | ✅ 自動配置 | ⚠️ 需手動設定 |
| 部署速度 | ✅ 一鍵部署 | ⚠️ 需多步驟 |
| 成本 | ✅ 包含在方案中 | 💰 需額外付費 |

### 建議

如果您只是想要快速上線，**強烈建議使用 Manus 內建部署**：
1. 點擊管理介面的「Publish」按鈕
2. 在「Settings → Domains」綁定 Hostinger 網域
3. 完成！

Railway 部署適合：
- 需要完全掌控基礎設施
- 需要自訂伺服器配置
- 需要整合其他 Railway 服務
- 已有 Railway 付費方案

---

**祝您部署順利！** 🎉
