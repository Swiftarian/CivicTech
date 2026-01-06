import { describe, expect, it } from "vitest";
import twilio from 'twilio';

describe("Twilio憑證驗證", () => {
  it("應該能夠使用提供的憑證連接Twilio API", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    // 驗證環境變數已設定
    expect(accountSid).toBeDefined();
    expect(authToken).toBeDefined();
    expect(fromNumber).toBeDefined();

    // 驗證格式
    expect(accountSid).toMatch(/^AC[a-f0-9]{32}$/);
    expect(authToken).toMatch(/^[a-f0-9]{32}$/);
    expect(fromNumber).toMatch(/^\+\d{11,15}$/);

    // 初始化Twilio客戶端
    const client = twilio(accountSid, authToken);

    // 驗證Account資訊（輕量級API呼叫）
    const account = await client.api.v2010.accounts(accountSid).fetch();
    
    expect(account.sid).toBe(accountSid);
    expect(account.status).toBe('active');
    
    console.log('✅ Twilio憑證驗證成功！');
    console.log(`Account SID: ${account.sid}`);
    console.log(`Account Status: ${account.status}`);
    console.log(`發送號碼: ${fromNumber}`);
  }, 30000); // 30秒超時

  it("應該能夠驗證購買的電話號碼", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    const client = twilio(accountSid, authToken);

    // 取得帳號下的電話號碼列表
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });

    // 驗證購買的號碼存在
    const purchasedNumber = phoneNumbers.find(num => num.phoneNumber === fromNumber);
    
    expect(purchasedNumber).toBeDefined();
    expect(purchasedNumber?.capabilities.sms).toBe(true);
    
    console.log('✅ 電話號碼驗證成功！');
    console.log(`號碼: ${purchasedNumber?.phoneNumber}`);
    console.log(`SMS功能: ${purchasedNumber?.capabilities.sms ? '已啟用' : '未啟用'}`);
  }, 30000);
});
