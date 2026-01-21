# LINE Messaging API 整合說明

## 功能概述

本系統已整合LINE Messaging API，實現送餐通知功能。收餐人可以透過LINE接收送餐通知，並點擊連結確認收餐，完全免費（每月500則訊息免費額度）。

---

## 功能特色

### 1. 智慧通知路由

- 優先使用LINE通知（免費）
- LINE發送失敗自動降級使用SMS
- 支援收餐人自訂通知偏好（LINE/SMS/兩者）

### 2. 收餐人管理

- 建立和管理收餐人資料
- 綁定LINE帳號
- 查看LINE綁定狀態
- 解除LINE綁定

### 3. LINE機器人資訊

- 顯示LINE機器人QR Code
- 提供加入好友連結
- 協助收餐人現場加入

---

## 系統架構

### 後端模組

#### 1. LINE API整合 (`server/_core/lineMessaging.ts`)

- `sendLineMessage()` - 發送推播訊息
- `replyLineMessage()` - 回覆訊息
- `getLineUserProfile()` - 取得使用者資料
- `verifyLineSignature()` - 驗證webhook簽名
- `createDeliveryNotificationMessage()` - 建立送餐通知訊息

#### 2. Webhook處理 (`server/_core/lineWebhook.ts`)

- 處理使用者加入好友事件
- 處理使用者封鎖機器人事件
- 處理使用者發送訊息事件
- 自動發送歡迎訊息

#### 3. 收餐人資料庫 (`server/recipientsDb.ts`)

- 建立/查詢/更新/刪除收餐人
- 綁定/解除LINE帳號
- 查詢LINE綁定狀態

#### 4. API端點 (`server/routers.ts`)

- `recipients.getAll` - 查詢所有收餐人
- `recipients.create` - 新增收餐人
- `recipients.update` - 更新收餐人
- `recipients.delete` - 刪除收餐人
- `recipients.bindLine` - 綁定LINE帳號
- `recipients.unbindLine` - 解除LINE綁定
- `recipients.getLineBotInfo` - 取得LINE機器人資訊

### 前端頁面

#### 收餐人管理 (`/admin/recipients`)

- 收餐人列表顯示
- 新增收餐人對話框
- LINE機器人QR Code顯示
- LINE綁定/解除綁定功能

---

## 使用流程

### 管理員操作流程

#### 步驟1：設定LINE機器人（已完成）

✅ LINE Developers Console已設定完成
✅ Webhook URL: `https://taitungaibookingsystem.cc/api/line/webhook`
✅ 環境變數已配置

#### 步驟2：新增收餐人

1. 前往「收餐人管理」頁面（`/admin/recipients`）
2. 點擊「新增收餐人」按鈕
3. 填寫收餐人資訊（姓名、電話、地址）
4. 點擊「建立」

#### 步驟3：協助收餐人加入LINE好友

1. 點擊「LINE機器人QR Code」按鈕
2. 請收餐人掃描QR Code加入好友
3. 或點擊「開啟LINE加入好友」分享連結給收餐人

#### 步驟4：綁定LINE帳號

**方法A：從webhook日誌取得LINE User ID（推薦）**

1. 收餐人加入好友後，系統會在webhook日誌中記錄LINE User ID
2. 前往LINE Developers Console查看webhook日誌
3. 複製LINE User ID（格式：U1234567890abcdef...）
4. 在收餐人列表中點擊「綁定LINE」
5. 貼上LINE User ID並確認

**方法B：請收餐人提供LINE User ID**

1. 請收餐人在LINE中查看自己的User ID
2. 在收餐人列表中點擊「綁定LINE」
3. 輸入LINE User ID並確認

#### 步驟5：建立送餐任務

1. 前往「送餐服務管理」頁面
2. 建立送餐任務時，系統會自動：
   - 檢查收餐人是否已綁定LINE
   - 如果有LINE綁定，發送LINE通知
   - 如果沒有LINE綁定，發送SMS通知

### 收餐人操作流程

#### 步驟1：加入LINE好友

1. 掃描管理員提供的QR Code
2. 或點擊加入好友連結
3. 加入「臺東縣消防局」LINE機器人

#### 步驟2：接收送餐通知

1. 送餐任務建立後，自動收到LINE訊息
2. 訊息包含：
   - 送餐日期和時間
   - 確認收餐連結
   - 注意事項

#### 步驟3：確認收餐

1. 點擊LINE訊息中的連結
2. 進入收餐確認頁面
3. 輸入驗證碼（或掃描QR Code）
4. 確認收餐

---

## LINE機器人資訊

### 基本資訊

- **Bot Name**: 臺東縣消防局
- **Bot Basic ID**: @jfu7162o
- **加入好友連結**: https://line.me/R/ti/p/@jfu7162o

### Webhook設定

- **Webhook URL**: `https://taitungaibookingsystem.cc/api/line/webhook`
- **Use webhooks**: 已啟用
- **Auto-reply messages**: 已停用（使用自訂回覆）

### 環境變數

```
LINE_CHANNEL_ID=1653775744
LINE_CHANNEL_SECRET=5ddfa56585c4991bc76518fb0c3d8ba3
LINE_CHANNEL_ACCESS_TOKEN=RPatHREQYo40AjaRQhoubN18uqKEiDuO8Hk3dJKVQIUCj5ac6le8SST/oI/t4rEyrq73jJlR/sv1ADJ7hP1CR1DTyhgp0kEI1gTmfPLg11IVHv4GDhz1icJ75DD/4rVrHBJcnUt8JpIQOfRnDJgsNAdB04t89/1O/w1cDnyilFU=
LINE_BOT_BASIC_ID=@jfu7162o
```

---

## 費用說明

### LINE Messaging API費用

- **免費方案**: 每月500則訊息免費
- **輕用量方案**: 月費100元，每月5,000則訊息
- **中用量方案**: 月費400元，每月25,000則訊息

### 建議

- 如果每月送餐次數少於500次，完全免費
- 如果超過500次，建議升級到輕用量方案（月費100元）
- 相比SMS（每則0.8-1.5元），LINE通知更經濟實惠

---

## 故障排除

### 問題1：收餐人無法加入好友

**可能原因**：

- LINE機器人帳號被停用
- 收餐人的LINE版本過舊

**解決方案**：

- 確認LINE Developers Console中的Channel狀態為「Published」
- 請收餐人更新LINE到最新版本

### 問題2：LINE訊息發送失敗

**可能原因**：

- Channel Access Token過期或無效
- 收餐人封鎖了機器人
- 網路連線問題

**解決方案**：

- 檢查環境變數中的Channel Access Token是否正確
- 確認收餐人未封鎖機器人
- 系統會自動降級使用SMS通知

### 問題3：無法綁定LINE帳號

**可能原因**：

- LINE User ID輸入錯誤
- 收餐人尚未加入好友

**解決方案**：

- 確認LINE User ID格式正確（以U開頭，長度約33字元）
- 確認收餐人已加入LINE機器人好友
- 從LINE Developers Console的webhook日誌中取得正確的User ID

### 問題4：Webhook無法接收事件

**可能原因**：

- Webhook URL設定錯誤
- SSL憑證問題
- 伺服器防火牆阻擋

**解決方案**：

- 確認Webhook URL為：`https://taitungaibookingsystem.cc/api/line/webhook`
- 確認網站使用HTTPS（LINE要求）
- 在LINE Developers Console測試Webhook連線

---

## 測試

### 單元測試

```bash
# 執行LINE憑證驗證測試
pnpm test line.credentials.test.ts

# 執行LINE整合功能測試
pnpm test line.integration.test.ts
```

### 手動測試流程

1. 新增測試收餐人
2. 用自己的LINE帳號加入機器人好友
3. 綁定LINE帳號到測試收餐人
4. 建立送餐任務
5. 確認收到LINE通知
6. 點擊連結測試收餐確認流程

---

## 資料庫結構

### recipients表

```sql
CREATE TABLE recipients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  lineUserId VARCHAR(255),
  lineDisplayName VARCHAR(100),
  lineAuthorizedAt TIMESTAMP,
  preferredNotificationMethod ENUM('line', 'sms', 'both') DEFAULT 'sms',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### mealDeliveries表（已修改）

```sql
-- 新增欄位
recipientId INT REFERENCES recipients(id)
```

---

## 安全性考量

### 1. Webhook簽名驗證

- 所有webhook請求都會驗證LINE簽名
- 防止偽造請求

### 2. 環境變數保護

- 所有敏感資訊儲存在環境變數中
- 不會提交到程式碼倉庫

### 3. HTTPS強制

- LINE Webhook要求使用HTTPS
- 確保資料傳輸安全

### 4. 權限控制

- 只有管理員可以管理收餐人
- 只有管理員可以綁定LINE帳號

---

## 未來擴充建議

### 1. 自動綁定

- 收餐人加入好友後，輸入電話號碼自動綁定
- 減少管理員手動綁定的工作

### 2. Rich Menu

- 建立LINE Rich Menu
- 提供快速功能入口（查詢送餐記錄、聯絡客服等）

### 3. 推播訊息模板

- 使用LINE Flex Message
- 提供更美觀的訊息呈現

### 4. 雙向互動

- 收餐人可以在LINE中直接確認收餐
- 不需要點擊外部連結

---

## 相關文件

- [LINE Messaging API官方文件](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Developers Console](https://developers.line.biz/console/)
- [Webhook事件參考](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)
