# 啟用測試登入功能指南

## 📋 背景說明

由於 Manus OAuth 在 2024 年 12 月被 Meta 收購後基礎設施發生變化，原有的 OAuth 登入功能暫時無法使用。為了讓您能夠繼續訪問後台管理系統，我們已經實作了測試登入功能作為臨時解決方案。

## ✅ 當前狀態

- ✅ **測試登入 API 已實作** - 後端程式碼已完成並部署
- ✅ **測試登入頁面已就緒** - 前端頁面可正常訪問
- ❌ **環境變數未啟用** - 需要在 Railway 設定 `ENABLE_TEST_LOGIN=true`

## 🔧 啟用步驟

### 步驟 1：訪問 Railway Variables 頁面

直接點擊以下連結訪問環境變數設定頁面：

```
https://railway.com/project/5160d4af-f567-4c7a-b20e-5655125afcba/service/5ec13aea-ad80-4776-980b-ea5220204999/variables
```

### 步驟 2：修改 ENABLE_TEST_LOGIN 環境變數

1. 在變數列表中找到 `ENABLE_TEST_LOGIN`
2. 點擊該變數右側的 **⋮** (三個點) 選單
3. 選擇 **Edit**
4. 將值從 `false` 改為 `true`
5. 點擊 **Submit** 或 **Save** 確認

### 步驟 3：重新部署應用

修改環境變數後，Railway 應該會自動觸發重新部署。如果沒有：

1. 點擊右上角的 **Deploy** 按鈕
2. 選擇 **Redeploy** 重新部署
3. 等待部署完成（約 1-2 分鐘）

### 步驟 4：測試登入功能

部署完成後：

1. 訪問測試登入頁面：https://taitungaibookingsystem.cc/test-login
2. 使用以下測試帳號登入：

   **管理員帳號 1：**
   - Email: `jacky.hsieh@insight.ntu.edu.tw`
   - Password: `SecurityTest2024!`

   **管理員帳號 2：**
   - Email: `chelsea.juan@udngroup.com.tw`
   - Password: `SecurityTest2024!`

   **志工帳號：**
   - Email: `vol3@taitung.gov.tw`
   - Password: `Volunteer2024!`

3. 登入成功後會自動跳轉到後台管理頁面

## 🔒 安全注意事項

### ⚠️ 重要提醒

1. **測試登入僅供臨時使用** - 這是為了應對 OAuth 基礎設施變化的臨時解決方案
2. **資安掃描前需關閉** - 在正式進行弱掃（資安掃描）之前，必須將 `ENABLE_TEST_LOGIN` 改回 `false`
3. **測試帳號密碼已公開** - 這些測試帳號的密碼已在文件中公開，僅供測試使用

### 🔐 關閉測試登入

當 OAuth 問題解決或準備進行資安掃描時：

1. 回到 Railway Variables 頁面
2. 將 `ENABLE_TEST_LOGIN` 改回 `false`
3. 重新部署應用

## 🆘 問題排查

### 問題 1：顯示 "測試登入功能未啟用"

**原因：** `ENABLE_TEST_LOGIN` 環境變數未設為 `true` 或部署未完成

**解決方法：**

1. 確認環境變數已正確設定為 `true`
2. 確認 Railway 部署已完成（狀態為 "Deployment successful"）
3. 清除瀏覽器快取後重試

### 問題 2：顯示 "帳號或密碼錯誤"

**原因：** 輸入的帳號或密碼不正確

**解決方法：**

1. 仔細檢查 Email 地址是否完全正確
2. 確認密碼包含正確的大小寫和特殊字元
3. 使用複製貼上避免輸入錯誤

### 問題 3：登入後無法訪問管理功能

**原因：** 使用的是志工帳號而非管理員帳號

**解決方法：**

1. 登出當前帳號
2. 使用管理員帳號重新登入（jacky.hsieh 或 chelsea.juan）

## 📞 聯絡支援

如果遇到其他問題，請聯絡：

- GitHub Issues: https://github.com/Swiftarian/CivicTech/issues
- Manus 支援: https://help.manus.im/

## 📝 相關文件

- [測試登入設定文件](./SECURITY_TEST_SETUP.md)
- [OAuth 修復步驟](./oauth_fix_steps.md)

---

**最後更新：** 2026-01-26
**文件版本：** 1.0
