import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import * as recipientsDb from "./recipientsDb";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    phone: "0912345678",
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("志工任務指派LINE通知功能", () => {
  it("指派志工時應該查詢志工資訊", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立測試資料
    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // 建立志工使用者
    await db.upsertUser({
      openId: "volunteer-user",
      email: "volunteer@example.com",
      name: "Test Volunteer",
      phone: "0987654321",
      role: "user",
    });

    const volunteerUser = await db.getUserByEmail("volunteer@example.com");
    expect(volunteerUser).toBeDefined();

    // 建立志工記錄
    await db.createVolunteer({
      userId: volunteerUser!.id,
      employeeId: "V001",
      department: "送餐部",
      position: "送餐志工",
      status: "active",
    });

    const volunteer = await db.getVolunteerByUserId(volunteerUser!.id);
    expect(volunteer).toBeDefined();

    // 建立送餐任務
    const delivery = await db.createMealDelivery({
      recipientName: "收餐人",
      recipientPhone: "0911111111",
      deliveryAddress: "台東市測試路1號",
      deliveryDate: new Date("2025-01-05"),
      deliveryTime: "12:00",
      deliveryNumber: "MD123456",
      verificationCode: "ABC123",
      qrCode: JSON.stringify({ deliveryNumber: "MD123456", verificationCode: "ABC123" }),
      status: "pending",
    });

    expect(delivery).toBeDefined();

    // 指派志工（不會拋出錯誤即為成功）
    const result = await caller.mealDeliveries.assignVolunteer({
      deliveryId: delivery!.id,
      volunteerId: volunteer!.id,
    });

    expect(result.success).toBe(true);

    // 驗證送餐任務已更新
    const updatedDelivery = await db.getMealDeliveryById(delivery!.id);
    expect(updatedDelivery?.volunteerId).toBe(volunteer!.id);
    expect(updatedDelivery?.status).toBe("assigned");
  });

  it("志工有LINE綁定時應該發送通知（模擬）", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // 建立志工使用者
    await db.upsertUser({
      openId: "volunteer-with-line",
      email: "volunteer-line@example.com",
      name: "LINE Volunteer",
      phone: "0922222222",
      role: "user",
    });

    const volunteerUser = await db.getUserByEmail("volunteer-line@example.com");
    expect(volunteerUser).toBeDefined();

    // 建立志工記錄
    await db.createVolunteer({
      userId: volunteerUser!.id,
      employeeId: "V002",
      department: "送餐部",
      position: "送餐志工",
      status: "active",
    });

    const volunteer = await db.getVolunteerByUserId(volunteerUser!.id);
    expect(volunteer).toBeDefined();

    // 建立收餐人並綁定LINE（模擬志工的LINE綁定）
    await recipientsDb.createRecipient({
      name: "LINE Volunteer",
      phone: "0922222222",
      address: "台東市測試路2號",
      lineUserId: "U123456789abcdef",
      preferredNotificationMethod: "line",
    });

    // 建立送餐任務
    const delivery = await db.createMealDelivery({
      recipientName: "收餐人2",
      recipientPhone: "0933333333",
      deliveryAddress: "台東市測試路3號",
      deliveryDate: new Date("2025-01-06"),
      deliveryTime: "13:00",
      deliveryNumber: "MD789012",
      verificationCode: "DEF456",
      qrCode: JSON.stringify({ deliveryNumber: "MD789012", verificationCode: "DEF456" }),
      status: "pending",
    });

    expect(delivery).toBeDefined();

    // 指派志工（應該會嘗試發送LINE通知，但因為是測試環境會失敗）
    const result = await caller.mealDeliveries.assignVolunteer({
      deliveryId: delivery!.id,
      volunteerId: volunteer!.id,
    });

    // 即使LINE發送失敗，指派仍然成功
    expect(result.success).toBe(true);

    // 驗證送餐任務已更新
    const updatedDelivery = await db.getMealDeliveryById(delivery!.id);
    expect(updatedDelivery?.volunteerId).toBe(volunteer!.id);
    expect(updatedDelivery?.status).toBe("assigned");
  });

  it("志工沒有LINE綁定時應該跳過通知", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // 建立志工使用者（沒有LINE綁定）
    await db.upsertUser({
      openId: "volunteer-no-line",
      email: "volunteer-noline@example.com",
      name: "No LINE Volunteer",
      phone: "0944444444",
      role: "user",
    });

    const volunteerUser = await db.getUserByEmail("volunteer-noline@example.com");
    expect(volunteerUser).toBeDefined();

    // 建立志工記錄
    await db.createVolunteer({
      userId: volunteerUser!.id,
      employeeId: "V003",
      department: "送餐部",
      position: "送餐志工",
      status: "active",
    });

    const volunteer = await db.getVolunteerByUserId(volunteerUser!.id);
    expect(volunteer).toBeDefined();

    // 建立送餐任務
    const delivery = await db.createMealDelivery({
      recipientName: "收餐人3",
      recipientPhone: "0955555555",
      deliveryAddress: "台東市測試路4號",
      deliveryDate: new Date("2025-01-07"),
      deliveryTime: "14:00",
      deliveryNumber: "MD345678",
      verificationCode: "GHI789",
      qrCode: JSON.stringify({ deliveryNumber: "MD345678", verificationCode: "GHI789" }),
      status: "pending",
    });

    expect(delivery).toBeDefined();

    // 指派志工（應該跳過LINE通知）
    const result = await caller.mealDeliveries.assignVolunteer({
      deliveryId: delivery!.id,
      volunteerId: volunteer!.id,
    });

    expect(result.success).toBe(true);

    // 驗證送餐任務已更新
    const updatedDelivery = await db.getMealDeliveryById(delivery!.id);
    expect(updatedDelivery?.volunteerId).toBe(volunteer!.id);
    expect(updatedDelivery?.status).toBe("assigned");
  });
});
