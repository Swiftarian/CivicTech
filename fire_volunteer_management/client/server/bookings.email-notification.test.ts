import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as emailService from "./emailService";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock emailService functions
vi.mock("./emailService", async () => {
  const actual = await vi.importActual("./emailService");
  return {
    ...actual,
    sendPublicBookingConfirmationEmail: vi.fn().mockResolvedValue(true),
    sendGroupBookingConfirmationEmail: vi.fn().mockResolvedValue(true),
  };
});

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

  return ctx;
}

describe("bookings.create - Email notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("應該在民眾預約成功後發送Email通知", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bookingData = {
      type: "individual" as const,
      contactName: "張三",
      contactPhone: "0912345678",
      contactEmail: "zhang@example.com",
      numberOfPeople: 5,
      visitDate: new Date("2024-12-01"),
      visitTime: "10:00-12:00",
      purpose: "參觀學習",
    };

    const result = await caller.bookings.create(bookingData);

    expect(result.success).toBe(true);
    expect(result.bookingNumber).toBeDefined();
    expect(result.bookingNumber).toMatch(/^BK\d+$/);

    // 驗證Email發送函數被正確調用
    expect(emailService.sendPublicBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendPublicBookingConfirmationEmail).toHaveBeenCalledWith(
      "zhang@example.com",
      "張三",
      result.bookingNumber,
      expect.any(String), // visitDate (格式化後的日期字串)
      "10:00-12:00",
      5
    );
  });

  it("應該在團體預約成功後發送Email通知", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bookingData = {
      type: "group" as const,
      contactName: "李四",
      contactPhone: "0987654321",
      contactEmail: "li@school.edu.tw",
      organizationName: "台東國小",
      numberOfPeople: 30,
      visitDate: new Date("2024-12-15"),
      visitTime: "14:00-16:00",
      purpose: "校外教學",
    };

    const result = await caller.bookings.create(bookingData);

    expect(result.success).toBe(true);
    expect(result.bookingNumber).toBeDefined();

    // 驗證團體預約Email發送函數被正確調用
    expect(emailService.sendGroupBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendGroupBookingConfirmationEmail).toHaveBeenCalledWith(
      "li@school.edu.tw",
      "台東國小",
      "李四",
      result.bookingNumber,
      expect.any(String), // visitDate
      "14:00-16:00",
      30
    );
  });

  it("如果未提供Email，應該成功建立預約但不發送Email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const bookingData = {
      type: "individual" as const,
      contactName: "王五",
      contactPhone: "0911111111",
      // 沒有提供 contactEmail
      numberOfPeople: 2,
      visitDate: new Date("2024-12-20"),
      visitTime: "09:00-11:00",
    };

    const result = await caller.bookings.create(bookingData);

    expect(result.success).toBe(true);
    expect(result.bookingNumber).toBeDefined();

    // 驗證Email發送函數沒有被調用
    expect(emailService.sendPublicBookingConfirmationEmail).not.toHaveBeenCalled();
    expect(emailService.sendGroupBookingConfirmationEmail).not.toHaveBeenCalled();
  });

  it("Email發送失敗時，預約仍應成功建立", async () => {
    // Mock Email發送失敗
    vi.mocked(emailService.sendPublicBookingConfirmationEmail).mockResolvedValueOnce(false);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bookingData = {
      type: "individual" as const,
      contactName: "趙六",
      contactPhone: "0922222222",
      contactEmail: "zhao@example.com",
      numberOfPeople: 3,
      visitDate: new Date("2024-12-25"),
      visitTime: "13:00-15:00",
    };

    // 即使Email發送失敗，預約仍應成功
    const result = await caller.bookings.create(bookingData);

    expect(result.success).toBe(true);
    expect(result.bookingNumber).toBeDefined();
    expect(emailService.sendPublicBookingConfirmationEmail).toHaveBeenCalledTimes(1);
  });

  it("團體預約但未提供組織名稱時，應使用民眾預約Email範本", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bookingData = {
      type: "group" as const,
      contactName: "陳七",
      contactPhone: "0933333333",
      contactEmail: "chen@example.com",
      // 沒有提供 organizationName
      numberOfPeople: 25,
      visitDate: new Date("2024-12-30"),
      visitTime: "10:00-12:00",
    };

    const result = await caller.bookings.create(bookingData);

    expect(result.success).toBe(true);

    // 應該使用民眾預約Email範本（因為沒有組織名稱）
    expect(emailService.sendPublicBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendGroupBookingConfirmationEmail).not.toHaveBeenCalled();
  });
});
