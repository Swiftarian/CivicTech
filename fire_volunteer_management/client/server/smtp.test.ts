import { describe, expect, it } from "vitest";
import { sendEmail } from "./emailService";

describe("SMTP連線驗證", () => {
  it("應該能夠成功發送測試Email", async () => {
    // 發送測試Email到設定的SMTP帳號
    const testEmail = process.env.SMTP_USER || "test@example.com";
    
    const result = await sendEmail(
      {
        to: testEmail,
        subject: "【台東防災館】SMTP連線測試",
        text: "這是一封SMTP連線測試Email。如果您收到這封信，表示SMTP設定成功！",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">SMTP連線測試成功！</h2>
            <p>這是一封SMTP連線測試Email。</p>
            <p>如果您收到這封信，表示以下設定正確：</p>
            <ul>
              <li>SMTP_HOST: ${process.env.SMTP_HOST}</li>
              <li>SMTP_PORT: ${process.env.SMTP_PORT}</li>
              <li>SMTP_USER: ${process.env.SMTP_USER}</li>
              <li>SMTP連線: ✓ 成功</li>
            </ul>
            <p style="color: #16a34a; font-weight: bold;">系統現在可以正常發送Email給預約民眾了！</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">台東防災館管理系統</p>
          </div>
        `,
      },
      {
        emailType: "smtp_test",
        recipientName: "系統管理員",
        isTest: true,
      }
    );

    // 驗證發送結果
    expect(result).toBe(true);
    
    console.log("✓ SMTP測試Email已發送");
    console.log(`✓ 收件人: ${testEmail}`);
    console.log("✓ 請檢查您的信箱（包含垃圾郵件資料夾）");
  }, 30000); // 設定30秒timeout，因為SMTP連線可能需要時間
});
