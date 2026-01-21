import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("LINE Integration", () => {
  it("should get LINE bot info", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.recipients.getLineBotInfo();

    expect(result).toHaveProperty("basicId");
    expect(result).toHaveProperty("qrCodeUrl");
    expect(result).toHaveProperty("addFriendUrl");
    expect(result.basicId).toBe(process.env.LINE_BOT_BASIC_ID);
    expect(result.qrCodeUrl).toContain("line.me/R/ti/p/");
    expect(result.addFriendUrl).toContain("line.me/R/ti/p/");

    console.log(
      "[LINE Integration Test] ✅ LINE bot info retrieved successfully"
    );
    console.log(`[LINE Integration Test] Bot Basic ID: ${result.basicId}`);
    console.log(`[LINE Integration Test] QR Code URL: ${result.qrCodeUrl}`);
  });

  it("should create recipient", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const testPhone = `0912${Date.now().toString().slice(-6)}`;

    const result = await caller.recipients.create({
      name: "測試收餐人",
      phone: testPhone,
      address: "台東市測試路123號",
      notes: "單元測試用",
    });

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("測試收餐人");
    expect(result.phone).toBe(testPhone);
    expect(result.address).toBe("台東市測試路123號");
    expect(result.lineUserId).toBeNull();
    expect(result.preferredNotificationMethod).toBe("sms");

    console.log("[LINE Integration Test] ✅ Recipient created successfully");
    console.log(`[LINE Integration Test] Recipient ID: ${result.id}`);

    // 清理測試資料
    await caller.recipients.delete({ id: result.id });
  });

  it("should get all recipients", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.recipients.getAll();

    expect(Array.isArray(result)).toBe(true);
    console.log(
      `[LINE Integration Test] ✅ Retrieved ${result.length} recipients`
    );
  });
});
