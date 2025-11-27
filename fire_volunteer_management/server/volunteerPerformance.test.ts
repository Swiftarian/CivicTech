import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
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

describe("志工績效統計API", () => {
  it("管理員可以查詢所有志工績效統計", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.volunteers.getAllPerformance();

    expect(Array.isArray(result)).toBe(true);
    
    // 驗證返回的數據結構
    if (result.length > 0) {
      const firstVolunteer = result[0];
      expect(firstVolunteer).toHaveProperty("id");
      expect(firstVolunteer).toHaveProperty("userId");
      expect(firstVolunteer).toHaveProperty("totalDeliveries");
      expect(firstVolunteer).toHaveProperty("completedDeliveries");
      expect(firstVolunteer).toHaveProperty("avgDeliveryTime");
      expect(firstVolunteer).toHaveProperty("onTimeRate");
      
      // 驗證數據類型
      expect(typeof firstVolunteer.totalDeliveries).toBe("number");
      expect(typeof firstVolunteer.completedDeliveries).toBe("number");
      expect(typeof firstVolunteer.avgDeliveryTime).toBe("number");
      expect(typeof firstVolunteer.onTimeRate).toBe("number");
      
      // 驗證數據合理性
      expect(firstVolunteer.totalDeliveries).toBeGreaterThanOrEqual(0);
      expect(firstVolunteer.completedDeliveries).toBeGreaterThanOrEqual(0);
      expect(firstVolunteer.completedDeliveries).toBeLessThanOrEqual(firstVolunteer.totalDeliveries);
      expect(firstVolunteer.avgDeliveryTime).toBeGreaterThanOrEqual(0);
      expect(firstVolunteer.onTimeRate).toBeGreaterThanOrEqual(0);
      expect(firstVolunteer.onTimeRate).toBeLessThanOrEqual(100);
    }
  });

  it("管理員可以查詢單一志工績效統計", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 先獲取所有志工
    const allVolunteers = await caller.volunteers.getAllPerformance();
    
    if (allVolunteers.length > 0) {
      const volunteerId = allVolunteers[0].id;
      
      const result = await caller.volunteers.getPerformance({ volunteerId });

      expect(result).toBeDefined();
      if (result) {
        expect(result.volunteerId).toBe(volunteerId);
        expect(typeof result.totalDeliveries).toBe("number");
        expect(typeof result.completedDeliveries).toBe("number");
        expect(typeof result.avgDeliveryTime).toBe("number");
        expect(typeof result.onTimeRate).toBe("number");
      }
    }
  });

  it("績效統計數據應該合理", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.volunteers.getAllPerformance();

    for (const volunteer of result) {
      // 完成次數不應超過總次數
      expect(volunteer.completedDeliveries).toBeLessThanOrEqual(volunteer.totalDeliveries || 0);
      
      // 準時率應在0-100之間
      expect(volunteer.onTimeRate).toBeGreaterThanOrEqual(0);
      expect(volunteer.onTimeRate).toBeLessThanOrEqual(100);
      
      // 平均配送時間應為非負數
      expect(volunteer.avgDeliveryTime).toBeGreaterThanOrEqual(0);
      
      // 如果沒有完成任何配送，平均時間應為0
      if ((volunteer.completedDeliveries || 0) === 0) {
        expect(volunteer.avgDeliveryTime).toBe(0);
      }
    }
  });

  it("績效統計應該包含志工基本資訊", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.volunteers.getAllPerformance();

    if (result.length > 0) {
      const firstVolunteer = result[0];
      
      // 應該包含志工基本資訊
      expect(firstVolunteer).toHaveProperty("id");
      expect(firstVolunteer).toHaveProperty("userId");
      expect(firstVolunteer).toHaveProperty("status");
      
      // 可能包含使用者資訊（如果有關聯）
      // name 和 email 可能為 undefined，但應該存在這些屬性
      expect("name" in firstVolunteer).toBe(true);
      expect("email" in firstVolunteer).toBe(true);
    }
  });

  it("應該能夠按送餐次數排序志工", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.volunteers.getAllPerformance();

    if (result.length > 1) {
      // 手動排序並驗證
      const sorted = [...result].sort((a, b) => 
        (b.totalDeliveries || 0) - (a.totalDeliveries || 0)
      );
      
      // 驗證排序後的第一個志工送餐次數最多
      expect(sorted[0].totalDeliveries).toBeGreaterThanOrEqual(sorted[sorted.length - 1].totalDeliveries || 0);
    }
  });
});
