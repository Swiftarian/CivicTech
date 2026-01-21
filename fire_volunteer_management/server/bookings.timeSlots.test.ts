import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
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

describe("bookings.getAvailableTimeSlots", () => {
  it("應該回傳所有可用時段（當該日無預約時）", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 查詢未來某一天的可用時段
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const result = await caller.bookings.getAvailableTimeSlots({
      date: futureDate,
    });

    expect(result.allTimeSlots).toHaveLength(6);
    expect(result.allTimeSlots).toEqual([
      "09:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "14:00-15:00",
      "15:00-16:00",
      "16:00-17:00",
    ]);
    expect(result.availableTimeSlots).toHaveLength(6);
    expect(result.bookedTimeSlots).toHaveLength(0);
    expect(result.isFull).toBe(false);
  });

  it("應該正確標示已預約的時段", { timeout: 15000 }, async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 建立一個測試預約
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 15);

    await caller.bookings.create({
      type: "individual",
      contactName: "測試用戶",
      contactPhone: "0912345678",
      contactEmail: "test@example.com",
      numberOfPeople: 5,
      visitDate: testDate,
      visitTime: "09:00-10:00",
    });

    // 查詢該日的可用時段
    const result = await caller.bookings.getAvailableTimeSlots({
      date: testDate,
    });

    expect(result.bookedTimeSlots).toContain("09:00-10:00");
    expect(result.availableTimeSlots).toHaveLength(5);
    expect(result.availableTimeSlots).not.toContain("09:00-10:00");
    expect(result.isFull).toBe(false);
  });

  it("應該正確標示已滿額的日期", { timeout: 30000 }, async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 建立一個測試日期（使用非常遠的未來日期）
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 100);

    // 預約所有時段
    const allTimeSlots = [
      "09:00-10:00",
      "10:00-11:00",
      "11:00-12:00",
      "14:00-15:00",
      "15:00-16:00",
      "16:00-17:00",
    ];

    for (const timeSlot of allTimeSlots) {
      await caller.bookings.create({
        type: "individual",
        contactName: "測試用戶",
        contactPhone: "0912345678",
        numberOfPeople: 5,
        visitDate: testDate,
        visitTime: timeSlot,
      });
    }

    // 查詢該日的可用時段
    const result = await caller.bookings.getAvailableTimeSlots({
      date: testDate,
    });

    // 檢查所有時段都被預約
    for (const timeSlot of allTimeSlots) {
      expect(result.bookedTimeSlots).toContain(timeSlot);
    }
    expect(result.availableTimeSlots).toHaveLength(0);
    expect(result.isFull).toBe(true);
  });

  it("應該排除已取消的預約", { timeout: 15000 }, async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 建立並取消一個預約（使用更遠的未來日期）
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 60); // 使用60天後的日期

    const createResult = await caller.bookings.create({
      type: "individual",
      contactName: "測試用戶",
      contactPhone: "0912345678",
      numberOfPeople: 5,
      visitDate: testDate,
      visitTime: "10:00-11:00",
    });

    await caller.bookings.cancel({
      bookingNumber: createResult.bookingNumber,
    });

    // 查詢該日的可用時段
    const result = await caller.bookings.getAvailableTimeSlots({
      date: testDate,
    });

    // 已取消的預約不應該佔用時段
    expect(result.availableTimeSlots).toHaveLength(6);
    expect(result.bookedTimeSlots).not.toContain("10:00-11:00");
    expect(result.isFull).toBe(false);
  });
});
