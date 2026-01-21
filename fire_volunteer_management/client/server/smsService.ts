/**
 * SMS簡訊發送服務
 * 整合Twilio發送真實簡訊，未設定憑證時使用console.log模擬
 */

import twilio from 'twilio';

// 初始化Twilio客戶端
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * 轉換台灣手機號碼格式為國際格式
 * 例：0912-345-678 -> +886912345678
 */
function formatPhoneNumber(phone: string): string {
  // 移除所有非數字字元
  const cleaned = phone.replace(/\D/g, '');
  
  // 如果已經是國際格式，直接返回
  if (phone.startsWith('+')) {
    return phone.replace(/\D/g, '').replace(/^/, '+');
  }
  
  // 如果以0開頭，轉換為+886
  if (cleaned.startsWith('0')) {
    return `+886${cleaned.substring(1)}`;
  }
  
  // 如果已經是886開頭，加上+
  if (cleaned.startsWith('886')) {
    return `+${cleaned}`;
  }
  
  // 預設視為台灣號碼
  return `+886${cleaned}`;
}

/**
 * 產生6位數隨機驗證序號
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 發送送餐通知簡訊給收餐人
 */
export async function sendDeliveryNotificationSMS(params: {
  recipientPhone: string;
  recipientName: string;
  verificationCode: string;
  deliveryId: number;
  deliveryDate: Date;
  deliveryTime: string;
}): Promise<{ success: boolean; message: string }> {
  const { recipientPhone, recipientName, verificationCode, deliveryId, deliveryDate, deliveryTime } = params;

  // 建立確認連結
  const confirmUrl = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/confirm-receipt/${deliveryId}`;

  // 簡訊內容
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
      const formattedPhone = formatPhoneNumber(recipientPhone);
      
      console.log('='.repeat(60));
      console.log('📱 SMS簡訊發送（Twilio）');
      console.log('='.repeat(60));
      console.log(`收件人：${recipientName} (${recipientPhone} -> ${formattedPhone})`);
      console.log(`驗證序號：${verificationCode}`);
      console.log(`送餐任務ID：${deliveryId}`);
      console.log('-'.repeat(60));
      
      const message = await twilioClient.messages.create({
        body: smsContent,
        from: process.env.TWILIO_FROM_NUMBER,
        to: formattedPhone,
      });

      console.log(`✅ SMS發送成功！Message SID: ${message.sid}`);
      console.log(`狀態：${message.status}`);
      console.log('='.repeat(60));
      
      return {
        success: true,
        message: `SMS sent successfully via Twilio (SID: ${message.sid})`,
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
      console.log('⚠️  模擬模式：請設定TWILIO_ACCOUNT_SID、TWILIO_AUTH_TOKEN、TWILIO_FROM_NUMBER環境變數以啟用真實SMS發送');
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

/**
 * 發送送餐提醒簡訊（送達前提醒）
 */
export async function sendDeliveryReminderSMS(params: {
  recipientPhone: string;
  recipientName: string;
  verificationCode: string;
  estimatedTime: string;
}): Promise<{ success: boolean; message: string }> {
  const { recipientPhone, recipientName, verificationCode, estimatedTime } = params;

  const smsContent = `
【台東防災館送餐服務】
親愛的 ${recipientName}，您好！

您的餐點預計在 ${estimatedTime} 送達。

驗證序號：${verificationCode}

請準備好此序號，志工送達時需要此序號完成簽收。
`.trim();

  try {
    console.log('='.repeat(60));
    console.log('📱 SMS提醒簡訊發送');
    console.log('='.repeat(60));
    console.log(`收件人：${recipientName} (${recipientPhone})`);
    console.log(`驗證序號：${verificationCode}`);
    console.log(`預計送達：${estimatedTime}`);
    console.log('-'.repeat(60));
    console.log(smsContent);
    console.log('='.repeat(60));

    return {
      success: true,
      message: 'SMS reminder sent successfully (simulated)',
    };
  } catch (error) {
    console.error('[SMS Service] Failed to send reminder SMS:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
