import { describe, expect, it } from "vitest";
import { sendDeliveryNotificationSMS, generateVerificationCode } from "./smsService";

describe("真實SMS發送測試", () => {
  it("應該能夠發送真實簡訊到台灣手機", async () => {
    const verificationCode = generateVerificationCode();
    const testPhone = "0972911502"; // 用戶提供的測試手機號碼
    
    console.log('='.repeat(60));
    console.log('🚀 開始測試發送真實簡訊...');
    console.log('='.repeat(60));
    console.log(`目標手機: ${testPhone}`);
    console.log(`驗證序號: ${verificationCode}`);
    console.log('-'.repeat(60));

    const result = await sendDeliveryNotificationSMS({
      recipientPhone: testPhone,
      recipientName: "測試收餐人",
      verificationCode: verificationCode,
      deliveryId: 999,
      deliveryDate: new Date(),
      deliveryTime: "12:00-13:00",
    });

    console.log('-'.repeat(60));
    console.log('📱 發送結果:');
    console.log(`成功: ${result.success}`);
    console.log(`訊息: ${result.message}`);
    console.log('='.repeat(60));

    expect(result.success).toBe(true);
    expect(result.message).toContain('Twilio');
    
    console.log('');
    console.log('✅ 簡訊已發送！請檢查手機 0972-911-502 是否收到簡訊');
    console.log('');
    console.log('📋 簡訊內容應包含：');
    console.log('  - 收餐人姓名：測試收餐人');
    console.log(`  - 驗證序號：${verificationCode}`);
    console.log('  - 送達日期和時段');
    console.log('  - 確認連結');
    console.log('');
  }, 30000); // 30秒超時
});
