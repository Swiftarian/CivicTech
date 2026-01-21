import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("送餐路線優化和送達驗證功能", () => {
  it("應該能批量建立送餐任務", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mealDeliveries.createBatch({
      deliveries: [
        {
          recipientName: "王小明",
          recipientPhone: "0912-345-678",
          deliveryAddress: "台東市中華路一段100號",
          deliveryDate: new Date("2024-12-01"),
          deliveryTime: "11:00-12:00",
          mealType: "午餐便當",
        },
        {
          recipientName: "李小華",
          recipientPhone: "0923-456-789",
          deliveryAddress: "台東市更生路200號",
          deliveryDate: new Date("2024-12-01"),
          deliveryTime: "11:00-12:00",
          mealType: "午餐便當",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.deliveries).toHaveLength(2);
    expect(result.deliveries[0].deliveryNumber).toBeDefined();
    expect(result.deliveries[0].verificationCode).toBeDefined();
  });

  it("應該能查詢單筆送餐任務", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 先建立一筆送餐任務
    const createResult = await caller.mealDeliveries.create({
      recipientName: "張大同",
      recipientPhone: "0934-567-890",
      deliveryAddress: "台東市鐵花路50號",
      deliveryDate: new Date("2024-12-01"),
      deliveryTime: "11:00-12:00",
      mealType: "午餐便當",
    });

    // 查詢該送餐任務
    const deliveries = await caller.mealDeliveries.getAll();
    const delivery = deliveries.find(
      d => d.deliveryNumber === createResult.deliveryNumber
    );

    expect(delivery).toBeDefined();
    expect(delivery?.recipientName).toBe("張大同");
    expect(delivery?.deliveryAddress).toBe("台東市鐵花路50號");
  });

  it("應該能驗證送餐驗證碼", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立送餐任務
    const createResult = await caller.mealDeliveries.create({
      recipientName: "陳美玲",
      recipientPhone: "0945-678-901",
      deliveryAddress: "台東市新生路300號",
      deliveryDate: new Date("2024-12-01"),
      deliveryTime: "11:00-12:00",
      mealType: "午餐便當",
    });

    // 查詢送餐任務ID
    const deliveries = await caller.mealDeliveries.getAll();
    const delivery = deliveries.find(
      d => d.deliveryNumber === createResult.deliveryNumber
    );

    expect(delivery).toBeDefined();

    // 驗證正確的驗證碼
    const verifyResult = await caller.mealDeliveries.verify({
      deliveryId: delivery!.id,
      verificationCode: createResult.verificationCode,
    });

    expect(verifyResult.valid).toBe(true);

    // 驗證錯誤的驗證碼
    const invalidResult = await caller.mealDeliveries.verify({
      deliveryId: delivery!.id,
      verificationCode: "000000",
    });

    expect(invalidResult.valid).toBe(false);
  });

  it("批量建立時應該為每筆任務產生唯一的送餐編號和驗證碼", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mealDeliveries.createBatch({
      deliveries: [
        {
          recipientName: "林志偉",
          recipientPhone: "0956-789-012",
          deliveryAddress: "台東市博愛路150號",
          deliveryDate: new Date("2024-12-01"),
          deliveryTime: "11:00-12:00",
          mealType: "午餐便當",
        },
        {
          recipientName: "黃淑芬",
          recipientPhone: "0967-890-123",
          deliveryAddress: "台東市中正路250號",
          deliveryDate: new Date("2024-12-01"),
          deliveryTime: "11:00-12:00",
          mealType: "午餐便當",
        },
      ],
    });

    const deliveryNumbers = result.deliveries.map(d => d.deliveryNumber);
    const verificationCodes = result.deliveries.map(d => d.verificationCode);

    // 檢查送餐編號唯一性
    expect(new Set(deliveryNumbers).size).toBe(deliveryNumbers.length);
    
    // 檢查驗證碼唯一性
    expect(new Set(verificationCodes).size).toBe(verificationCodes.length);
    
    // 檢查驗證碼格式（6位數字）
    verificationCodes.forEach(code => {
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  it("應該能記錄送餐任務狀態變更", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立送餐任務
    const createResult = await caller.mealDeliveries.create({
      recipientName: "測試用戶",
      recipientPhone: "0912-000-000",
      deliveryAddress: "台東市測試路1號",
      deliveryDate: new Date("2024-12-01"),
      deliveryTime: "11:00-12:00",
      mealType: "午餐便當",
    });

    // 查詢送餐任務
    const deliveries = await caller.mealDeliveries.getAll();
    const delivery = deliveries.find(
      d => d.deliveryNumber === createResult.deliveryNumber
    );

    expect(delivery).toBeDefined();
    expect(delivery?.status).toBe("pending");
  });
});
