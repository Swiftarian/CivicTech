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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createNonAdminContext(): { ctx: TrpcContext } {
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

describe("SMS測試功能", () => {
  it("管理員應該能夠發送測試SMS", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.smsTest.testDeliveryNotification({
      recipientPhone: "0912-345-678",
      recipientName: "測試收餐人",
    });

    expect(result.success).toBe(true);
    expect(result.verificationCode).toBeDefined();
    expect(result.verificationCode).toHaveLength(6);
    expect(result.deliveryNumber).toMatch(/^TEST\d+$/);
    expect(result.smsContent).toContain("測試收餐人");
    expect(result.smsContent).toContain(result.verificationCode);
    expect(result.smsContent).toContain("台東防災館送餐服務");
    expect(result.message).toContain("SMS發送成功");
  });

  it("非管理員應該無法發送測試SMS", async () => {
    const { ctx } = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.smsTest.testDeliveryNotification({
        recipientPhone: "0912-345-678",
        recipientName: "測試收餐人",
      })
    ).rejects.toThrow("需要管理員權限");
  });

  it("SMS內容應包含所有必要資訊", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.smsTest.testDeliveryNotification({
      recipientPhone: "0987-654-321",
      recipientName: "王小明",
    });

    expect(result.smsContent).toContain("王小明");
    expect(result.smsContent).toContain("送達日期");
    expect(result.smsContent).toContain("送達時段");
    expect(result.smsContent).toContain("驗證序號");
    expect(result.smsContent).toContain("確認連結");
    expect(result.smsContent).toContain("confirm-receipt");
  });

  it("每次測試應產生不同的驗證序號", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result1 = await caller.smsTest.testDeliveryNotification({
      recipientPhone: "0912-345-678",
      recipientName: "測試A",
    });

    // 等待一毫秒以確保timestamp不同
    await new Promise(resolve => setTimeout(resolve, 1));

    const result2 = await caller.smsTest.testDeliveryNotification({
      recipientPhone: "0912-345-678",
      recipientName: "測試B",
    });

    expect(result1.verificationCode).not.toBe(result2.verificationCode);
    expect(result1.deliveryNumber).not.toBe(result2.deliveryNumber);
  });

  it("驗證序號格式應為6位英數字混合", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.smsTest.testDeliveryNotification({
      recipientPhone: "0912-345-678",
      recipientName: "測試收餐人",
    });

    // 驗證序號應為6位數字
    expect(result.verificationCode).toMatch(/^\d{6}$/);
    expect(result.verificationCode).toHaveLength(6);
  });
});
