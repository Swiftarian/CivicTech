import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("mealDeliveries.confirmReceiptByCode", () => {
  it("應該能夠只用驗證碼確認收餐（不需要deliveryId）", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 1. 建立測試送餐任務
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人",
      recipientPhone: "0912345678",
      deliveryAddress: "台東市測試路123號",
      deliveryDate: new Date(Date.now() + 86400000), // 明天
      deliveryTime: "12:00",
      mealType: "午餐",
    });

    expect(delivery.verificationCode).toBeDefined();
    expect(delivery.verificationCode?.length).toBe(6);

    // 2. 使用驗證碼確認收餐（不需要deliveryId）
    const result = await caller.mealDeliveries.confirmReceiptByCode({
      verificationCode: delivery.verificationCode!,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("收餐確認成功");
    expect(result.deliveryNumber).toBe(delivery.deliveryNumber);
    expect(result.volunteerName).toBeDefined();
  });

  it("應該拒絕錯誤的驗證碼", async () => {
    await expect(async () => {
      const { ctx } = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await caller.mealDeliveries.confirmReceiptByCode({
        verificationCode: "WRONG1",
      });
    }).rejects.toThrow("驗證碼錯誤或送餐任務不存在");
  });

  it("應該拒絕重複確認收餐", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 1. 建立測試送餐任務
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人2",
      recipientPhone: "0912345679",
      deliveryAddress: "台東市測試路456號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
      mealType: "午餐",
    });

    // 2. 第一次確認
    await caller.mealDeliveries.confirmReceiptByCode({
      verificationCode: delivery.verificationCode!,
    });

    // 3. 第二次確認應該失敗
    await expect(async () => {
      await caller.mealDeliveries.confirmReceiptByCode({
        verificationCode: delivery.verificationCode!,
      });
    }).rejects.toThrow("此送餐任務已經確認收餐");
  });

  it("應該驗證驗證碼長度必須是6位", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(async () => {
      await caller.mealDeliveries.confirmReceiptByCode({
        verificationCode: "ABC", // 只有3位
      });
    }).rejects.toThrow();

    await expect(async () => {
      await caller.mealDeliveries.confirmReceiptByCode({
        verificationCode: "ABCDEFGH", // 8位
      });
    }).rejects.toThrow();
  });

  it("應該回傳送餐志工姓名", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 1. 建立測試送餐任務
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人3",
      recipientPhone: "0912345680",
      deliveryAddress: "台東市測試路789號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
      mealType: "午餐",
    });

    // 2. 確認收餐
    const result = await caller.mealDeliveries.confirmReceiptByCode({
      verificationCode: delivery.verificationCode!,
    });

    // 3. 驗證回傳資料
    expect(result.volunteerName).toBeDefined();
    expect(typeof result.volunteerName).toBe("string");
    expect(result.deliveryNumber).toBe(delivery.deliveryNumber);
  });
});
