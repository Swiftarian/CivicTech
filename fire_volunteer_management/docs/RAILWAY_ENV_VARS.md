# Railway 環境變數設定

請在 Railway Dashboard → CivicTech 服務 → Variables 中添加以下環境變數：

## Google OAuth 憑證

```
GOOGLE_CLIENT_ID=<從 Google Cloud Console 取得>
GOOGLE_CLIENT_SECRET=<從 Google Cloud Console 取得>
APP_URL=https://taitungaibookingsystem.cc
```

## 已存在的環境變數（保留）

```
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=taitung-fire-dept-jwt-secret-2026-production-key
NODE_ENV=production
OAUTH_SERVER_URL=https://oauth.manus.space
PORT=3000
```

## Google OAuth 設定資訊

**Google Cloud Console 專案**: 台東防災館綜合管理系統

**已授權的重新導向 URI**:

- https://taitungaibookingsystem.cc/api/auth/google/callback

**已授權的 JavaScript 來源**:

- https://taitungaibookingsystem.cc

## 說明

- `GOOGLE_CLIENT_ID`: Google OAuth 用戶端 ID（從 Google Cloud Console 取得）
- `GOOGLE_CLIENT_SECRET`: Google OAuth 用戶端密鑰（從 Google Cloud Console 取得）
- `APP_URL`: 應用程式的完整 URL（用於 OAuth 回調）
- huanchenlin@gmail.com 會自動設定為 admin 角色
- 其他使用者預設為 user 角色

## 設定步驟

1. 前往 Railway Dashboard
2. 選擇 CivicTech 專案
3. 點選 fire_volunteer_management 服務
4. 進入 Variables 標籤
5. 添加上述 Google OAuth 相關環境變數
6. 儲存後 Railway 會自動重新部署
