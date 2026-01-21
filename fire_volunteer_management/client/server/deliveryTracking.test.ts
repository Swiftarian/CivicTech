import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createVolunteerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "volunteer-test",
    email: "volunteer@example.com",
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

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "admin-test",
    email: "admin@example.com",
    name: "Test Admin",
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

describe("送餐路徑追蹤功能", () => {
  it("志工應該能夠上傳GPS位置", async () => {
    const { ctx } = createVolunteerContext();
    const caller = appRouter.createCaller(ctx);

    // 模擬上傳GPS位置（假設deliveryId=1存在）
    const result = await caller.mealDeliveries.addTracking({
      deliveryId: 1,
      latitude: "22.7539",
      longitude: "121.1451",
      speed: "15.5",
      accuracy: "10.0",
    });

    expect(result).toEqual({ success: true });
  });

  it("管理員應該能夠查詢送餐任務的路徑追蹤資料", async () => {
    const { ctx: volunteerCtx } = createVolunteerContext();
    const volunteerCaller = appRouter.createCaller(volunteerCtx);

    // 先上傳幾個GPS點
    await volunteerCaller.mealDeliveries.addTracking({
      deliveryId: 1,
      latitude: "22.7539",
      longitude: "121.1451",
    });

    await volunteerCaller.mealDeliveries.addTracking({
      deliveryId: 1,
      latitude: "22.7549",
      longitude: "121.1461",
    });

    // 管理員查詢路徑
    const { ctx: adminCtx } = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const trackingData = await adminCaller.mealDeliveries.getTracking({
      deliveryId: 1,
    });

    expect(Array.isArray(trackingData)).toBe(true);
    expect(trackingData.length).toBeGreaterThan(0);
    
    // 驗證追蹤點包含必要欄位
    if (trackingData.length > 0) {
      const point = trackingData[0];
      expect(point).toHaveProperty("latitude");
      expect(point).toHaveProperty("longitude");
      expect(point).toHaveProperty("timestamp");
    }
  });

  it("GPS位置資料應該包含經緯度和時間戳記", async () => {
    const { ctx } = createVolunteerContext();
    const caller = appRouter.createCaller(ctx);

    const testData = {
      deliveryId: 1,
      latitude: "22.7539",
      longitude: "121.1451",
      speed: "20.5",
      accuracy: "5.0",
    };

    await caller.mealDeliveries.addTracking(testData);

    // 查詢剛上傳的資料
    const { ctx: adminCtx } = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);
    const trackingData = await adminCaller.mealDeliveries.getTracking({
      deliveryId: 1,
    });

    // 找到最新的追蹤點
    const latestPoint = trackingData[trackingData.length - 1];
    expect(latestPoint.latitude).toBe(testData.latitude);
    expect(latestPoint.longitude).toBe(testData.longitude);
    expect(latestPoint.speed).toBe(testData.speed);
    expect(latestPoint.accuracy).toBe(testData.accuracy);
    expect(latestPoint.timestamp).toBeInstanceOf(Date);
  });

  it("志工應該能夠開始送餐任務", async () => {
    const { ctx } = createVolunteerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mealDeliveries.start({
      deliveryId: 1,
    });

    expect(result).toEqual({ success: true });
  });

  it("志工應該能夠完成送餐任務", async () => {
    const { ctx } = createVolunteerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mealDeliveries.complete({
      deliveryId: 1,
    });

    expect(result).toEqual({ success: true });
  });
});
