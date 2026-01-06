import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { mealDeliveries } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-volunteer",
    email: "volunteer@test.com",
    name: "Test Volunteer",
    loginMethod: "manus",
    role: "volunteer",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("QR Code收餐確認功能", () => {
  let testDeliveryId: number;

  beforeAll(async () => {
    // 建立測試用送餐任務
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [result] = await db.insert(mealDeliveries).values({
      deliveryNumber: `TEST${Date.now()}`,
      recipientName: "測試收餐人",
      recipientPhone: "0912-345-678",
      deliveryAddress: "台東市測試路100號",
      deliveryDate: new Date(),
      deliveryTime: "12:00-13:00",
      status: "in_transit",
    });

    testDeliveryId = Number(result.insertId);
    console.log("Test delivery ID:", testDeliveryId);
  });

  it("應該成功生成送餐任務的QR Code", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mealDeliveries.getQRCode({
      deliveryId: testDeliveryId,
    });

    expect(result).toBeDefined();
    expect(result.deliveryId).toBe(testDeliveryId);
    expect(result.qrCodeDataUrl).toContain("data:image/png;base64");
    expect(result.confirmUrl).toContain(`/confirm-receipt/${testDeliveryId}`);
  });

  it("應該拒絕不存在的送餐任務生成QR Code", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mealDeliveries.getQRCode({
        deliveryId: 999999,
      })
    ).rejects.toThrow("Delivery not found");
  });

  it("應該成功確認收餐", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const confirmResult = await caller.mealDeliveries.confirmReceipt({
      deliveryId: testDeliveryId,
    });

    expect(confirmResult.success).toBe(true);
    expect(confirmResult.message).toBe("Receipt confirmed successfully");
  });
});
