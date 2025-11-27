# SMS簡訊測試使用指南

## 概述

本文件說明如何使用SMS簡訊測試功能，測試送餐服務的SMS通知系統。目前系統為**模擬模式**，實際不會發送簡訊，但會在伺服器console和測試頁面顯示SMS內容。

## 功能說明

### SMS通知流程

1. **建立送餐任務** → 系統自動產生6位數驗證序號
2. **發送SMS通知** → 收餐人收到包含序號和確認連結的簡訊
3. **收餐人確認** → 點擊連結進入確認頁面
4. **輸入序號驗證** → 收餐人輸入驗證序號完成簽收
5. **記錄簽收資訊** → 系統記錄簽收時間、GPS位置

### SMS內容範本

```
【台東防災館送餐服務】
親愛的 王小明，您好！

您的送餐服務已安排：
送達日期：2024/01/15
送達時段：12:00-13:00

驗證序號：123456

請保管好此序號，志工送達時需要此序號完成簽收。

確認連結：https://your-domain.com/confirm-receipt/123

如有疑問，請聯繫我們。
```

## 測試步驟

### 方法一：使用SMS測試頁面（推薦）

1. **訪問測試頁面**
   - 以管理員身份登入系統
   - 訪問 `/sms-test` 頁面

2. **填寫測試資訊**
   - 收餐人姓名：例如「王小明」
   - 收餐人手機號碼：例如「0912-345-678」

3. **發送測試SMS**
   - 點擊「發送測試SMS」按鈕
   - 系統會顯示SMS內容預覽和驗證序號

4. **查看測試結果**
   - 測試頁面會顯示SMS內容預覽
   - 伺服器console會輸出完整SMS資訊
   - 驗證序號會以黃色醒目顯示

### 方法二：建立實際送餐任務測試

1. **建立送餐任務**
   - 訪問 `/meal-delivery` 頁面
   - 點擊「新增送餐任務」
   - 填寫收餐人資訊（姓名、手機、地址、時間）

2. **查看SMS發送記錄**
   - 建立任務後，系統會自動發送SMS
   - 查看伺服器console輸出的SMS內容
   - 記錄產生的驗證序號

3. **測試收餐確認流程**
   - 訪問 `/confirm-receipt/{deliveryId}` 頁面
   - 輸入驗證序號
   - 測試簽收流程是否正常

## 模擬模式說明

### 當前行為

- ✅ 產生6位數驗證序號（英數字混合）
- ✅ 建立SMS內容（包含序號、確認連結）
- ✅ 在console輸出SMS內容
- ✅ 在測試頁面顯示SMS預覽
- ❌ **不會實際發送簡訊**

### Console輸出範例

```
============================================================
📱 SMS簡訊發送
============================================================
收件人：王小明 (0912-345-678)
驗證序號：A3B7C2
送餐任務ID：123
------------------------------------------------------------
【台東防災館送餐服務】
親愛的 王小明，您好！

您的送餐服務已安排：
送達日期：2024/01/15
送達時段：12:00-13:00

驗證序號：A3B7C2

請保管好此序號，志工送達時需要此序號完成簽收。

確認連結：https://your-domain.com/confirm-receipt/123

如有疑問，請聯繫我們。
============================================================
```

## 整合真實SMS服務

### 推薦服務提供商

1. **Twilio**（國際知名，支援台灣）
   - 官網：https://www.twilio.com
   - 優點：穩定可靠、文件完整、支援多國
   - 費用：按量計費，約 NT$2-3 / 則

2. **AWS SNS**（Amazon Web Services）
   - 官網：https://aws.amazon.com/sns
   - 優點：整合AWS生態系、價格便宜
   - 費用：約 NT$1-2 / 則

3. **台灣本地SMS服務商**
   - 三竹資訊、詮力科技等
   - 優點：本地支援、中文客服
   - 費用：依合約而定

### 整合步驟（以Twilio為例）

#### 步驟1：註冊Twilio帳號

1. 訪問 https://www.twilio.com/try-twilio
2. 註冊免費試用帳號
3. 驗證手機號碼
4. 取得 Account SID 和 Auth Token

#### 步驟2：購買台灣電話號碼

1. 登入Twilio Console
2. 前往 Phone Numbers → Buy a Number
3. 選擇台灣（+886）號碼
4. 購買號碼（約 USD $1/月）

#### 步驟3：設定環境變數

在專案根目錄的 `.env` 檔案中新增：

```env
# Twilio SMS設定
SMS_SERVICE_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+886912345678
```

#### 步驟4：安裝Twilio SDK

```bash
cd /path/to/taitung-disaster-system
pnpm add twilio
```

#### 步驟5：修改smsService.ts

修改 `server/smsService.ts` 檔案：

```typescript
import twilio from 'twilio';

// 初始化Twilio客戶端
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export async function sendDeliveryNotificationSMS(params: {
  recipientPhone: string;
  recipientName: string;
  verificationCode: string;
  deliveryId: number;
  deliveryDate: Date;
  deliveryTime: string;
}): Promise<{ success: boolean; message: string }> {
  const { recipientPhone, recipientName, verificationCode, deliveryId, deliveryDate, deliveryTime } = params;

  const confirmUrl = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/confirm-receipt/${deliveryId}`;

  const smsContent = `
【台東防災館送餐服務】
親愛的 ${recipientName}，您好！

您的送餐服務已安排：
送達日期：${deliveryDate.toLocaleDateString('zh-TW')}
送達時段：${deliveryTime}

驗證序號：${verificationCode}

請保管好此序號，志工送達時需要此序號完成簽收。

確認連結：${confirmUrl}

如有疑問，請聯繫我們。
`.trim();

  try {
    // 如果有Twilio設定，使用真實SMS發送
    if (twilioClient && process.env.TWILIO_FROM_NUMBER) {
      const message = await twilioClient.messages.create({
        body: smsContent,
        from: process.env.TWILIO_FROM_NUMBER,
        to: recipientPhone,
      });

      console.log(`✅ SMS發送成功！Message SID: ${message.sid}`);
      
      return {
        success: true,
        message: 'SMS sent successfully',
      };
    } else {
      // 模擬模式（開發環境）
      console.log('='.repeat(60));
      console.log('📱 SMS簡訊發送（模擬模式）');
      console.log('='.repeat(60));
      console.log(`收件人：${recipientName} (${recipientPhone})`);
      console.log(`驗證序號：${verificationCode}`);
      console.log(`送餐任務ID：${deliveryId}`);
      console.log('-'.repeat(60));
      console.log(smsContent);
      console.log('='.repeat(60));

      return {
        success: true,
        message: 'SMS sent successfully (simulated)',
      };
    }
  } catch (error) {
    console.error('[SMS Service] Failed to send SMS:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

#### 步驟6：測試真實SMS發送

1. 重新啟動開發伺服器
2. 訪問 `/sms-test` 頁面
3. 輸入真實的台灣手機號碼（格式：0912-345-678）
4. 點擊「發送測試SMS」
5. 檢查手機是否收到簡訊

### 注意事項

1. **手機號碼格式**
   - 台灣手機號碼格式：0912-345-678 或 +886912345678
   - Twilio需要國際格式（+886開頭）
   - 系統會自動轉換格式

2. **簡訊費用**
   - 每則簡訊約 NT$2-3
   - 建議設定每日發送上限
   - 監控簡訊使用量

3. **簡訊內容限制**
   - 單則簡訊最多160個字元（英文）
   - 中文約70個字元
   - 超過會分割為多則簡訊

4. **發送頻率限制**
   - Twilio預設每秒最多1則
   - 可申請提高限制
   - 建議加入發送佇列機制

## 常見問題

### Q1：為什麼測試頁面顯示「模擬模式」？

**A：** 目前系統尚未整合真實SMS服務，所有SMS發送都是模擬的。要啟用真實SMS發送，請依照「整合真實SMS服務」章節的步驟操作。

### Q2：如何查看SMS發送記錄？

**A：** 目前SMS發送記錄會輸出到伺服器console。未來可以建立SMS發送歷史記錄資料表，類似Email發送歷史記錄功能。

### Q3：驗證序號的格式是什麼？

**A：** 驗證序號為6位數英數字混合（大寫），例如：A3B7C2、X9Y2K5。每個送餐任務的序號都是唯一的。

### Q4：收餐人沒有智慧型手機怎麼辦？

**A：** 志工可以在送餐時直接告知驗證序號，收餐人可以透過其他方式（如家人的手機）完成簽收。系統也支援志工代為確認收餐。

### Q5：如何測試完整的簽收流程？

**A：** 
1. 建立送餐任務（記錄產生的驗證序號）
2. 訪問收餐確認頁面 `/confirm-receipt/{deliveryId}`
3. 輸入驗證序號
4. 完成簽收（系統會記錄時間和GPS位置）

### Q6：SMS發送失敗怎麼辦？

**A：** 
1. 檢查環境變數是否正確設定
2. 確認Twilio帳號餘額充足
3. 驗證手機號碼格式正確
4. 查看伺服器console的錯誤訊息
5. 檢查Twilio Console的發送記錄

## 相關文件

- [Email通知功能說明](BOOKING_EMAIL_NOTIFICATION_GUIDE.md)
- [預約提醒排程任務說明](BOOKING_REMINDER_GUIDE.md)
- [送餐服務使用說明](MEAL_DELIVERY_GUIDE.md)

## 技術支援

如有問題，請聯繫系統管理員或查看：
- Twilio文件：https://www.twilio.com/docs
- 專案GitHub：https://github.com/your-repo
- 系統管理員Email：admin@example.com
