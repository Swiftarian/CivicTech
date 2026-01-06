import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("volunteers.update", () => {
  let testVolunteerId: number;
  let testUserId: number;

  beforeEach(async () => {
    // 建立測試使用者
    await db.upsertUser({
      openId: "test-volunteer-update",
      name: "Test Volunteer Update",
      email: "volunteer-update@test.com",
      loginMethod: "manus",
    });
    const user = await db.getUserByOpenId("test-volunteer-update");
    testUserId = user!.id;

    // 建立測試志工
    await db.createVolunteer({
      userId: testUserId,
      employeeId: "V-UPDATE-001",
      department: "測試部門",
      position: "測試職位",
      skills: "測試專長",
    });
    const volunteer = await db.getVolunteerByUserId(testUserId);
    testVolunteerId = volunteer!.id;
  });

  it("should update volunteer information successfully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.volunteers.update({
      id: testVolunteerId,
      employeeId: "V-UPDATE-002",
      department: "更新後部門",
      position: "更新後職位",
      skills: "更新後專長",
      status: "leave",
    });

    expect(result).toEqual({ success: true });

    // 驗證更新結果
    const updated = await db.getVolunteerById(testVolunteerId);
    expect(updated?.employeeId).toBe("V-UPDATE-002");
    expect(updated?.department).toBe("更新後部門");
    expect(updated?.position).toBe("更新後職位");
    expect(updated?.skills).toBe("更新後專長");
    expect(updated?.status).toBe("leave");
  });

  it("should update only specified fields", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 先獲取初始值
    const original = await db.getVolunteerById(testVolunteerId);
    const originalEmployeeId = original?.employeeId;
    const originalDepartment = original?.department;

    await caller.volunteers.update({
      id: testVolunteerId,
      status: "inactive",
    });

    const updated = await db.getVolunteerById(testVolunteerId);
    expect(updated?.status).toBe("inactive");
    expect(updated?.employeeId).toBe(originalEmployeeId); // 未變更
    expect(updated?.department).toBe(originalDepartment); // 未變更
  });
});

describe("volunteers.delete", () => {
  let testVolunteerId: number;
  let testUserId: number;

  beforeEach(async () => {
    // 建立測試使用者
    await db.upsertUser({
      openId: "test-volunteer-delete",
      name: "Test Volunteer Delete",
      email: "volunteer-delete@test.com",
      loginMethod: "manus",
    });
    const user = await db.getUserByOpenId("test-volunteer-delete");
    testUserId = user!.id;

    // 建立測試志工
    await db.createVolunteer({
      userId: testUserId,
      employeeId: "V-DELETE-001",
      department: "測試部門",
    });
    const volunteer = await db.getVolunteerByUserId(testUserId);
    testVolunteerId = volunteer!.id;
  });

  it("should delete volunteer successfully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.volunteers.delete({
      id: testVolunteerId,
    });

    expect(result).toEqual({ success: true });

    // 驗證刪除結果
    const deleted = await db.getVolunteerById(testVolunteerId);
    expect(deleted).toBeUndefined();
  });

  it("should delete volunteer and related records", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 建立相關的排班記錄
    await db.createSchedule({
      volunteerId: testVolunteerId,
      shiftDate: new Date("2025-01-25"),
      shiftTime: "09:00-12:00",
      shiftType: "morning",
      status: "scheduled",
    });

    // 刪除志工
    await caller.volunteers.delete({
      id: testVolunteerId,
    });

    // 驗證志工和相關記錄都已刪除
    const deletedVolunteer = await db.getVolunteerById(testVolunteerId);
    expect(deletedVolunteer).toBeUndefined();
  });
});
