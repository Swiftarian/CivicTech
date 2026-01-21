# 部署狀態記錄

## 2026-01-22 部署更新

### 環境變數配置完成

已成功配置以下環境變數：

- ✅ DATABASE_URL - 連接到 Railway MySQL
- ✅ JWT_SECRET - JWT 認證密鑰
- ✅ NODE_ENV - 設定為 production
- ✅ OAUTH_SERVER_URL - OAuth 伺服器 URL
- ✅ PORT - 應用程式端口 3000

### VITE 環境變數處理

移除了 VITE\_\* 環境變數，改用程式碼中的預設值：

- APP_TITLE: "臺東災害警覺教育館"
- APP_LOGO: "/images/taitung-fire-dept-logo.png"
- OAUTH_PORTAL_URL: "https://oauth.manus.space"

### 部署目標

- 自訂網域：https://taitungaibookingsystem.cc
- Railway 網域：s8zn7jrp.up.railway.app
- DNS 狀態：已配置 CNAME 記錄

### 下一步

等待此次部署完成後，驗證應用程式是否能正常啟動並回應請求。
