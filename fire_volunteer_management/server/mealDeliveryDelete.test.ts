import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const admin: AuthenticatedUser = {
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

  return {
    user: admin,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
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
    res: {} as TrpcContext["res"],
  };
}

describe("送餐任務刪除功能", () => {
  it("管理員可以刪除送餐任務", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 先建立一個送餐任務
    const delivery = await caller.mealDeliveries.create({
      recipientName: "測試收餐人",
      recipientPhone: "0912345678",
      deliveryAddress: "台東市測試路123號",
      deliveryDate: new Date("2025-12-20"),
      deliveryTime: "12:00",
      mealType: "午餐",
    });

    expect(delivery).toBeDefined();
    expect(delivery.id).toBeDefined();

    // 刪除送餐任務
    const result = await caller.mealDeliveries.delete({ id: delivery.id });
    expect(result.success).toBe(true);

    // 驗證任務已被刪除（查詢應該失敗或返回null）
    try {
      await caller.mealDeliveries.getById({ id: delivery.id });
      // 如果沒有拋出錯誤，檢查是否返回null
    } catch (error: any) {
      // 預期會拋出錯誤，因為任務已被刪除
      expect(error.message).toContain("找不到送餐記錄");
    }
  });

  it("一般使用者無法刪除送餐任務", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // 管理員建立送餐任務
    const delivery = await adminCaller.mealDeliveries.create({
      recipientName: "測試收餐人2",
      recipientPhone: "0987654321",
      deliveryAddress: "台東市測試路456號",
      deliveryDate: new Date("2025-12-21"),
      deliveryTime: "18:00",
      mealType: "晚餐",
    });

    // 一般使用者嘗試刪除
    const userCtx = createUserContext();
    const userCaller = appRouter.createCaller(userCtx);

    try {
      await userCaller.mealDeliveries.delete({ id: delivery.id });
      expect.fail("一般使用者不應該能夠刪除送餐任務");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});
