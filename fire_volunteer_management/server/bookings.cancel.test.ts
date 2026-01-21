import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("bookings.cancel", () => {
  it("應該能成功取消pending狀態的預約", { timeout: 15000 }, async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 建立測試預約
    const createResult = await caller.bookings.create({
      type: "individual",
      contactName: "測試用戶",
      contactPhone: "0912345678",
      contactEmail: "test@example.com",
      numberOfPeople: 5,
      visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天後
      visitTime: "09:00-10:00",
      purpose: "測試預約",
    });

    expect(createResult.success).toBe(true);
    expect(createResult.bookingNumber).toBeDefined();

    // 取消預約
    const cancelResult = await caller.bookings.cancel({
      bookingNumber: createResult.bookingNumber,
    });

    expect(cancelResult.success).toBe(true);

    // 驗證預約狀態已更新為cancelled
    const booking = await caller.bookings.getByNumber({
      bookingNumber: createResult.bookingNumber,
    });

    expect(booking).toBeDefined();
    expect(booking?.status).toBe("cancelled");
  });

  it("應該拒絕取消不存在的預約", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.cancel({
        bookingNumber: "BK9999999999",
      })
    ).rejects.toThrow("找不到該預約");
  });

  it("應該拒絕取消已經取消的預約", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 建立並取消預約
    const createResult = await caller.bookings.create({
      type: "individual",
      contactName: "測試用戶",
      contactPhone: "0912345678",
      numberOfPeople: 5,
      visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      visitTime: "09:00-10:00",
    });

    await caller.bookings.cancel({
      bookingNumber: createResult.bookingNumber,
    });

    // 嘗試再次取消
    await expect(
      caller.bookings.cancel({
        bookingNumber: createResult.bookingNumber,
      })
    ).rejects.toThrow("該預約已經取消");
  });

  it("應該拒絕取消已完成的預約", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // 建立預約
    const createResult = await caller.bookings.create({
      type: "individual",
      contactName: "測試用戶",
      contactPhone: "0912345678",
      numberOfPeople: 5,
      visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      visitTime: "09:00-10:00",
    });

    // 取得預約ID並更新狀態為completed
    const booking = await db.getBookingByNumber(createResult.bookingNumber);
    if (booking) {
      await db.updateBookingStatus(booking.id, "completed");
    }

    // 嘗試取消已完成的預約
    await expect(
      caller.bookings.cancel({
        bookingNumber: createResult.bookingNumber,
      })
    ).rejects.toThrow("已完成的預約無法取消");
  });
});
