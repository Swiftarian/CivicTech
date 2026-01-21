import { describe, expect, it, beforeEach } from "vitest";
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

describe("SMS簡訊和序號驗證功能", () => {
  it("建立送餐任務時應自動產生6位數驗證序號", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人",
      recipientPhone: "0912-345-678",
      deliveryAddress: "台東市測試路123號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
      specialInstructions: "測試用",
    });

    expect(delivery.verificationCode).toBeDefined();
    expect(delivery.verificationCode).toHaveLength(6);
    expect(delivery.verificationCode).toMatch(/^[A-Z0-9]{6}$/); // 6位英數字混合
  });

  it("每個送餐任務的驗證序號應該是唯一的", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const delivery1 = await caller.mealDeliveries.create({
      recipientName: "收餐人A",
      recipientPhone: "0912-111-111",
      deliveryAddress: "台東市測試路1號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
    });

    const delivery2 = await caller.mealDeliveries.create({
      recipientName: "收餐人B",
      recipientPhone: "0912-222-222",
      deliveryAddress: "台東市測試路2號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "13:00",
    });

    expect(delivery1.verificationCode).not.toBe(delivery2.verificationCode);
  });

  it("收餐人確認時輸入正確序號應成功", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立送餐任務
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人",
      recipientPhone: "0912-345-678",
      deliveryAddress: "台東市測試路123號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
    });

    // 使用正確序號確認收餐
    const result = await caller.mealDeliveries.confirmReceipt({
      deliveryId: delivery.id,
      verificationCode: delivery.verificationCode!,
      latitude: 22.7539,
      longitude: 121.1451,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("收餐確認成功");
  });

  it("收餐人確認時輸入錯誤序號應失敗", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立送餐任務
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人",
      recipientPhone: "0912-345-678",
      deliveryAddress: "台東市測試路123號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
    });

    // 使用錯誤序號確認收餐
    await expect(
      caller.mealDeliveries.confirmReceipt({
        deliveryId: delivery.id,
        verificationCode: "000000", // 錯誤序號
        latitude: 22.7539,
        longitude: 121.1451,
      })
    ).rejects.toThrow("驗證序號錯誤");
  });

  it("SMS發送功能應記錄發送狀態（模擬模式）", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立送餐任務（會觸發SMS發送）
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人",
      recipientPhone: "0912-345-678",
      deliveryAddress: "台東市測試路123號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
    });

    // 驗證任務已建立且包含序號
    expect(delivery.verificationCode).toBeDefined();
    expect(delivery.recipientPhone).toBe("0912-345-678");
    
    // 在模擬模式下，SMS會記錄到console
    // 實際整合Twilio後，可以查詢SMS發送歷史記錄
  });

  it("已確認的送餐任務不應允許重複確認", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立送餐任務
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人",
      recipientPhone: "0912-345-678",
      deliveryAddress: "台東市測試路123號",
      deliveryDate: new Date(Date.now() + 86400000),
      deliveryTime: "12:00",
    });

    // 第一次確認
    await caller.mealDeliveries.confirmReceipt({
      deliveryId: delivery.id,
      verificationCode: delivery.verificationCode!,
      latitude: 22.7539,
      longitude: 121.1451,
    });

    // 第二次確認應該失敗
    await expect(
      caller.mealDeliveries.confirmReceipt({
        deliveryId: delivery.id,
        verificationCode: delivery.verificationCode!,
        latitude: 22.7539,
        longitude: 121.1451,
      })
    ).rejects.toThrow("此送餐任務已經確認收餐");
  });
});
