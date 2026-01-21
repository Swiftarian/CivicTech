import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getAllBookings: vi.fn(),
    updateBooking: vi.fn(),
    deleteBooking: vi.fn(),
  };
});

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
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createVolunteerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "volunteer-user",
    email: "volunteer@example.com",
    name: "Volunteer User",
    loginMethod: "manus",
    role: "volunteer",
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("bookings.getAll - 預約列表查詢", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("管理員可以查詢所有預約", async () => {
    const mockBookings = [
      {
        id: 1,
        bookingNumber: "IND-20251209-001",
        type: "individual" as const,
        contactName: "測試用戶1",
        contactPhone: "0912345678",
        contactEmail: "test1@example.com",
        numberOfPeople: 5,
        visitDate: new Date("2025-12-09"),
        visitTime: "09:00-10:00",
        status: "pending" as const,
        createdAt: new Date(),
      },
      {
        id: 2,
        bookingNumber: "GRP-20251210-001",
        type: "group" as const,
        contactName: "測試用戶2",
        contactPhone: "0923456789",
        contactEmail: "test2@example.com",
        organizationName: "測試學校",
        numberOfPeople: 30,
        visitDate: new Date("2025-12-10"),
        visitTime: "10:00-11:00",
        status: "confirmed" as const,
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.getAllBookings).mockResolvedValue(mockBookings);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.getAll();

    expect(result).toHaveLength(2);
    expect(result[0].bookingNumber).toBe("IND-20251209-001");
    expect(result[1].bookingNumber).toBe("GRP-20251210-001");
    expect(db.getAllBookings).toHaveBeenCalled();
  });
});

describe("bookings.update - 編輯預約", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("管理員可以編輯個人預約", async () => {
    vi.mocked(db.updateBooking).mockResolvedValue(true);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.update({
      id: 1,
      type: "individual",
      contactName: "更新後的姓名",
      contactPhone: "0987654321",
      status: "confirmed",
    });

    expect(result).toEqual({ success: true });
    expect(db.updateBooking).toHaveBeenCalledWith(1, "individual", {
      contactName: "更新後的姓名",
      contactPhone: "0987654321",
      status: "confirmed",
    });
  });

  it("管理員可以編輯團體預約", async () => {
    vi.mocked(db.updateBooking).mockResolvedValue(true);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.update({
      id: 2,
      type: "group",
      organizationName: "更新後的學校名稱",
      numberOfPeople: 40,
    });

    expect(result).toEqual({ success: true });
    expect(db.updateBooking).toHaveBeenCalledWith(2, "group", {
      organizationName: "更新後的學校名稱",
      numberOfPeople: 40,
    });
  });

  it("非管理員無法編輯預約", async () => {
    const ctx = createVolunteerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.update({
        id: 1,
        type: "individual",
        contactName: "測試",
      })
    ).rejects.toThrow();
  });
});

describe("bookings.delete - 刪除預約", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("管理員可以刪除個人預約", async () => {
    vi.mocked(db.deleteBooking).mockResolvedValue(true);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.delete({
      id: 1,
      type: "individual",
    });

    expect(result).toEqual({ success: true });
    expect(db.deleteBooking).toHaveBeenCalledWith(1, "individual");
  });

  it("管理員可以刪除團體預約", async () => {
    vi.mocked(db.deleteBooking).mockResolvedValue(true);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.delete({
      id: 2,
      type: "group",
    });

    expect(result).toEqual({ success: true });
    expect(db.deleteBooking).toHaveBeenCalledWith(2, "group");
  });

  it("非管理員無法刪除預約", async () => {
    const ctx = createVolunteerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bookings.delete({
        id: 1,
        type: "individual",
      })
    ).rejects.toThrow();
  });
});
