import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-openid",
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

function createUserContext(): TrpcContext {
  const regularUser: AuthenticatedUser = {
    id: 2,
    openId: "user-openid",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: regularUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("志工送餐統計功能", () => {
  it("管理員可以查詢志工送餐統計", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.mealDeliveries.getVolunteerDeliveryStats();

    // 驗證返回的統計資料結構
    expect(Array.isArray(stats)).toBe(true);

    if (stats.length > 0) {
      const firstStat = stats[0];

      // 驗證必要欄位存在
      expect(firstStat).toHaveProperty("volunteerId");
      expect(firstStat).toHaveProperty("userName");
      expect(firstStat).toHaveProperty("total");
      expect(firstStat).toHaveProperty("completed");
      expect(firstStat).toHaveProperty("inProgress");
      expect(firstStat).toHaveProperty("assigned");
      expect(firstStat).toHaveProperty("pending");

      // 驗證數字欄位為非負數
      expect(firstStat.total).toBeGreaterThanOrEqual(0);
      expect(firstStat.completed).toBeGreaterThanOrEqual(0);
      expect(firstStat.inProgress).toBeGreaterThanOrEqual(0);
      expect(firstStat.assigned).toBeGreaterThanOrEqual(0);
      expect(firstStat.pending).toBeGreaterThanOrEqual(0);

      // 驗證總數等於各狀態之和
      const sum =
        firstStat.completed +
        firstStat.inProgress +
        firstStat.assigned +
        firstStat.pending;
      expect(firstStat.total).toBe(sum);
    }
  });

  it("一般使用者無法查詢志工送餐統計", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mealDeliveries.getVolunteerDeliveryStats()
    ).rejects.toThrow("需要管理員權限");
  });

  it("統計結果按總任務數排序", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.mealDeliveries.getVolunteerDeliveryStats();

    if (stats.length > 1) {
      // 驗證結果是按總任務數降序排列
      for (let i = 0; i < stats.length - 1; i++) {
        expect(stats[i]!.total).toBeGreaterThanOrEqual(stats[i + 1]!.total);
      }
    }
  });

  it("只返回有送餐任務的志工", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.mealDeliveries.getVolunteerDeliveryStats();

    // 驗證所有返回的志工都至少有一筆任務
    stats.forEach(stat => {
      expect(stat.total).toBeGreaterThan(0);
    });
  });
});
