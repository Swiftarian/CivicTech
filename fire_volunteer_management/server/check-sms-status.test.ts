import { describe, expect, it } from "vitest";
import twilio from "twilio";

describe("檢查SMS發送狀態", () => {
  it("應該能夠查詢最近發送的簡訊狀態", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const client = twilio(accountSid, authToken);

    console.log("=".repeat(60));
    console.log("📱 查詢最近發送的簡訊狀態...");
    console.log("=".repeat(60));

    // 取得最近發送的簡訊（最多10則）
    const messages = await client.messages.list({ limit: 10 });

    console.log(`\n找到 ${messages.length} 則最近發送的簡訊：\n`);

    messages.forEach((msg, index) => {
      console.log(`${index + 1}. Message SID: ${msg.sid}`);
      console.log(`   發送至: ${msg.to}`);
      console.log(`   發送自: ${msg.from}`);
      console.log(`   狀態: ${msg.status}`);
      console.log(`   錯誤代碼: ${msg.errorCode || "無"}`);
      console.log(`   錯誤訊息: ${msg.errorMessage || "無"}`);
      console.log(`   發送時間: ${msg.dateCreated}`);
      console.log(`   價格: ${msg.price || "計算中"} ${msg.priceUnit || ""}`);
      console.log("-".repeat(60));
    });

    // 檢查是否有發送到測試號碼的簡訊
    const testMessage = messages.find(msg => msg.to === "+886972911502");

    if (testMessage) {
      console.log("\n✅ 找到發送到測試號碼的簡訊：");
      console.log(`   Message SID: ${testMessage.sid}`);
      console.log(`   當前狀態: ${testMessage.status}`);

      // 狀態說明
      const statusExplanation: Record<string, string> = {
        queued: "已排隊等待發送",
        sending: "正在發送中",
        sent: "已發送（等待電信商確認）",
        delivered: "已成功送達",
        undelivered: "發送失敗",
        failed: "發送失敗",
      };

      console.log(
        `   狀態說明: ${statusExplanation[testMessage.status] || "未知狀態"}`
      );

      if (testMessage.errorCode) {
        console.log(`   ❌ 錯誤代碼: ${testMessage.errorCode}`);
        console.log(`   ❌ 錯誤訊息: ${testMessage.errorMessage}`);
      }

      if (testMessage.status === "delivered") {
        console.log("\n🎉 簡訊已成功送達！請檢查手機");
      } else if (
        testMessage.status === "undelivered" ||
        testMessage.status === "failed"
      ) {
        console.log("\n⚠️  簡訊發送失敗，請檢查錯誤訊息");
      } else {
        console.log("\n⏳ 簡訊還在處理中，請稍等片刻...");
      }
    } else {
      console.log("\n⚠️  未找到發送到 +886972911502 的簡訊");
    }

    console.log("=".repeat(60));

    expect(messages.length).toBeGreaterThan(0);
  }, 30000);
});
