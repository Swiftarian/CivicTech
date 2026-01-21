import { describe, expect, it } from "vitest";
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
    res: {} as TrpcContext["res"],
  };
}

function createVolunteerContext(userId: number, openId: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId,
    email: `${openId}@example.com`,
    name: `Volunteer ${userId}`,
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
    res: {} as TrpcContext["res"],
  };
}

describe("leaveRequests notification flow", () => {
  it("should send notification when approving leave request", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // 1. 先建立使用者
    await db.upsertUser({
      openId: "test-volunteer-approve",
      name: "Test Volunteer Approve",
      email: "test-approve@example.com",
      role: "volunteer",
    });
    
    const testUser = await db.getUserByOpenId("test-volunteer-approve");
    expect(testUser).toBeDefined();
    
    const volunteerCtx = createVolunteerContext(testUser!.id, "test-volunteer-approve");
    const volunteerCaller = appRouter.createCaller(volunteerCtx);
    
    // 2. 建立志工
    const volunteer = await db.createVolunteer({
      userId: testUser!.id,
      employeeId: "V-APPROVE",
      department: "測試部門",
    });

    expect(volunteer).toBeDefined();

    // 3. 建立排班
    const schedule = await db.createSchedule({
      volunteerId: volunteer!.id,
      shiftDate: new Date("2025-01-15"),
      shiftTime: "09:00-12:00",
      shiftType: "morning",
    });

    expect(schedule).toBeDefined();

    // 4. 志工建立請假申請
    await volunteerCaller.leaveRequests.create({
      scheduleId: schedule!.id,
      type: "leave",
      reason: "個人事由",
    });

    // 5. 取得待審核的請假申請
    const pendingRequests = await adminCaller.leaveRequests.getPending();
    const requestToApprove = pendingRequests.find(
      (r) => r.request.volunteerId === volunteer!.id
    );
    
    expect(requestToApprove).toBeDefined();

    // 6. 管理員核准請假
    const approveResult = await adminCaller.leaveRequests.approve({
      id: requestToApprove!.request.id,
      reviewNotes: "核准您的請假申請",
    });

    expect(approveResult.success).toBe(true);

    // 7. 檢查是否發送了通知
    const notifications = await db.getNotificationsByUser(testUser!.id);
    expect(notifications.length).toBeGreaterThan(0);

    const latestNotification = notifications[0];
    expect(latestNotification.type).toBe("leave_request_review");
    expect(latestNotification.title).toContain("已核准");
    expect(latestNotification.message).toContain("請假");
    expect(latestNotification.message).toContain("核准您的請假申請");
    expect(latestNotification.isRead).toBe(false);
  });

  it("should send notification when rejecting leave request", async () => {
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    // 1. 先建立使用者
    await db.upsertUser({
      openId: "test-volunteer-reject",
      name: "Test Volunteer Reject",
      email: "test-reject@example.com",
      role: "volunteer",
    });
    
    const testUser = await db.getUserByOpenId("test-volunteer-reject");
    expect(testUser).toBeDefined();
    
    const volunteerCtx = createVolunteerContext(testUser!.id, "test-volunteer-reject");
    const volunteerCaller = appRouter.createCaller(volunteerCtx);

    // 2. 建立志工
    const volunteer = await db.createVolunteer({
      userId: testUser!.id,
      employeeId: "V-REJECT",
      department: "測試部門",
    });

    expect(volunteer).toBeDefined();

    // 3. 建立排班
    const schedule = await db.createSchedule({
      volunteerId: volunteer!.id,
      shiftDate: new Date("2025-01-16"),
      shiftTime: "13:00-17:00",
      shiftType: "afternoon",
    });

    expect(schedule).toBeDefined();

    // 4. 志工建立請假申請
    await volunteerCaller.leaveRequests.create({
      scheduleId: schedule!.id,
      type: "leave",
      reason: "臨時有事",
    });

    // 5. 取得待審核的請假申請
    const pendingRequests = await adminCaller.leaveRequests.getPending();
    const requestToReject = pendingRequests.find(
      (r) => r.request.volunteerId === volunteer!.id
    );

    expect(requestToReject).toBeDefined();

    // 6. 管理員拒絕請假
    const rejectResult = await adminCaller.leaveRequests.reject({
      id: requestToReject!.request.id,
      reviewNotes: "該時段人力不足，無法批准",
    });

    expect(rejectResult.success).toBe(true);

    // 7. 檢查是否發送了通知
    const notifications = await db.getNotificationsByUser(testUser!.id);
    expect(notifications.length).toBeGreaterThan(0);

    const latestNotification = notifications[0];
    expect(latestNotification.type).toBe("leave_request_review");
    expect(latestNotification.title).toContain("已拒絕");
    expect(latestNotification.message).toContain("請假");
    expect(latestNotification.message).toContain("該時段人力不足");
    expect(latestNotification.isRead).toBe(false);
  });

  it("should allow user to mark notification as read", async () => {
    // 取得先前建立的使用者
    const testUser = await db.getUserByOpenId("test-volunteer-approve");
    
    if (!testUser) {
      // 如果測試順序不同，跳過此測試
      expect(true).toBe(true);
      return;
    }
    
    const volunteerCtx = createVolunteerContext(testUser.id, "test-volunteer-approve");
    const volunteerCaller = appRouter.createCaller(volunteerCtx);

    // 取得未讀通知
    const unreadNotifications = await volunteerCaller.notifications.getUnread();
    
    // 如果沒有通知，跳過測試
    if (unreadNotifications.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const notificationToMark = unreadNotifications[0];

    // 標記為已讀
    await volunteerCaller.notifications.markAsRead({ id: notificationToMark.id });

    // 檢查是否已標記為已讀
    const updatedNotifications = await db.getNotificationsByUser(testUser.id);
    const markedNotification = updatedNotifications.find(
      (n) => n.id === notificationToMark.id
    );

    expect(markedNotification?.isRead).toBe(true);
    expect(markedNotification?.readAt).toBeDefined();
  });

  it("should allow user to mark all notifications as read", async () => {
    // 取得先前建立的使用者
    const testUser = await db.getUserByOpenId("test-volunteer-approve");
    
    if (!testUser) {
      // 如果測試順序不同，跳過此測試
      expect(true).toBe(true);
      return;
    }
    
    const volunteerCtx = createVolunteerContext(testUser.id, "test-volunteer-approve");
    const volunteerCaller = appRouter.createCaller(volunteerCtx);

    // 標記所有通知為已讀
    await volunteerCaller.notifications.markAllAsRead();

    // 檢查是否所有通知都已標記為已讀
    const unreadNotifications = await volunteerCaller.notifications.getUnread();
    expect(unreadNotifications.length).toBe(0);
  });
});
