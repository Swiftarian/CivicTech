import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as db from "./db";
import * as emailService from "./emailService";
import { sendBookingReminders } from "./scheduledTasks";

// Mock database and email functions
vi.mock("./db");
vi.mock("./emailService");

describe("scheduledTasks - sendBookingReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("應該成功發送民眾預約提醒Email", async () => {
    // Mock 資料：3天後的民眾預約
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const mockBookings = [
      {
        id: 1,
        bookingNumber: "BK1234567890",
        type: "individual" as const,
        contactName: "張三",
        contactEmail: "zhang@example.com",
        numberOfPeople: 5,
        visitDate: threeDaysLater,
        visitTime: "10:00-12:00",
        status: "confirmed" as const,
        reminderSent: "no" as const,
        contactPhone: "0912345678",
        organizationName: null,
        purpose: null,
        specialNeeds: null,
        userId: null,
        assignedVolunteerId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getBookingsNeedingReminder).mockResolvedValue(mockBookings);
    vi.mocked(emailService.sendPublicBookingReminderEmail).mockResolvedValue(true);
    vi.mocked(db.markBookingReminderSent).mockResolvedValue(undefined);

    const results = await sendBookingReminders();

    expect(results.total).toBe(1);
    expect(results.success).toBe(1);
    expect(results.failed).toBe(0);
    expect(results.errors).toHaveLength(0);

    // 驗證Email發送函數被調用
    expect(emailService.sendPublicBookingReminderEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendPublicBookingReminderEmail).toHaveBeenCalledWith(
      "zhang@example.com",
      "張三",
      "BK1234567890",
      expect.any(String), // visitDate (格式化後的日期)
      "10:00-12:00",
      5
    );

    // 驗證標記已發送
    expect(db.markBookingReminderSent).toHaveBeenCalledTimes(1);
    expect(db.markBookingReminderSent).toHaveBeenCalledWith(1);
  });

  it("應該成功發送團體預約提醒Email", async () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const mockBookings = [
      {
        id: 2,
        bookingNumber: "BK9876543210",
        type: "group" as const,
        contactName: "李四",
        contactEmail: "li@school.edu.tw",
        organizationName: "台東國小",
        numberOfPeople: 30,
        visitDate: threeDaysLater,
        visitTime: "14:00-16:00",
        status: "confirmed" as const,
        reminderSent: "no" as const,
        contactPhone: "0987654321",
        purpose: "校外教學",
        specialNeeds: null,
        userId: null,
        assignedVolunteerId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getBookingsNeedingReminder).mockResolvedValue(mockBookings);
    vi.mocked(emailService.sendGroupBookingReminderEmail).mockResolvedValue(true);
    vi.mocked(db.markBookingReminderSent).mockResolvedValue(undefined);

    const results = await sendBookingReminders();

    expect(results.total).toBe(1);
    expect(results.success).toBe(1);
    expect(results.failed).toBe(0);

    // 驗證團體Email發送函數被調用
    expect(emailService.sendGroupBookingReminderEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendGroupBookingReminderEmail).toHaveBeenCalledWith(
      "li@school.edu.tw",
      "台東國小",
      "李四",
      "BK9876543210",
      expect.any(String),
      "14:00-16:00",
      30
    );

    expect(db.markBookingReminderSent).toHaveBeenCalledWith(2);
  });

  it("應該處理多筆預約並統計結果", async () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const mockBookings = [
      {
        id: 1,
        bookingNumber: "BK1111111111",
        type: "individual" as const,
        contactName: "王五",
        contactEmail: "wang@example.com",
        numberOfPeople: 3,
        visitDate: threeDaysLater,
        visitTime: "09:00-11:00",
        status: "pending" as const,
        reminderSent: "no" as const,
        contactPhone: "0911111111",
        organizationName: null,
        purpose: null,
        specialNeeds: null,
        userId: null,
        assignedVolunteerId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        bookingNumber: "BK2222222222",
        type: "group" as const,
        contactName: "趙六",
        contactEmail: "zhao@company.com",
        organizationName: "ABC公司",
        numberOfPeople: 20,
        visitDate: threeDaysLater,
        visitTime: "13:00-15:00",
        status: "confirmed" as const,
        reminderSent: "no" as const,
        contactPhone: "0922222222",
        purpose: "企業參訪",
        specialNeeds: null,
        userId: null,
        assignedVolunteerId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getBookingsNeedingReminder).mockResolvedValue(mockBookings);
    vi.mocked(emailService.sendPublicBookingReminderEmail).mockResolvedValue(true);
    vi.mocked(emailService.sendGroupBookingReminderEmail).mockResolvedValue(true);
    vi.mocked(db.markBookingReminderSent).mockResolvedValue(undefined);

    const results = await sendBookingReminders();

    expect(results.total).toBe(2);
    expect(results.success).toBe(2);
    expect(results.failed).toBe(0);

    expect(emailService.sendPublicBookingReminderEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendGroupBookingReminderEmail).toHaveBeenCalledTimes(1);
    expect(db.markBookingReminderSent).toHaveBeenCalledTimes(2);
  });

  it("Email發送失敗時應該記錄錯誤但不標記為已發送", async () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const mockBookings = [
      {
        id: 1,
        bookingNumber: "BK3333333333",
        type: "individual" as const,
        contactName: "陳七",
        contactEmail: "chen@example.com",
        numberOfPeople: 2,
        visitDate: threeDaysLater,
        visitTime: "10:00-12:00",
        status: "confirmed" as const,
        reminderSent: "no" as const,
        contactPhone: "0933333333",
        organizationName: null,
        purpose: null,
        specialNeeds: null,
        userId: null,
        assignedVolunteerId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getBookingsNeedingReminder).mockResolvedValue(mockBookings);
    // Mock Email發送失敗
    vi.mocked(emailService.sendPublicBookingReminderEmail).mockResolvedValue(false);

    const results = await sendBookingReminders();

    expect(results.total).toBe(1);
    expect(results.success).toBe(0);
    expect(results.failed).toBe(1);
    expect(results.errors).toHaveLength(1);
    expect(results.errors[0]).toContain("BK3333333333");

    // 驗證Email發送函數被調用
    expect(emailService.sendPublicBookingReminderEmail).toHaveBeenCalledTimes(1);
    
    // 驗證沒有標記為已發送（因為發送失敗）
    expect(db.markBookingReminderSent).not.toHaveBeenCalled();
  });

  it("沒有需要發送提醒的預約時應該回傳空結果", async () => {
    vi.mocked(db.getBookingsNeedingReminder).mockResolvedValue([]);

    const results = await sendBookingReminders();

    expect(results.total).toBe(0);
    expect(results.success).toBe(0);
    expect(results.failed).toBe(0);
    expect(results.errors).toHaveLength(0);

    expect(emailService.sendPublicBookingReminderEmail).not.toHaveBeenCalled();
    expect(emailService.sendGroupBookingReminderEmail).not.toHaveBeenCalled();
    expect(db.markBookingReminderSent).not.toHaveBeenCalled();
  });

  it("處理過程中發生異常時應該記錄錯誤並繼續處理其他預約", async () => {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const mockBookings = [
      {
        id: 1,
        bookingNumber: "BK4444444444",
        type: "individual" as const,
        contactName: "林八",
        contactEmail: "lin@example.com",
        numberOfPeople: 4,
        visitDate: threeDaysLater,
        visitTime: "09:00-11:00",
        status: "confirmed" as const,
        reminderSent: "no" as const,
        contactPhone: "0944444444",
        organizationName: null,
        purpose: null,
        specialNeeds: null,
        userId: null,
        assignedVolunteerId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        bookingNumber: "BK5555555555",
        type: "individual" as const,
        contactName: "黃九",
        contactEmail: "huang@example.com",
        numberOfPeople: 6,
        visitDate: threeDaysLater,
        visitTime: "14:00-16:00",
        status: "confirmed" as const,
        reminderSent: "no" as const,
        contactPhone: "0955555555",
        organizationName: null,
        purpose: null,
        specialNeeds: null,
        userId: null,
        assignedVolunteerId: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getBookingsNeedingReminder).mockResolvedValue(mockBookings);
    
    // 第一筆拋出異常，第二筆成功
    vi.mocked(emailService.sendPublicBookingReminderEmail)
      .mockRejectedValueOnce(new Error("SMTP連線失敗"))
      .mockResolvedValueOnce(true);
    
    vi.mocked(db.markBookingReminderSent).mockResolvedValue(undefined);

    const results = await sendBookingReminders();

    expect(results.total).toBe(2);
    expect(results.success).toBe(1);
    expect(results.failed).toBe(1);
    expect(results.errors).toHaveLength(1);
    expect(results.errors[0]).toContain("BK4444444444");
    expect(results.errors[0]).toContain("SMTP連線失敗");

    // 第二筆應該成功標記
    expect(db.markBookingReminderSent).toHaveBeenCalledTimes(1);
    expect(db.markBookingReminderSent).toHaveBeenCalledWith(2);
  });
});
