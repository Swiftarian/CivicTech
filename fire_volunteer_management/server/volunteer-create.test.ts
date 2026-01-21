import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-test",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("volunteers.create", () => {
  it("應該自動建立使用者帳號並關聯志工記錄", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const volunteerData = {
      name: "測試志工",
      email: "test-volunteer@example.com",
      phone: "0912345678",
      employeeId: "V-TEST-001",
      department: "測試部門",
      position: "測試職位",
      skills: "測試專長",
      availability: "週一至週五 09:00-17:00",
    };

    const result = await caller.volunteers.create(volunteerData);

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("userId");
    expect(typeof result.userId).toBe("number");
  });

  it("應該允許不提供email和phone", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const volunteerData = {
      name: "簡單志工",
      employeeId: "V-SIMPLE-001",
    };

    const result = await caller.volunteers.create(volunteerData);

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("userId");
  });
});
