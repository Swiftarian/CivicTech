import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser, getUserByOpenId, getVolunteerByUserId } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * 建立測試context
 */
function createContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("mealDeliveries.getMyDeliveries - 志工送餐任務權限控制", () => {
  it("志工應該只能看到指派給自己的送餐任務", async () => {
    // 建立管理員
    await upsertUser({
      openId: "test-admin-1",
      name: "管理員",
      email: "admin1@example.com",
      role: "admin",
    });
    const admin = await getUserByOpenId("test-admin-1");
    expect(admin).toBeDefined();

    const adminCtx = createContext(admin!);
    const adminCaller = appRouter.createCaller(adminCtx);

    // 建立志工A（使用admin role以通過volunteerProcedure檢查）
    await upsertUser({
      openId: "test-volunteer-A1",
      name: "志工A",
      email: "volunteerA1@example.com",
      role: "admin",
    });
    const userA = await getUserByOpenId("test-volunteer-A1");
    expect(userA).toBeDefined();

    await adminCaller.volunteers.create({
      userId: userA!.id,
      name: "志工A",
      phone: "0912345680",
      email: "volunteerA1@example.com",
      specialties: "送餐服務",
    });

    // 建立志工B（使用admin role以通過volunteerProcedure檢查）
    await upsertUser({
      openId: "test-volunteer-B1",
      name: "志工B",
      email: "volunteerB1@example.com",
      role: "admin",
    });
    const userB = await getUserByOpenId("test-volunteer-B1");
    expect(userB).toBeDefined();

    await adminCaller.volunteers.create({
      userId: userB!.id,
      name: "志工B",
      phone: "0912345681",
      email: "volunteerB1@example.com",
      specialties: "送餐服務",
    });

    // 建立兩個送餐任務
    const deliveryA = await adminCaller.mealDeliveries.create({
      recipientName: "收餐人A",
      recipientPhone: "0987654323",
      deliveryAddress: "台東市A地址",
      deliveryDate: new Date("2025-06-11"),
      deliveryTime: "12:00",
      mealType: "午餐",
    });

    const deliveryB = await adminCaller.mealDeliveries.create({
      recipientName: "收餐人B",
      recipientPhone: "0987654324",
      deliveryAddress: "台東市B地址",
      deliveryDate: new Date("2025-06-11"),
      deliveryTime: "18:00",
      mealType: "晚餐",
    });

    // 取得志工ID
    const volunteerA = await getVolunteerByUserId(userA!.id);
    const volunteerB = await getVolunteerByUserId(userB!.id);
    expect(volunteerA).toBeDefined();
    expect(volunteerB).toBeDefined();

    // 指派任務A給志工A
    await adminCaller.mealDeliveries.assignVolunteer({
      deliveryId: deliveryA.id,
      volunteerId: volunteerA!.id,
    });

    // 指派任務B給志工B
    await adminCaller.mealDeliveries.assignVolunteer({
      deliveryId: deliveryB.id,
      volunteerId: volunteerB!.id,
    });

    // 志工A查詢自己的送餐任務
    const ctxA = createContext(userA!);
    const callerA = appRouter.createCaller(ctxA);
    const deliveriesA = await callerA.mealDeliveries.getMyDeliveries();

    // 志工B查詢自己的送餐任務
    const ctxB = createContext(userB!);
    const callerB = appRouter.createCaller(ctxB);
    const deliveriesB = await callerB.mealDeliveries.getMyDeliveries();

    // 驗證：志工A只能看到自己的任務
    console.log("志工A的送餐任務：", deliveriesA.map(d => ({ id: d.id, recipientName: d.recipientName, volunteerId: d.volunteerId })));
    console.log("志工A的ID：", volunteerA!.id);
    expect(deliveriesA.length).toBe(1);
    expect(deliveriesA[0]?.recipientName).toBe("收餐人A");
    expect(deliveriesA[0]?.deliveryAddress).toBe("台東市A地址");

    // 驗證：志工B只能看到自己的任務
    expect(deliveriesB.length).toBe(1);
    expect(deliveriesB[0]?.recipientName).toBe("收餐人B");
    expect(deliveriesB[0]?.deliveryAddress).toBe("台東市B地址");
  });

  it("志工沒有被指派任何任務時應該回傳空陣列", async () => {
    // 建立管理員
    await upsertUser({
      openId: "test-admin-2",
      name: "管理員2",
      email: "admin2@example.com",
      role: "admin",
    });
    const admin = await getUserByOpenId("test-admin-2");
    expect(admin).toBeDefined();

    const adminCtx = createContext(admin!);
    const adminCaller = appRouter.createCaller(adminCtx);

    // 建立志工（沒有指派任何任務）
    await upsertUser({
      openId: "test-volunteer-C",
      name: "志工C",
      email: "volunteerC@example.com",
      role: "admin",
    });
    const userC = await getUserByOpenId("test-volunteer-C");
    expect(userC).toBeDefined();

    await adminCaller.volunteers.create({
      userId: userC!.id,
      name: "志工C",
      phone: "0912345682",
      email: "volunteerC@example.com",
      specialties: "送餐服務",
    });

    // 志工查詢自己的送餐任務
    const volunteerCtx = createContext(userC!);
    const volunteerCaller = appRouter.createCaller(volunteerCtx);
    const myDeliveries = await volunteerCaller.mealDeliveries.getMyDeliveries();

    // 驗證：沒有任務
    expect(myDeliveries).toBeDefined();
    expect(myDeliveries.length).toBe(0);
  });
});
