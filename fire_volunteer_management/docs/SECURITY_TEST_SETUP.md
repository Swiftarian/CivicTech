# 資安掃描測試環境設定

## 測試登入功能

為了配合資安掃描測試，本系統提供了測試登入功能。

### 環境變數設定

以下環境變數需要在 Railway 部署平台上設定：

```bash
# 啟用測試登入功能（測試完成後應移除）
ENABLE_TEST_LOGIN=true

# Vite 應用 ID（必須與 Manus OAuth 的 appId 一致）
VITE_APP_ID=taitung-disaster-system
```

### 測試登入頁面

**URL**: https://taitungaibookingsystem.cc/test-login

### 測試帳號

#### 管理員帳號

- **Email**: jacky.hsieh@insight.ntu.edu.tw
- **密碼**: SecurityTest2024!
- **角色**: admin

- **Email**: chelsea.juan@udngroup.com.tw
- **密碼**: SecurityTest2024!
- **角色**: admin

#### 志工帳號

- **Email**: vol3@taitung.gov.tw
- **密碼**: Volunteer2024!
- **角色**: volunteer

### API 測試

使用 tRPC API 進行測試：

```bash
curl -X POST 'https://taitungaibookingsystem.cc/api/trpc/auth.testLogin' \
  -H 'Content-Type: application/json' \
  -d '{"json":{"email":"jacky.hsieh@insight.ntu.edu.tw","password":"SecurityTest2024!"}}'
```

### 測試完成後的清理工作

1. 刪除 `client/src/pages/TestLogin.tsx`
2. 移除 `client/src/App.tsx` 中的 `/test-login` 路由
3. 刪除 `server/routers.ts` 中的 `testLogin` mutation
4. 移除 Railway 上的 `ENABLE_TEST_LOGIN` 環境變數
5. 提交變更到 git

### 技術說明

#### JWT Payload 格式

測試登入使用 Manus SDK 相容的 JWT payload 格式：

```typescript
{
  openId: string,    // 用戶唯一標識
  appId: string,     // 應用 ID（必須與 VITE_APP_ID 一致）
  name: string,      // 用戶名稱
  exp: number        // 過期時間
}
```

#### Session Cookie

- **名稱**: `app_session_id`
- **有效期**: 7 天
- **屬性**: HttpOnly, Secure, SameSite=Lax

#### 認證流程

1. 用戶在測試登入頁面輸入帳號密碼
2. 前端調用 `auth.testLogin` tRPC mutation
3. 後端驗證帳號密碼
4. 生成包含 `openId`, `appId`, `name` 的 JWT token
5. 設定 session cookie
6. 前端跳轉到管理員後台

## 安全注意事項

⚠️ **重要**: 測試登入功能僅供資安掃描測試使用，測試完成後必須立即移除。

- 測試登入功能繞過了正常的 OAuth 認證流程
- 測試帳號使用固定密碼，存在安全風險
- 生產環境不應啟用此功能
