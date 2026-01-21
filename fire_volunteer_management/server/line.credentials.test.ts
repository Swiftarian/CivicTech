import { describe, expect, it } from "vitest";

/**
 * LINE Messaging API 憑證驗證測試
 *
 * 此測試會驗證LINE憑證是否有效，透過呼叫LINE API檢查Channel Access Token
 */
describe("LINE Messaging API Credentials", () => {
  it("should have valid LINE credentials configured", async () => {
    // 檢查環境變數是否存在
    expect(process.env.LINE_CHANNEL_ID).toBeDefined();
    expect(process.env.LINE_CHANNEL_SECRET).toBeDefined();
    expect(process.env.LINE_CHANNEL_ACCESS_TOKEN).toBeDefined();
    expect(process.env.LINE_BOT_BASIC_ID).toBeDefined();

    // 驗證Channel Access Token是否有效
    const response = await fetch("https://api.line.me/v2/bot/info", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    });

    expect(response.ok).toBe(true);

    const data = await response.json();

    // 驗證返回的資料包含必要欄位
    expect(data).toHaveProperty("userId");
    expect(data).toHaveProperty("basicId");
    expect(data).toHaveProperty("displayName");

    // 驗證Basic ID是否匹配
    expect(data.basicId).toBe(process.env.LINE_BOT_BASIC_ID);

    console.log("[LINE Credentials Test] ✅ LINE credentials are valid");
    console.log(`[LINE Credentials Test] Bot Name: ${data.displayName}`);
    console.log(`[LINE Credentials Test] Bot Basic ID: ${data.basicId}`);
  });
});
