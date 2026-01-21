import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getBookingByNumber: vi.fn(),
    updateBookingStatus: vi.fn(),
  };
});

// Mock email service
vi.mock("./emailService", () => ({
  sendBookingCancellationEmail: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("bookings.cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cancel an individual booking and pass correct bookingType", async () => {
    const mockBooking = {
      id: 1,
      bookingNumber: "IND-20251209-001",
      type: "individual" as const,
      status: "pending" as const,
      contactName: "測試用戶",
      contactEmail: "test@example.com",
      contactPhone: "0912345678",
      visitDate: new Date("2025-12-09"),
      visitTime: "09:00-10:00",
      numberOfPeople: 5,
    };

    vi.mocked(db.getBookingByNumber).mockResolvedValue(mockBooking);
    vi.mocked(db.updateBookingStatus).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.cancel({
      bookingNumber: "IND-20251209-001",
    });

    expect(result).toEqual({ success: true });
    expect(db.getBookingByNumber).toHaveBeenCalledWith("IND-20251209-001");
    // 驗證傳遞了正確的bookingType參數
    expect(db.updateBookingStatus).toHaveBeenCalledWith(1, "cancelled", "individual");
  });

  it("should cancel a group booking and pass correct bookingType", async () => {
    const mockBooking = {
      id: 2,
      bookingNumber: "GRP-20251209-001",
      type: "group" as const,
      status: "confirmed" as const,
      contactName: "團體負責人",
      contactEmail: "group@example.com",
      contactPhone: "0923456789",
      visitDate: new Date("2025-12-10"),
      visitTime: "10:00-11:00",
      numberOfPeople: 30,
      organizationName: "測試學校",
    };

    vi.mocked(db.getBookingByNumber).mockResolvedValue(mockBooking);
    vi.mocked(db.updateBookingStatus).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.cancel({
      bookingNumber: "GRP-20251209-001",
    });

    expect(result).toEqual({ success: true });
    expect(db.updateBookingStatus).toHaveBeenCalledWith(2, "cancelled", "group");
  });

  it("should throw error when booking not found", async () => {
    vi.mocked(db.getBookingByNumber).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.cancel({ bookingNumber: "INVALID-001" })
    ).rejects.toThrow("找不到該預約");
  });

  it("should throw error when booking already cancelled", async () => {
    const mockBooking = {
      id: 1,
      bookingNumber: "IND-20251209-001",
      type: "individual" as const,
      status: "cancelled" as const,
      contactName: "測試用戶",
      contactEmail: "test@example.com",
      contactPhone: "0912345678",
      visitDate: new Date("2025-12-09"),
      visitTime: "09:00-10:00",
      numberOfPeople: 5,
    };

    vi.mocked(db.getBookingByNumber).mockResolvedValue(mockBooking);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.cancel({ bookingNumber: "IND-20251209-001" })
    ).rejects.toThrow("該預約已經取消");
  });

  it("should throw error when booking is completed", async () => {
    const mockBooking = {
      id: 1,
      bookingNumber: "IND-20251209-001",
      type: "individual" as const,
      status: "completed" as const,
      contactName: "測試用戶",
      contactEmail: "test@example.com",
      contactPhone: "0912345678",
      visitDate: new Date("2025-12-09"),
      visitTime: "09:00-10:00",
      numberOfPeople: 5,
    };

    vi.mocked(db.getBookingByNumber).mockResolvedValue(mockBooking);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.cancel({ bookingNumber: "IND-20251209-001" })
    ).rejects.toThrow("已完成的預約無法取消");
  });
});
