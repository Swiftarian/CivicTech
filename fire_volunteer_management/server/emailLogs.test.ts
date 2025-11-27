import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { logEmailSent, getEmailLogs, getEmailStats } from "./db";

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

describe("Email歷史記錄功能", () => {
  it("應該能夠記錄Email發送成功", async () => {
    await logEmailSent({
      recipientEmail: "test@example.com",
      recipientName: "Test User",
      subject: "測試Email",
      emailType: "test",
      status: "success",
      isTest: true,
    });

    const logs = await getEmailLogs({ limit: 1 });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]?.recipientEmail).toBe("test@example.com");
    expect(logs[0]?.status).toBe("success");
  });

  it("應該能夠記錄Email發送失敗", async () => {
    await logEmailSent({
      recipientEmail: "fail@example.com",
      recipientName: "Fail User",
      subject: "失敗Email",
      emailType: "test",
      status: "failed",
      errorMessage: "SMTP connection failed",
      isTest: true,
    });

    const logs = await getEmailLogs({ limit: 10 });
    const failedLog = logs.find(log => log.recipientEmail === "fail@example.com");
    expect(failedLog).toBeDefined();
    expect(failedLog?.status).toBe("failed");
    expect(failedLog?.errorMessage).toBe("SMTP connection failed");
  });

  it("應該能夠查詢Email統計資訊", async () => {
    const stats = await getEmailStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("success");
    expect(stats).toHaveProperty("failed");
    expect(stats).toHaveProperty("testEmails");
    expect(typeof stats.total).toBe("number");
  });

  it("管理員應該能夠透過API查詢Email歷史", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.emailLogs.list({ limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
  });

  it("管理員應該能夠透過API查詢Email統計", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.emailLogs.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("success");
    expect(stats).toHaveProperty("failed");
    expect(stats).toHaveProperty("testEmails");
  });

  it("應該能夠篩選測試Email", async () => {
    const logs = await getEmailLogs({ isTest: true, limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
    // 所有返回的記錄都應該是測試Email
    logs.forEach(log => {
      expect(log.isTest).toBe(true);
    });
  });
});
