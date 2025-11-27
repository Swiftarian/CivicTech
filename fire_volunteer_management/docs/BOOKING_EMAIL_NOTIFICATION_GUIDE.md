# 預約Email通知功能說明

## 功能概述

當民眾或團體在台東防災館網站完成預約後，系統會自動發送Email確認信給預約者，信件中包含：
- 案件編號（用於查詢和報到）
- 預約詳細資訊（日期、時段、人數）
- 溫馨提醒事項
- 聯絡資訊

---

## 功能特色

### 1. 自動發送
- 預約成功後立即發送Email
- 無需管理員手動操作
- 提升使用者體驗

### 2. 雙範本設計
- **民眾預約範本**：適用於1-19人的個人或小團體預約
- **團體預約範本**：適用於20人以上的機關學校團體預約

### 3. 專業設計
- HTML格式郵件，美觀易讀
- 蘋果綠主題配色，與網站風格一致
- 包含重要資訊區塊和溫馨提醒

---

## Email內容說明

### 民眾預約確認信

**主旨**：【台東防災館】預約確認通知 - 案件編號 BK1234567890

**內容包含**：
- 預約資訊區塊（案件編號、參訪日期、時段、人數）
- 溫馨提醒（提早10分鐘抵達、出示案件編號、取消變更規定）
- 聯絡資訊（地址、電話、Email）

**範例**：
```
親愛的 張三，您好：

感謝您預約台東防災館參訪服務，您的預約已經成功建立！

預約資訊：
案件編號：BK1701234567890
參訪日期：2024/12/01
參訪時段：10:00-12:00
參訪人數：5人

温馨提醒：
• 請於參訪當日提早10分鐘抵達
• 請出示此案件編號：BK1701234567890
• 如需取消或變更，請至少於參訪日前3天聯繫

聯繫資訊：
地址：台東市更生北路616巷9號
電話：(089) XXX-XXXX
Email: info@taitung-disaster.gov.tw

期待您的到訪！
```

---

### 團體預約確認信

**主旨**：【台東防災館】團體預約確認通知 - 案件編號 BK1234567890

**內容包含**：
- 預約資訊區塊（案件編號、單位名稱、聯絡人、日期、時段、人數）
- 溫馨提醒（專業導覽員、提早15分鐘抵達、出示案件編號、取消變更規定）
- 聯絡資訊

**範例**：
```
台東國小 李四，您好：

感謝貴單位預約台東防災館團體參訪服務，您的預約已經成功建立！

預約資訊：
案件編號：BK1701234567890
單位名稱：台東國小
聯絡人：李四
參訪日期：2024/12/15
參訪時段：14:00-16:00
參訪人數：30人

温馨提醒：
• 我們將為貴單位安排專業導覽員
• 請於參訪當日提早15分鐘抵達
• 請出示此案件編號：BK1701234567890
• 如需取消或變更，請至少於參訪日前7天聯繫

聯繫資訊：
地址：台東市更生北路616巷9號
電話：(089) XXX-XXXX
Email: info@taitung-disaster.gov.tw

期待貴單位的到訪！
```

---

## 技術實作說明

### 1. Email服務模組

**檔案位置**：`server/emailService.ts`

**主要函數**：
- `sendPublicBookingConfirmationEmail()` - 發送民眾預約確認信
- `sendGroupBookingConfirmationEmail()` - 發送團體預約確認信
- `sendEmail()` - 基礎Email發送函數

**參數說明**：

```typescript
// 民眾預約確認信
sendPublicBookingConfirmationEmail(
  recipientEmail: string,      // 收件人Email
  recipientName: string,        // 收件人姓名
  bookingNumber: string,        // 案件編號
  visitDate: string,            // 參訪日期（格式化後）
  visitTime: string,            // 參訪時段
  visitorCount: number          // 參訪人數
)

// 團體預約確認信
sendGroupBookingConfirmationEmail(
  recipientEmail: string,       // 收件人Email
  organizationName: string,     // 單位名稱
  contactPerson: string,        // 聯絡人
  bookingNumber: string,        // 案件編號
  visitDate: string,            // 參訪日期
  visitTime: string,            // 參訪時段
  visitorCount: number          // 參訪人數
)
```

---

### 2. API整合

**檔案位置**：`server/routers.ts`

**整合位置**：`bookings.create` mutation

**流程**：
1. 建立預約記錄
2. 生成案件編號
3. 檢查是否提供Email
4. 根據預約類型選擇Email範本
5. 發送Email通知
6. 回傳預約結果

**程式碼片段**：
```typescript
// 發送Email通知（如果有提供Email）
if (input.contactEmail) {
  const visitDate = input.visitDate.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  if (input.type === 'group' && input.organizationName) {
    // 團體預約
    await sendGroupBookingConfirmationEmail(
      input.contactEmail,
      input.organizationName,
      input.contactName,
      bookingNumber,
      visitDate,
      input.visitTime,
      input.numberOfPeople
    );
  } else {
    // 民眾預約
    await sendPublicBookingConfirmationEmail(
      input.contactEmail,
      input.contactName,
      bookingNumber,
      visitDate,
      input.visitTime,
      input.numberOfPeople
    );
  }
}
```

---

### 3. 單元測試

**檔案位置**：`server/bookings.email-notification.test.ts`

**測試案例**：
1. ✅ 民眾預約成功後發送Email通知
2. ✅ 團體預約成功後發送Email通知
3. ✅ 未提供Email時不發送通知
4. ✅ Email發送失敗時預約仍成功
5. ✅ 團體預約但未提供組織名稱時使用民眾範本

**執行測試**：
```bash
pnpm test bookings.email-notification.test.ts
```

---

## Email服務配置

### 目前狀態：模擬模式

目前系統使用 `console.log` 模擬Email發送，所有Email內容會輸出到伺服器日誌中。

**日誌範例**：
```
=== 發送Email ===
收件人: zhang@example.com
主旨: 【台東防災館】預約確認通知 - 案件編號 BK1701234567890
內容: 親愛的 張三，您好：...
================
```

---

### 整合真實Email服務

實際部署時，可以整合以下任一Email服務：

#### 選項1：Nodemailer + SMTP

**安裝套件**：
```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

**環境變數**：
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=台東防災館 <noreply@taitung-disaster.gov.tw>
```

**修改 `emailService.ts`**：
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('發送Email失敗:', error);
    return false;
  }
}
```

---

#### 選項2：SendGrid

**安裝套件**：
```bash
pnpm add @sendgrid/mail
```

**環境變數**：
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@taitung-disaster.gov.tw
```

**修改 `emailService.ts`**：
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await sgMail.send({
      from: process.env.SENDGRID_FROM_EMAIL!,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('發送Email失敗:', error);
    return false;
  }
}
```

---

#### 選項3：AWS SES

**安裝套件**：
```bash
pnpm add @aws-sdk/client-ses
```

**環境變數**：
```env
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_FROM_EMAIL=noreply@taitung-disaster.gov.tw
```

**修改 `emailService.ts`**：
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL,
      Destination: { ToAddresses: [options.to] },
      Message: {
        Subject: { Data: options.subject },
        Body: {
          Text: { Data: options.text },
          Html: { Data: options.html || options.text },
        },
      },
    });
    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('發送Email失敗:', error);
    return false;
  }
}
```

---

## 使用Gmail SMTP的詳細步驟

如果要使用Gmail作為SMTP伺服器（適合小型部署）：

### 1. 啟用Gmail兩步驟驗證
1. 前往 Google 帳戶設定
2. 選擇「安全性」
3. 啟用「兩步驟驗證」

### 2. 建立應用程式密碼
1. 在「安全性」頁面中選擇「應用程式密碼」
2. 選擇「郵件」和「其他裝置」
3. 輸入名稱（例如：台東防災館）
4. 複製生成的16位密碼

### 3. 設定環境變數
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # 應用程式密碼
SMTP_FROM=台東防災館 <your-gmail@gmail.com>
```

### 4. Gmail限制
- 每日發送上限：500封
- 適合小型網站使用
- 大型網站建議使用專業Email服務

---

## 常見問題

### Q1: Email沒有發送成功怎麼辦？

**檢查步驟**：
1. 確認預約時有填寫Email欄位
2. 檢查伺服器日誌是否有錯誤訊息
3. 確認Email服務配置是否正確
4. 測試SMTP連線是否正常

**注意**：即使Email發送失敗，預約仍會成功建立，不會影響使用者體驗。

---

### Q2: 如何測試Email功能？

**方法1：使用模擬模式**
- 查看伺服器日誌中的Email內容
- 確認內容格式正確

**方法2：使用測試Email服務**
- 使用 [Mailtrap](https://mailtrap.io/) 或 [MailHog](https://github.com/mailhog/MailHog)
- 捕獲所有發送的Email進行測試

**方法3：執行單元測試**
```bash
pnpm test bookings.email-notification.test.ts
```

---

### Q3: 如何自訂Email範本？

**修改位置**：`server/emailService.ts`

**可自訂內容**：
- Email主旨
- 文字內容
- HTML樣式
- 聯絡資訊
- 溫馨提醒事項

**範例**：修改聯絡電話
```typescript
text += `電話：(089) 123-4567\n`;  // 改為實際電話

// HTML版本也要同步修改
<p style="margin: 5px 0;">電話：(089) 123-4567</p>
```

---

### Q4: Email會發送給誰？

- **民眾預約**：發送給填寫的聯絡人Email
- **團體預約**：發送給填寫的聯絡人Email
- **未填Email**：不發送Email（預約仍成功）

---

### Q5: 可以同時發送給多個收件人嗎？

可以！修改 `sendEmail` 函數支援多個收件人：

```typescript
interface EmailOptions {
  to: string | string[];  // 支援單一或多個收件人
  subject: string;
  text: string;
  html?: string;
}
```

---

## 未來改進建議

### 1. 新增更多Email範本
- 預約取消通知
- 預約變更通知
- 參訪前一天提醒
- 參訪後感謝信

### 2. Email排程發送
- 參訪前3天自動發送提醒信
- 參訪後自動發送問卷調查

### 3. Email統計分析
- 發送成功率
- 開信率追蹤
- 點擊率分析

### 4. 個人化內容
- 根據預約類型客製化內容
- 加入預約者歷史參訪記錄
- 推薦相關活動

---

## 相關文件

- [志工管理與請假系統使用說明](VOLUNTEER_MANAGEMENT_GUIDE.md)
- [送餐服務使用說明](MEAL_DELIVERY_GUIDE.md)
- [Railway部署指南](RAILWAY_DEPLOYMENT.md)
- [系統功能清單](../todo.md)

---

## 技術支援

如有任何問題或建議，請聯繫系統開發團隊。

**最後更新**：2024年11月23日
