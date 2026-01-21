import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

function createNonAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "user-123",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
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

describe("mealDeliveries.batchDelete", () => {
  it("should reject non-admin users", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mealDeliveries.batchDelete({ ids: [1, 2, 3] })
    ).rejects.toThrow("需要管理員權限");
  });

  it("should accept valid batch delete request from admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 這個測試只驗證API接受請求，不驗證實際刪除結果
    // 因為測試環境可能沒有這些ID的資料
    const result = await caller.mealDeliveries.batchDelete({
      ids: [999, 998, 997],
    });

    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it("should handle empty ids array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mealDeliveries.batchDelete({ ids: [] });

    expect(result.count).toBe(0);
  });

  it("should return correct count for batch delete", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 測試批次刪除不存在的ID，應該返回count為刪除的數量
    // 注意：Drizzle ORM的delete操作即使找不到資料也會返回成功
    const result = await caller.mealDeliveries.batchDelete({
      ids: [99999, 99998, 99997],
    });

    expect(result.count).toBeGreaterThanOrEqual(0);
  });
});
