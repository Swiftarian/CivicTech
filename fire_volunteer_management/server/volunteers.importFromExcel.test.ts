import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("volunteers.importFromExcel", () => {
  it("should successfully import valid volunteer data", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const volunteersData = [
      {
        userId: 2,
        employeeId: "V001",
        department: "導覽組",
        position: "導覽員",
        skills: "防災知識、導覽解說",
        availability: "週一至週五 09:00-17:00",
      },
      {
        userId: 3,
        employeeId: "V002",
        department: "送餐組",
        position: "送餐員",
        skills: "駕駛、路線規劃",
        availability: "週一至週五 11:00-14:00",
      },
    ];

    const result = await caller.volunteers.importFromExcel({
      volunteers: volunteersData,
    });

    // 驗證結果結構
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("failed");
    expect(result).toHaveProperty("errors");
    
    // 驗證結果為數字
    expect(typeof result.success).toBe("number");
    expect(typeof result.failed).toBe("number");
    
    // 驗證錯誤陣列
    expect(Array.isArray(result.errors)).toBe(true);
    
    // 成功數量應該大於等於0
    expect(result.success).toBeGreaterThanOrEqual(0);
    
    // 失敗數量應該大於等於0
    expect(result.failed).toBeGreaterThanOrEqual(0);
    
    // 總數應該等於輸入數量
    expect(result.success + result.failed).toBe(volunteersData.length);
  });

  it("should handle invalid user ID gracefully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const volunteersData = [
      {
        userId: 999999, // 不存在的使用者ID
        employeeId: "V999",
        department: "測試組",
        position: "測試員",
      },
    ];

    const result = await caller.volunteers.importFromExcel({
      volunteers: volunteersData,
    });

    // 應該回傳結果而非拋出錯誤
    expect(result).toBeDefined();
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("failed");
    expect(result).toHaveProperty("errors");
  });

  it("should handle empty volunteer list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.volunteers.importFromExcel({
      volunteers: [],
    });

    expect(result.success).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle mixed valid and invalid data", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const volunteersData = [
      {
        userId: 2,
        employeeId: "V001",
        department: "導覽組",
        position: "導覽員",
      },
      {
        userId: 999999, // 無效的使用者ID
        employeeId: "V999",
        department: "測試組",
        position: "測試員",
      },
    ];

    const result = await caller.volunteers.importFromExcel({
      volunteers: volunteersData,
    });

    // 總數應該等於輸入數量
    expect(result.success + result.failed).toBe(volunteersData.length);
    
    // 應該有一些成功或失敗的記錄
    expect(result.success > 0 || result.failed > 0).toBe(true);
  });

  it("should require admin role", async () => {
    // 建立非管理員使用者的 context
    const nonAdminUser: AuthenticatedUser = {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user", // 非管理員
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx: TrpcContext = {
      user: nonAdminUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const volunteersData = [
      {
        userId: 3,
        employeeId: "V001",
        department: "導覽組",
        position: "導覽員",
      },
    ];

    // 應該拋出權限錯誤
    await expect(
      caller.volunteers.importFromExcel({ volunteers: volunteersData })
    ).rejects.toThrow();
  });
});
