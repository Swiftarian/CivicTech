# 預約提醒排程任務功能說明

## 功能概述

系統會自動在參訪日前3天發送提醒Email給預約者，提醒他們即將到來的參訪行程，並提供參訪前準備事項。此功能透過排程任務每天自動執行，無需人工介入。

---

## 功能特色

### 1. 自動化排程
- **生產環境**：伺服器啟動時自動初始化排程任務，每天早上9點執行
- **開發環境**：排程任務不自動啟動，可透過API手動觸發測試

### 2. 智慧篩選
系統只會發送提醒給符合以下條件的預約：
- 參訪日期為3天後（精確到當天）
- 還沒有發送過提醒（`reminderSent = 'no'`）
- 預約狀態為 `pending` 或 `confirmed`
- 有提供聯絡Email

### 3. 避免重複發送
- 每筆預約只會發送一次提醒
- 發送成功後會標記 `reminderSent = 'yes'`
- 即使排程任務多次執行，也不會重複發送

### 4. 錯誤處理
- Email發送失敗時不會標記為已發送
- 下次執行時會重新嘗試發送
- 記錄詳細的錯誤訊息供管理員查看

---

## Email內容說明

### 民眾預約提醒信

**主旨**：【台東防災館】參訪提醒 - 案件編號 BK1234567890

**內容包含**：
- 提醒訊息（3天後參訪）
- 預約資訊（案件編號、日期、時段、人數）
- 參訪前準備事項
- 聯絡資訊

**範例**：
```
親愛的 張三，您好：

提醒您，您預約的台東防災館參訪將於3天後進行！

預約資訊：
案件編號：BK1701234567890
參訪日期：2024/12/01
參訪時段：10:00-12:00
參訪人數：5人

參訪前準備事項：
1. 請於參訪當日提早10分鐘抵達
2. 請攜帶有效證件以便驗證身份
3. 請出示此案件編號：BK1701234567890
4. 建議穿著輕便服裝和運動鞋

如需取消預約，請盡快聯繫我們。

聯繫資訊：
地址：台東市更生北路616巷9號
電話：(089) XXX-XXXX
Email: info@taitung-disaster.gov.tw

期待您的到訪！
```

---

### 團體預約提醒信

**主旨**：【台東防災館】團體參訪提醒 - 案件編號 BK1234567890

**內容包含**：
- 提醒訊息（3天後參訪）
- 預約資訊（案件編號、單位、聯絡人、日期、時段、人數）
- 參訪前準備事項（包含團體專屬提醒）
- 聯絡資訊

**範例**：
```
台東國小 李四，您好：

提醒貴單位，預約的台東防災館團體參訪將於3天後進行！

預約資訊：
案件編號：BK1701234567890
單位名稱：台東國小
聯絡人：李四
參訪日期：2024/12/15
參訪時段：14:00-16:00
參訪人數：30人

參訪前準備事項：
1. 我們已為貴單位安排專業導覽員
2. 請於參訪當日提早15分鐘抵達
3. 請出示此案件編號：BK1701234567890
4. 請提醒學生/成員攜帶有效證件
5. 建議穿著輕便服裝和運動鞋
6. 若有特殊需求，請提前告知

如需取消預約，請盡快聯繫我們。

期待貴單位的到訪！
```

---

## 技術實作說明

### 1. 資料庫結構

**新增欄位**：`bookings.reminderSent`

```sql
ALTER TABLE bookings ADD COLUMN reminderSent ENUM('no', 'yes') DEFAULT 'no' NOT NULL;
```

此欄位用於記錄是否已發送提醒Email，避免重複發送。

---

### 2. 核心函數

#### `getBookingsNeedingReminder()`

**檔案位置**：`server/db.ts`

**功能**：查詢需要發送提醒的預約

**查詢邏輯**：
```typescript
// 計算3天後的日期範圍
const threeDaysLater = new Date();
threeDaysLater.setDate(threeDaysLater.getDate() + 3);
threeDaysLater.setHours(0, 0, 0, 0); // 當天開始

const threeDaysLaterEnd = new Date(threeDaysLater);
threeDaysLaterEnd.setHours(23, 59, 59, 999); // 當天結束

// 查詢條件
return await db.select().from(bookings)
  .where(
    and(
      gte(bookings.visitDate, threeDaysLater),
      lte(bookings.visitDate, threeDaysLaterEnd),
      eq(bookings.reminderSent, 'no'),
      or(
        eq(bookings.status, 'pending'),
        eq(bookings.status, 'confirmed')
      ),
      isNotNull(bookings.contactEmail)
    )
  );
```

---

#### `markBookingReminderSent()`

**檔案位置**：`server/db.ts`

**功能**：標記預約已發送提醒

```typescript
export async function markBookingReminderSent(bookingId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings)
    .set({ reminderSent: 'yes' })
    .where(eq(bookings.id, bookingId));
}
```

---

#### `sendBookingReminders()`

**檔案位置**：`server/scheduledTasks.ts`

**功能**：發送預約提醒Email的主要邏輯

**流程**：
1. 查詢需要發送提醒的預約
2. 逐一處理每筆預約
3. 根據預約類型選擇Email範本
4. 發送Email
5. 標記已發送
6. 記錄統計結果

**回傳值**：
```typescript
{
  success: number;  // 成功發送的數量
  failed: number;   // 失敗的數量
  total: number;    // 總數
  errors: string[]; // 錯誤訊息列表
}
```

---

### 3. 排程任務初始化

**檔案位置**：`server/scheduledTasks.ts`

**函數**：`initializeScheduledTasks()`

**執行時機**：
- 伺服器啟動時自動執行（僅生產環境）
- 計算下一次執行時間（明天早上9點）
- 之後每24小時執行一次

**程式碼片段**：
```typescript
export function initializeScheduledTasks() {
  // 計算下一次執行時間（明天早上9點）
  const now = new Date();
  const tomorrow9AM = new Date(now);
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);
  
  const timeUntilFirstRun = tomorrow9AM.getTime() - now.getTime();

  // 設定首次執行
  setTimeout(() => {
    sendBookingReminders();

    // 之後每24小時執行一次
    setInterval(() => {
      sendBookingReminders();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilFirstRun);
}
```

---

### 4. 伺服器整合

**檔案位置**：`server/_core/index.ts`

**整合方式**：
```typescript
import { initializeScheduledTasks } from "../scheduledTasks";

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
  
  // 初始化排程任務（只在生產環境執行）
  if (process.env.NODE_ENV === "production") {
    initializeScheduledTasks();
    console.log('[Server] 排程任務已啟動');
  } else {
    console.log('[Server] 開發環境，排程任務未啟動（可透過 API 手動觸發）');
  }
});
```

---

### 5. 手動觸發API

**檔案位置**：`server/routers.ts`

**API端點**：`scheduledTasks.triggerBookingReminders`

**權限**：管理員專用

**用途**：
- 開發環境測試
- 管理員手動執行
- 系統維護後補發提醒

**使用範例**：
```typescript
// 前端調用
const result = await trpc.scheduledTasks.triggerBookingReminders.mutate();

console.log(`成功: ${result.success}, 失敗: ${result.failed}, 總數: ${result.total}`);
if (result.errors.length > 0) {
  console.error('錯誤:', result.errors);
}
```

---

### 6. 單元測試

**檔案位置**：`server/scheduledTasks.test.ts`

**測試案例**：
1. ✅ 成功發送民眾預約提醒Email
2. ✅ 成功發送團體預約提醒Email
3. ✅ 處理多筆預約並統計結果
4. ✅ Email發送失敗時記錄錯誤但不標記為已發送
5. ✅ 沒有需要發送提醒的預約時回傳空結果
6. ✅ 處理過程中發生異常時記錄錯誤並繼續處理其他預約

**執行測試**：
```bash
pnpm test scheduledTasks.test.ts
```

---

## 使用說明

### 生產環境

**自動執行**：
1. 部署到生產環境（設定 `NODE_ENV=production`）
2. 伺服器啟動時會自動初始化排程任務
3. 每天早上9點自動執行
4. 查看伺服器日誌確認執行狀態

**日誌範例**：
```
[Server] 排程任務已啟動
[排程任務] 初始化完成，首次執行時間：2024/11/24 09:00:00
[排程任務] 找到 5 筆需要發送提醒的預約
[排程任務] 成功發送提醒Email給預約 BK1701234567890
[排程任務] 成功發送提醒Email給預約 BK1701234567891
...
[排程任務] 完成發送提醒Email：成功 5 筆，失敗 0 筆
```

---

### 開發環境

**手動觸發**：

開發環境中排程任務不會自動執行，管理員可以透過API手動觸發：

1. 登入管理員帳號
2. 在管理員後台或使用API工具調用：
   ```typescript
   const result = await trpc.scheduledTasks.triggerBookingReminders.mutate();
   ```
3. 查看執行結果

**測試流程**：
1. 建立一筆3天後的測試預約
2. 確保預約有提供Email
3. 手動觸發排程任務
4. 檢查Email是否發送（查看console日誌）
5. 確認預約的 `reminderSent` 欄位已更新為 `yes`

---

## 調整排程時間

如果需要修改排程執行時間（例如改為每天下午2點），修改 `server/scheduledTasks.ts`：

```typescript
export function initializeScheduledTasks() {
  const now = new Date();
  const tomorrow2PM = new Date(now);
  tomorrow2PM.setDate(tomorrow2PM.getDate() + 1);
  tomorrow2PM.setHours(14, 0, 0, 0); // 改為下午2點
  
  const timeUntilFirstRun = tomorrow2PM.getTime() - now.getTime();

  setTimeout(() => {
    sendBookingReminders();
    setInterval(() => {
      sendBookingReminders();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilFirstRun);
}
```

---

## 調整提醒天數

如果需要修改提醒天數（例如改為5天前），修改 `server/db.ts` 中的 `getBookingsNeedingReminder()` 函數：

```typescript
export async function getBookingsNeedingReminder() {
  const db = await getDb();
  if (!db) return [];
  
  // 改為5天後
  const fiveDaysLater = new Date();
  fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
  fiveDaysLater.setHours(0, 0, 0, 0);
  
  const fiveDaysLaterEnd = new Date(fiveDaysLater);
  fiveDaysLaterEnd.setHours(23, 59, 59, 999);
  
  return await db.select().from(bookings)
    .where(
      and(
        gte(bookings.visitDate, fiveDaysLater),
        lte(bookings.visitDate, fiveDaysLaterEnd),
        // ... 其他條件
      )
    );
}
```

同時記得更新Email範本中的文字：
```typescript
text += `提醒您，您預約的台東防災館參訪將於5天後進行！\n\n`;
```

---

## 常見問題

### Q1: 如何確認排程任務是否正常運作？

**檢查方式**：
1. 查看伺服器啟動日誌，確認有「排程任務已啟動」訊息
2. 查看每天早上9點的日誌，確認有執行記錄
3. 檢查資料庫中 `reminderSent` 欄位是否有更新
4. 確認Email是否實際發送（查看Email服務日誌）

---

### Q2: Email沒有發送怎麼辦？

**排查步驟**：
1. 確認預約符合發送條件（3天後、有Email、狀態正確、未發送過）
2. 檢查Email服務是否正確配置（參考 `BOOKING_EMAIL_NOTIFICATION_GUIDE.md`）
3. 查看伺服器日誌中的錯誤訊息
4. 手動觸發排程任務測試
5. 確認SMTP連線是否正常

---

### Q3: 如何重新發送提醒Email？

如果需要重新發送提醒（例如Email發送失敗），可以：

**方法1：重置reminderSent欄位**
```sql
UPDATE bookings 
SET reminderSent = 'no' 
WHERE bookingNumber = 'BK1234567890';
```

然後手動觸發排程任務或等待下次自動執行。

**方法2：直接調用Email函數**
在管理員後台建立手動發送功能（需要額外開發）。

---

### Q4: 排程任務會影響伺服器效能嗎？

**影響很小**：
- 每天只執行一次
- 查詢條件有索引優化
- Email發送是非阻塞的
- 即使有100筆預約需要發送，也只需幾秒鐘

**建議**：
- 如果預約量非常大（每天超過1000筆），考慮使用專業的任務佇列（如Bull、BullMQ）
- 監控Email發送速率，避免觸發SMTP限制

---

### Q5: 可以發送多次提醒嗎？

目前系統設計為每筆預約只發送一次提醒（3天前）。如果需要多次提醒，可以：

**方案1：新增多個提醒欄位**
```sql
ALTER TABLE bookings ADD COLUMN reminder7DaysSent ENUM('no', 'yes') DEFAULT 'no';
ALTER TABLE bookings ADD COLUMN reminder3DaysSent ENUM('no', 'yes') DEFAULT 'no';
ALTER TABLE bookings ADD COLUMN reminder1DaySent ENUM('no', 'yes') DEFAULT 'no';
```

**方案2：建立獨立的提醒記錄表**
```sql
CREATE TABLE booking_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId INT NOT NULL,
  reminderType ENUM('7days', '3days', '1day') NOT NULL,
  sentAt TIMESTAMP NOT NULL,
  FOREIGN KEY (bookingId) REFERENCES bookings(id)
);
```

---

## 監控與維護

### 建議監控指標

1. **發送成功率**：`success / total`
2. **發送失敗數量**：`failed`
3. **每日處理預約數**：`total`
4. **Email服務可用性**
5. **排程任務執行時間**

### 日誌保留

建議將排程任務的執行結果記錄到資料庫或日誌檔案，方便後續分析：

```typescript
// 可以新增一個日誌表
CREATE TABLE scheduled_task_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  taskName VARCHAR(100) NOT NULL,
  executedAt TIMESTAMP NOT NULL,
  success INT NOT NULL,
  failed INT NOT NULL,
  total INT NOT NULL,
  errors TEXT,
  duration INT -- 執行時間（毫秒）
);
```

---

## 未來改進建議

### 1. 多階段提醒
- 7天前：初次提醒
- 3天前：第二次提醒
- 1天前：最後提醒

### 2. 個人化內容
- 根據預約目的客製化提醒內容
- 加入天氣預報資訊
- 推薦參訪路線

### 3. 多通道通知
- Email + SMS簡訊
- Email + LINE通知
- Email + App推播

### 4. 智慧排程
- 根據Email開信率調整發送時間
- 避開週末和假日
- 考慮收件人時區

### 5. A/B測試
- 測試不同的Email主旨
- 測試不同的發送時間
- 優化Email內容

---

## 相關文件

- [預約Email通知功能說明](./BOOKING_EMAIL_NOTIFICATION_GUIDE.md)
- [志工管理與請假系統使用說明](./VOLUNTEER_MANAGEMENT_GUIDE.md)
- [送餐服務使用說明](./MEAL_DELIVERY_GUIDE.md)
- [Railway部署指南](./RAILWAY_DEPLOYMENT.md)
- [系統功能清單](./todo.md)

---

## 技術支援

如有任何問題或建議，請聯繫系統開發團隊。

**最後更新**：2024年11月23日
