import {
  eq,
  and,
  desc,
  gte,
  lte,
  or,
  like,
  sql,
  isNotNull,
  inArray,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  volunteers,
  InsertVolunteer,
  bookings,
  InsertBooking,
  individualBookings,
  InsertIndividualBooking,
  groupBookings,
  InsertGroupBooking,
  schedules,
  InsertSchedule,
  attendances,
  InsertAttendance,
  leaveRequests,
  InsertLeaveRequest,
  cases,
  InsertCase,
  caseProgress,
  InsertCaseProgress,
  mealDeliveries,
  InsertMealDelivery,
  deliveryTracking,
  InsertDeliveryTracking,
  deliveryServiceLogs,
  InsertDeliveryServiceLog,
  deliveryTasks,
  InsertDeliveryTask,
  deliveryPoints,
  InsertDeliveryPoint,
  notifications,
  InsertNotification,
  emailLogs,
  InsertEmailLog,
  type EmailLog,
  news,
  InsertNews,
  type News,
  gallery,
  InsertGallery,
  type Gallery,
  homeContent,
  InsertHomeContent,
  type HomeContent,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ 首頁內容管理 ============

export async function getHomeContent() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get home content: database not available");
    return null;
  }
  const result = await db.select().from(homeContent).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateHomeContent(
  data: Partial<InsertHomeContent> & { id: number }
) {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot update home content: database not available"
    );
    return;
  }
  await db.update(homeContent).set(data).where(eq(homeContent.id, data.id));
}

// ============ 使用者相關 ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(
  userId: number,
  role: "user" | "volunteer" | "admin"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============ 志工相關 ============

export async function createVolunteer(data: InsertVolunteer) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(volunteers).values(data);
  return result;
}

export async function getVolunteerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVolunteersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.userId, userId));
  return result;
}

export async function getVolunteerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllVolunteers() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      volunteer: volunteers,
      user: users,
    })
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .orderBy(desc(volunteers.createdAt));
}

export async function updateVolunteerHours(
  volunteerId: number,
  additionalHours: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(volunteers)
    .set({ totalHours: sql`${volunteers.totalHours} + ${additionalHours}` })
    .where(eq(volunteers.id, volunteerId));
}

export async function updateVolunteer(
  id: number,
  data: Partial<InsertVolunteer>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(volunteers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(volunteers.id, id));
}

export async function deleteVolunteer(id: number) {
  const db = await getDb();
  if (!db) return;

  // 刪除志工前，先刪除相關的排班、打卡、請假等記錄
  await db.delete(attendances).where(eq(attendances.volunteerId, id));
  await db.delete(leaveRequests).where(eq(leaveRequests.volunteerId, id));
  await db.delete(schedules).where(eq(schedules.volunteerId, id));

  // 刪除送餐任務的志工指派（將volunteerId設為null，不刪除任務記錄）
  await db
    .update(mealDeliveries)
    .set({ volunteerId: null })
    .where(eq(mealDeliveries.volunteerId, id));

  // 最後刪除志工記錄
  await db.delete(volunteers).where(eq(volunteers.id, id));
}

// ============ 預約相關 ============

export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) return null;

  // 根據預約類型儲存到不同的表
  if (data.type === "individual") {
    // 個人預約：儲存到individualBookings表
    const individualData: InsertIndividualBooking = {
      bookingNumber: data.bookingNumber!,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      numberOfPeople: data.numberOfPeople,
      adultCount: data.adultCount,
      childCount: data.childCount,
      visitDate: data.visitDate,
      visitTime: data.visitTime,
      purpose: data.notes, // 將 notes 對應到 purpose 欄位
      status: data.status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed",
    };
    await db.insert(individualBookings).values(individualData);
  } else if (data.type === "group") {
    // 團體預約：儲存到groupBookings表
    const groupData: InsertGroupBooking = {
      bookingNumber: data.bookingNumber!,
      organizationName: data.organizationName || "未提供",
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      numberOfPeople: data.numberOfPeople,
      adultCount: data.adultCount,
      childCount: data.childCount,
      visitDate: data.visitDate,
      visitTime: data.visitTime,
      arrivalTime: data.arrivalTime,
      notes: data.notes,
      status: data.status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed",
    };
    await db.insert(groupBookings).values(groupData);
  } else {
    // 如果沒有指定type，使用舊的bookings表（向下相容）
    await db.insert(bookings).values(data);
  }

  // Return the created booking by bookingNumber
  if (data.bookingNumber) {
    return await getBookingByNumber(data.bookingNumber);
  }
  return null;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingByNumber(bookingNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  // 先嘗試從individualBookings表中查詢
  const individualResult = await db
    .select()
    .from(individualBookings)
    .where(eq(individualBookings.bookingNumber, bookingNumber))
    .limit(1);
  if (individualResult.length > 0) {
    // 轉換為Booking格式（加上type欄位）
    return { ...individualResult[0], type: "individual" as const };
  }

  // 嘗試從groupBookings表中查詢
  const groupResult = await db
    .select()
    .from(groupBookings)
    .where(eq(groupBookings.bookingNumber, bookingNumber))
    .limit(1);
  if (groupResult.length > 0) {
    // 轉換為Booking格式（加上type欄位）
    return { ...groupResult[0], type: "group" as const };
  }

  // 最後嘗試從舊的bookings表中查詢（向下相容）
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.bookingNumber, bookingNumber))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingByPhone(contactPhone: string) {
  const db = await getDb();
  if (!db) return undefined;

  // 先嘗試從individualBookings表中查詢
  const individualResult = await db
    .select()
    .from(individualBookings)
    .where(eq(individualBookings.contactPhone, contactPhone))
    .orderBy(desc(individualBookings.createdAt))
    .limit(1);
  if (individualResult.length > 0) {
    // 轉換為Booking格式（加上type欄位）
    return { ...individualResult[0], type: "individual" as const };
  }

  // 嘗試從groupBookings表中查詢
  const groupResult = await db
    .select()
    .from(groupBookings)
    .where(eq(groupBookings.contactPhone, contactPhone))
    .orderBy(desc(groupBookings.createdAt))
    .limit(1);
  if (groupResult.length > 0) {
    // 轉換為Booking格式（加上type欄位）
    return { ...groupResult[0], type: "group" as const };
  }

  // 最後嘗試從舊的bookings表中查詢（向下相容）
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.contactPhone, contactPhone))
    .orderBy(desc(bookings.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];

  // 查詢個人預約
  const individualResults = await db
    .select()
    .from(individualBookings)
    .orderBy(desc(individualBookings.createdAt));
  const individualWithType = individualResults.map(b => ({
    ...b,
    type: "individual" as const,
  }));

  // 查詢團體預約
  const groupResults = await db
    .select()
    .from(groupBookings)
    .orderBy(desc(groupBookings.createdAt));
  const groupWithType = groupResults.map(b => ({
    ...b,
    type: "group" as const,
  }));

  // 合併並按建立時間排序
  const allBookings = [...individualWithType, ...groupWithType];
  allBookings.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return allBookings;
}

// 編輯預約資料
export async function updateBooking(
  id: number,
  type: "individual" | "group",
  data: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    numberOfPeople?: number;
    visitDate?: Date;
    visitTime?: string;
    purpose?: string;
    specialNeeds?: string;
    status?: "pending" | "confirmed" | "cancelled" | "completed";
    organizationName?: string;
  }
) {
  const db = await getDb();
  if (!db) return false;

  if (type === "individual") {
    await db
      .update(individualBookings)
      .set(data)
      .where(eq(individualBookings.id, id));
  } else {
    await db.update(groupBookings).set(data).where(eq(groupBookings.id, id));
  }
  return true;
}

// 刪除預約
export async function deleteBooking(id: number, type: "individual" | "group") {
  const db = await getDb();
  if (!db) return false;

  if (type === "individual") {
    await db.delete(individualBookings).where(eq(individualBookings.id, id));
  } else {
    await db.delete(groupBookings).where(eq(groupBookings.id, id));
  }
  return true;
}

// 查詢個人預約（只查individualBookings表）
export async function getIndividualBookingsByDateRange(
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(individualBookings)
    .where(
      and(
        gte(individualBookings.visitDate, startDate),
        lte(individualBookings.visitDate, endDate)
      )
    )
    .orderBy(individualBookings.visitDate);

  return results.map(b => ({
    ...b,
    type: "individual" as const,
    organizationName: undefined,
  }));
}

// 查詢團體預約（只查groupBookings表）
export async function getGroupBookingsByDateRange(
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(groupBookings)
    .where(
      and(
        gte(groupBookings.visitDate, startDate),
        lte(groupBookings.visitDate, endDate)
      )
    )
    .orderBy(groupBookings.visitDate);

  return results.map(b => ({
    ...b,
    type: "group" as const,
  }));
}

// 查詢所有預約（合併個人和團體，用於管理員後台）
export async function getBookingsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // 查詢個人預約
  const individualResults = await db
    .select()
    .from(individualBookings)
    .where(
      and(
        gte(individualBookings.visitDate, startDate),
        lte(individualBookings.visitDate, endDate)
      )
    )
    .orderBy(individualBookings.visitDate);

  // 查詢團體預約
  const groupResults = await db
    .select()
    .from(groupBookings)
    .where(
      and(
        gte(groupBookings.visitDate, startDate),
        lte(groupBookings.visitDate, endDate)
      )
    )
    .orderBy(groupBookings.visitDate);

  // 合併結果，統一格式
  const combined = [
    ...individualResults.map(b => ({
      ...b,
      type: "individual" as const,
      organizationName: undefined,
    })),
    ...groupResults.map(b => ({
      ...b,
      type: "group" as const,
    })),
  ];

  // 按日期排序
  return combined.sort(
    (a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
  );
}

export async function updateBookingStatus(
  id: number,
  status: "pending" | "confirmed" | "cancelled" | "completed",
  bookingType?: "individual" | "group"
) {
  const db = await getDb();
  if (!db) return;

  // 根據預約類型更新對應的表
  if (bookingType === "individual") {
    await db
      .update(individualBookings)
      .set({ status })
      .where(eq(individualBookings.id, id));
  } else if (bookingType === "group") {
    await db
      .update(groupBookings)
      .set({ status })
      .where(eq(groupBookings.id, id));
  } else {
    // 向下相容：如果沒有指定類型，嘗試更新所有表
    await db.update(bookings).set({ status }).where(eq(bookings.id, id));
    await db
      .update(individualBookings)
      .set({ status })
      .where(eq(individualBookings.id, id));
    await db
      .update(groupBookings)
      .set({ status })
      .where(eq(groupBookings.id, id));
  }
}

export async function assignVolunteerToBooking(
  bookingId: number,
  volunteerId: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(bookings)
    .set({ assignedVolunteerId: volunteerId })
    .where(eq(bookings.id, bookingId));
}

/**
 * 查詢需要發送提醒Email的預約（參訪日前3天）
 */
export async function getBookingsNeedingReminder() {
  const db = await getDb();
  if (!db) return [];

  // 計算3天後的日期範圍（當天的開始和結束）
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  threeDaysLater.setHours(0, 0, 0, 0); // 設定為當天開始

  const threeDaysLaterEnd = new Date(threeDaysLater);
  threeDaysLaterEnd.setHours(23, 59, 59, 999); // 設定為當天結束

  // 查詢條件：
  // 1. 參訪日期為3天後
  // 2. 還沒有發送過提醒（reminderSent = 'no'）
  // 3. 預約狀態為 pending 或 confirmed
  // 4. 有提供Email
  return await db
    .select()
    .from(bookings)
    .where(
      and(
        gte(bookings.visitDate, threeDaysLater),
        lte(bookings.visitDate, threeDaysLaterEnd),
        eq(bookings.reminderSent, "no"),
        or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
        isNotNull(bookings.contactEmail)
      )
    )
    .orderBy(bookings.visitDate);
}

/**
 * 標記預約已發送提醒Email
 */
export async function markBookingReminderSent(bookingId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(bookings)
    .set({ reminderSent: "yes" })
    .where(eq(bookings.id, bookingId));
}

// ============ 排班相關 ============

export async function createSchedule(data: InsertSchedule) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(schedules).values(data);
  return result;
}

export async function getSchedulesByVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(schedules)
    .where(eq(schedules.volunteerId, volunteerId))
    .orderBy(desc(schedules.shiftDate));
}

export async function getSchedulesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      schedule: schedules,
      volunteer: volunteers,
      user: users,
    })
    .from(schedules)
    .leftJoin(volunteers, eq(schedules.volunteerId, volunteers.id))
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(
      and(
        gte(schedules.shiftDate, startDate),
        lte(schedules.shiftDate, endDate)
      )
    )
    .orderBy(schedules.shiftDate);
}

export async function updateScheduleStatus(
  id: number,
  status: "scheduled" | "completed" | "absent" | "leave"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(schedules).set({ status }).where(eq(schedules.id, id));
}

// ============ 打卡相關 ============

export async function createAttendance(data: InsertAttendance) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(attendances).values(data);
  return result;
}

export async function getAttendancesByVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(attendances)
    .where(eq(attendances.volunteerId, volunteerId))
    .orderBy(desc(attendances.createdAt));
}

export async function checkOut(
  attendanceId: number,
  checkOutTime: Date,
  workHours: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(attendances)
    .set({ checkOutTime, workHours })
    .where(eq(attendances.id, attendanceId));
}

// ============ 請假/換班相關 ============

export async function createLeaveRequest(data: InsertLeaveRequest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(leaveRequests).values(data);
  return result;
}

export async function getLeaveRequestsByVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.volunteerId, volunteerId))
    .orderBy(desc(leaveRequests.createdAt));
}

export async function getPendingLeaveRequests() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      request: leaveRequests,
      volunteer: volunteers,
      user: users,
    })
    .from(leaveRequests)
    .leftJoin(volunteers, eq(leaveRequests.volunteerId, volunteers.id))
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(leaveRequests.status, "pending"))
    .orderBy(desc(leaveRequests.createdAt));
}

export async function updateLeaveRequestStatus(
  id: number,
  status: "pending" | "approved" | "rejected",
  reviewedBy: number,
  reviewNotes?: string
) {
  const db = await getDb();
  if (!db) return;

  // 取得請假申請資料
  const leaveRequest = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, id))
    .limit(1);

  if (leaveRequest.length === 0) return;

  const request = leaveRequest[0];

  // 更新請假申請狀態
  await db
    .update(leaveRequests)
    .set({ status, reviewedBy, reviewedAt: new Date(), reviewNotes })
    .where(eq(leaveRequests.id, id));

  // 取得志工和使用者資料
  const volunteerData = await db
    .select({
      volunteerId: volunteers.id,
      userId: volunteers.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.id, request.volunteerId))
    .limit(1);

  if (volunteerData.length === 0) return;

  const { userId, userName, userEmail } = volunteerData[0];

  // 發送系統內通知
  const notificationTitle =
    status === "approved" ? "請假/換班申請已核准" : "請假/換班申請已拒絕";

  const notificationMessage =
    status === "approved"
      ? `您的${request.type === "leave" ? "請假" : "換班"}申請已被核准。${reviewNotes ? `\n審核備註：${reviewNotes}` : ""}`
      : `您的${request.type === "leave" ? "請假" : "換班"}申請已被拒絕。${reviewNotes ? `\n拒絕原因：${reviewNotes}` : ""}`;

  await createNotification({
    userId,
    type: "leave_request_review",
    title: notificationTitle,
    message: notificationMessage,
    relatedId: id,
    relatedType: "leave_request",
    isRead: false,
  });

  return {
    volunteerId: volunteerData[0].volunteerId,
    userId,
    userName: userName || "志工",
    userEmail: userEmail || null,
    requestType: request.type,
  };
}

// ============ 案件相關 ============

export async function createCase(data: InsertCase) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(cases).values(data);
  return result;
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCaseByCaseNumber(caseNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(cases)
    .where(eq(cases.caseNumber, caseNumber))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function updateCaseStatus(
  id: number,
  status: "submitted" | "reviewing" | "processing" | "completed" | "rejected"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(cases).set({ status }).where(eq(cases.id, id));
}

export async function assignCaseTo(caseId: number, assignedTo: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(cases).set({ assignedTo }).where(eq(cases.id, caseId));
}

// ============ 案件進度相關 ============

export async function createCaseProgress(data: InsertCaseProgress) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(caseProgress).values(data);
  return result;
}

export async function getCaseProgressByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(caseProgress)
    .where(eq(caseProgress.caseId, caseId))
    .orderBy(desc(caseProgress.createdAt));
}

// ============ 送餐相關 ============

export async function createMealDelivery(data: InsertMealDelivery) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(mealDeliveries).values(data);
  const insertId = Number(result[0].insertId);
  // 查詢並返回完整的delivery物件
  const delivery = await db
    .select()
    .from(mealDeliveries)
    .where(eq(mealDeliveries.id, insertId))
    .limit(1);
  return delivery.length > 0 ? delivery[0] : null;
}

export async function getMealDeliveryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(mealDeliveries)
    .where(eq(mealDeliveries.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMealDeliveriesByVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) return [];

  // 查詢指定志工的送餐任務並加入志工名稱
  const deliveries = await db
    .select({
      id: mealDeliveries.id,
      deliveryNumber: mealDeliveries.deliveryNumber,
      recipientId: mealDeliveries.recipientId,
      recipientName: mealDeliveries.recipientName,
      recipientPhone: mealDeliveries.recipientPhone,
      deliveryAddress: mealDeliveries.deliveryAddress,
      volunteerId: mealDeliveries.volunteerId,
      deliveryDate: mealDeliveries.deliveryDate,
      deliveryTime: mealDeliveries.deliveryTime,
      mealType: mealDeliveries.mealType,
      specialInstructions: mealDeliveries.specialInstructions,
      status: mealDeliveries.status,
      qrCode: mealDeliveries.qrCode,
      verificationCode: mealDeliveries.verificationCode,
      startTime: mealDeliveries.startTime,
      deliveredTime: mealDeliveries.deliveredTime,
      recipientSignature: mealDeliveries.recipientSignature,
      photo: mealDeliveries.photo,
      notes: mealDeliveries.notes,
      createdAt: mealDeliveries.createdAt,
      updatedAt: mealDeliveries.updatedAt,
      volunteerName: users.name,
    })
    .from(mealDeliveries)
    .leftJoin(volunteers, eq(mealDeliveries.volunteerId, volunteers.id))
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(mealDeliveries.volunteerId, volunteerId))
    .orderBy(desc(mealDeliveries.createdAt));

  return deliveries;
}

export async function getAllMealDeliveries() {
  console.log('[getAllMealDeliveries] 開始查詢送餐任務');
  try {
    const db = await getDb();
    if (!db) {
      console.log('[getAllMealDeliveries] 資料庫連線失敗');
      return [];
    }

    console.log('[getAllMealDeliveries] 資料庫連線成功，開始執行查詢...');
    // 查詢所有送餐任務並加入志工名稱
    const deliveries = await db
    .select({
      id: mealDeliveries.id,
      deliveryNumber: mealDeliveries.deliveryNumber,
      recipientId: mealDeliveries.recipientId,
      recipientName: mealDeliveries.recipientName,
      recipientPhone: mealDeliveries.recipientPhone,
      deliveryAddress: mealDeliveries.deliveryAddress,
      volunteerId: mealDeliveries.volunteerId,
      deliveryDate: mealDeliveries.deliveryDate,
      deliveryTime: mealDeliveries.deliveryTime,
      mealType: mealDeliveries.mealType,
      specialInstructions: mealDeliveries.specialInstructions,
      status: mealDeliveries.status,
      qrCode: mealDeliveries.qrCode,
      verificationCode: mealDeliveries.verificationCode,
      startTime: mealDeliveries.startTime,
      deliveredTime: mealDeliveries.deliveredTime,
      recipientSignature: mealDeliveries.recipientSignature,
      photo: mealDeliveries.photo,
      notes: mealDeliveries.notes,
      createdAt: mealDeliveries.createdAt,
      updatedAt: mealDeliveries.updatedAt,
      volunteerName: users.name,
    })
    .from(mealDeliveries)
    .leftJoin(volunteers, eq(mealDeliveries.volunteerId, volunteers.id))
    .leftJoin(users, eq(volunteers.userId, users.id))
    .orderBy(desc(mealDeliveries.createdAt));

    console.log(`[getAllMealDeliveries] 查詢完成，找到 ${deliveries.length} 筆送餐任務`);
    if (deliveries.length > 0) {
      console.log('[getAllMealDeliveries] 第一筆資料:', deliveries[0]);
    }
    return deliveries;
  } catch (error) {
    console.error('[getAllMealDeliveries] 發生錯誤:', error);
    console.error('[getAllMealDeliveries] 錯誤堆疊:', error.stack);
    return [];
  }
}

export async function updateMealDeliveryStatus(
  id: number,
  status: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled"
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(mealDeliveries)
    .set({ status })
    .where(eq(mealDeliveries.id, id));
}

export async function assignVolunteerToDelivery(
  deliveryId: number,
  volunteerId: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(mealDeliveries)
    .set({ volunteerId, status: "assigned" })
    .where(eq(mealDeliveries.id, deliveryId));
}

export async function startDelivery(deliveryId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(mealDeliveries)
    .set({ status: "in_transit", startTime: new Date() })
    .where(eq(mealDeliveries.id, deliveryId));
}

export async function completeDelivery(
  deliveryId: number,
  photo?: string,
  signature?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(mealDeliveries)
    .set({
      status: "delivered",
      deliveredTime: new Date(),
      photo,
      recipientSignature: signature,
    })
    .where(eq(mealDeliveries.id, deliveryId));
}

// 新的 GPS 送達完成功能
export async function completeDeliveryWithGPS(
  deliveryId: number,
  latitude: string,
  longitude: string,
  photo?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(mealDeliveries)
    .set({
      status: "delivered",
      deliveredAt: new Date(),
      deliveredLatitude: latitude,
      deliveredLongitude: longitude,
      deliveryPhotoUrl: photo,
    })
    .where(eq(mealDeliveries.id, deliveryId));
}

// ============ 路徑追蹤相關 ============

export async function createDeliveryTracking(data: InsertDeliveryTracking) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliveryTracking).values(data);
  return result;
}

export async function getDeliveryTrackingByDeliveryId(deliveryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(deliveryTracking)
    .where(eq(deliveryTracking.deliveryId, deliveryId))
    .orderBy(deliveryTracking.timestamp);
}

// ============ 服務回報相關 ============

export async function createDeliveryServiceLog(data: InsertDeliveryServiceLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deliveryServiceLogs).values(data);
  return result;
}

export async function getDeliveryServiceLogByDeliveryId(deliveryId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(deliveryServiceLogs)
    .where(eq(deliveryServiceLogs.deliveryId, deliveryId))
    .limit(1);
  return result[0] || null;
}

// ============ 通知相關 ============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(data);
  return result;
}

export async function getNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    )
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
}

// ============ Email歷史記錄相關函數 ============

/**
 * 記錄Email發送歷史
 */
export async function logEmailSent(log: InsertEmailLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log email: database not available");
    return;
  }

  try {
    await db.insert(emailLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to log email:", error);
  }
}

/**
 * 查詢Email發送歷史（分頁）
 */
export async function getEmailLogs(params: {
  limit?: number;
  offset?: number;
  emailType?: string;
  isTest?: boolean;
}): Promise<EmailLog[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email logs: database not available");
    return [];
  }

  try {
    const { limit = 50, offset = 0, emailType, isTest } = params;

    let query = db.select().from(emailLogs);

    const conditions = [];
    if (emailType) {
      conditions.push(eq(emailLogs.emailType, emailType));
    }
    if (isTest !== undefined) {
      conditions.push(eq(emailLogs.isTest, isTest));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query
      .orderBy(desc(emailLogs.sentAt))
      .limit(limit)
      .offset(offset);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get email logs:", error);
    return [];
  }
}

/**
 * 統計Email發送狀態
 */
export async function getEmailStats(): Promise<{
  total: number;
  success: number;
  failed: number;
  testEmails: number;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, success: 0, failed: 0, testEmails: 0 };
  }

  try {
    const allLogs = await db.select().from(emailLogs);

    return {
      total: allLogs.length,
      success: allLogs.filter(log => log.status === "success").length,
      failed: allLogs.filter(log => log.status === "failed").length,
      testEmails: allLogs.filter(log => log.isTest).length,
    };
  } catch (error) {
    console.error("[Database] Failed to get email stats:", error);
    return { total: 0, success: 0, failed: 0, testEmails: 0 };
  }
}

// ============ 志工績效統計 ============

export async function getVolunteerPerformanceStats(volunteerId: number) {
  const db = await getDb();
  if (!db) return null;

  const deliveries = await db
    .select()
    .from(mealDeliveries)
    .where(eq(mealDeliveries.volunteerId, volunteerId));

  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter(d => d.status === "delivered");
  const completedCount = completedDeliveries.length;

  // 計算平均配送時間（分鐘）
  let totalDuration = 0;
  let durationCount = 0;

  for (const delivery of completedDeliveries) {
    if (delivery.startTime && delivery.deliveredTime) {
      const duration =
        (delivery.deliveredTime.getTime() - delivery.startTime.getTime()) /
        1000 /
        60;
      totalDuration += duration;
      durationCount++;
    }
  }

  const avgDeliveryTime =
    durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

  // 計算準時率（假設預計送達時間為送餐時段結束時間）
  let onTimeCount = 0;
  for (const delivery of completedDeliveries) {
    if (delivery.deliveredTime && delivery.deliveryTime) {
      // 簡化版：假設送餐時段為1小時，例如 "11:00-12:00"
      const timeMatch = delivery.deliveryTime.match(/(\d+):(\d+)-(\d+):(\d+)/);
      if (timeMatch) {
        const endHour = parseInt(timeMatch[3]);
        const endMinute = parseInt(timeMatch[4]);

        const deliveryDate = new Date(delivery.deliveryDate);
        const deadline = new Date(deliveryDate);
        deadline.setHours(endHour, endMinute, 0, 0);

        if (delivery.deliveredTime <= deadline) {
          onTimeCount++;
        }
      }
    }
  }

  const onTimeRate =
    completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0;

  return {
    volunteerId,
    totalDeliveries,
    completedDeliveries: completedCount,
    avgDeliveryTime, // 分鐘
    onTimeRate, // 百分比
    onTimeCount,
  };
}

export async function getAllVolunteersPerformance() {
  const db = await getDb();
  if (!db) return [];

  const volunteersData = await db.select().from(volunteers);

  const stats = await Promise.all(
    volunteersData.map(async volunteer => {
      const performance = await getVolunteerPerformanceStats(volunteer.id);
      const user = await getUserById(volunteer.userId);
      return {
        ...volunteer,
        ...performance,
        name: user?.name,
        email: user?.email,
      };
    })
  );

  return stats;
}

// ============ 義工管理相關 ============

/**
 * 建立義工申請
 */
export async function createVolunteerApplication(data: {
  userId: number;
  employeeId?: string;
  department?: string;
  position?: string;
  skills?: string;
  availability?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const volunteer: InsertVolunteer = {
    userId: data.userId,
    employeeId: data.employeeId,
    department: data.department,
    position: data.position,
    skills: data.skills,
    availability: data.availability,
    status: "inactive", // 待審核狀態
    totalHours: 0,
  };

  const result = await db.insert(volunteers).values(volunteer);
  return result;
}

/**
 * 獲取待審核的義工列表
 */
export async function getPendingVolunteers() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: volunteers.id,
      userId: volunteers.userId,
      userName: users.name,
      userEmail: users.email,
      userPhone: users.phone,
      employeeId: volunteers.employeeId,
      department: volunteers.department,
      position: volunteers.position,
      skills: volunteers.skills,
      availability: volunteers.availability,
      status: volunteers.status,
      createdAt: volunteers.createdAt,
    })
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(eq(volunteers.status, "inactive"))
    .orderBy(desc(volunteers.createdAt));
}

/**
 * 審核義工申請（核准）
 */
export async function approveVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 更新volunteer狀態為active
  await db
    .update(volunteers)
    .set({ status: "active", joinedAt: new Date() })
    .where(eq(volunteers.id, volunteerId));

  // 2. 獲取userId
  const volunteer = await db
    .select({ userId: volunteers.userId })
    .from(volunteers)
    .where(eq(volunteers.id, volunteerId))
    .limit(1);

  if (volunteer[0]) {
    // 3. 更新user的role為volunteer
    await db
      .update(users)
      .set({ role: "volunteer" })
      .where(eq(users.id, volunteer[0].userId));
  }

  return { success: true };
}

/**
 * 拒絕義工申請
 */
export async function rejectVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 刪除volunteer記錄
  await db.delete(volunteers).where(eq(volunteers.id, volunteerId));

  return { success: true };
}

/**
 * 更新義工狀態
 */
export async function updateVolunteerStatus(
  volunteerId: number,
  status: "active" | "inactive" | "leave"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(volunteers)
    .set({ status })
    .where(eq(volunteers.id, volunteerId));

  return { success: true };
}

// ============ 送餐任務管理相關 ============

/**
 * 建立送餐任務
 */
export async function createDeliveryTask(data: {
  taskNumber: string;
  taskDate: Date;
  volunteerId?: number;
  volunteerName?: string;
  notes?: string;
  points: Array<{
    sequence: number;
    recipientName: string;
    recipientPhone: string;
    deliveryAddress: string;
    latitude?: string;
    longitude?: string;
    specialInstructions?: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 建立任務
  const taskData: InsertDeliveryTask = {
    taskNumber: data.taskNumber,
    taskDate: data.taskDate,
    volunteerId: data.volunteerId,
    volunteerName: data.volunteerName,
    status: data.volunteerId ? "assigned" : "pending",
    totalPoints: data.points.length,
    completedPoints: 0,
    notes: data.notes,
  };

  const taskResult = await db.insert(deliveryTasks).values(taskData);
  const taskId = Number(taskResult[0].insertId);

  // 2. 建立送餐點
  const pointsData: InsertDeliveryPoint[] = data.points.map(point => ({
    taskId,
    sequence: point.sequence,
    recipientName: point.recipientName,
    recipientPhone: point.recipientPhone,
    deliveryAddress: point.deliveryAddress,
    latitude: point.latitude,
    longitude: point.longitude,
    specialInstructions: point.specialInstructions,
    status: "pending",
  }));

  await db.insert(deliveryPoints).values(pointsData);

  return { taskId, success: true };
}

/**
 * 獲取所有送餐任務列表
 */
export async function getAllDeliveryTasks(filters?: {
  status?: string;
  volunteerId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(deliveryTasks)
    .orderBy(desc(deliveryTasks.taskDate));

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(deliveryTasks.status, filters.status as any));
  }
  if (filters?.volunteerId) {
    conditions.push(eq(deliveryTasks.volunteerId, filters.volunteerId));
  }
  if (filters?.startDate) {
    conditions.push(gte(deliveryTasks.taskDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(deliveryTasks.taskDate, filters.endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query;
}

/**
 * 獲取單一送餐任務詳細資訊（含送餐點）
 */
export async function getDeliveryTaskById(taskId: number) {
  const db = await getDb();
  if (!db) return null;

  // 1. 獲取任務基本資訊
  const task = await db
    .select()
    .from(deliveryTasks)
    .where(eq(deliveryTasks.id, taskId))
    .limit(1);

  if (!task[0]) return null;

  // 2. 獲取送餐點列表
  const points = await db
    .select()
    .from(deliveryPoints)
    .where(eq(deliveryPoints.taskId, taskId))
    .orderBy(deliveryPoints.sequence);

  return {
    ...task[0],
    points,
  };
}

/**
 * 指派送餐任務給義工
 */
export async function assignDeliveryTask(
  taskId: number,
  volunteerId: number,
  volunteerName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(deliveryTasks)
    .set({
      volunteerId,
      volunteerName,
      status: "assigned",
    })
    .where(eq(deliveryTasks.id, taskId));

  return { success: true };
}

/**
 * 標記送餐點為已完成
 */
export async function markDeliveryPointComplete(pointId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 更新送餐點狀態
  await db
    .update(deliveryPoints)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(deliveryPoints.id, pointId));

  // 2. 獲取taskId
  const point = await db
    .select({ taskId: deliveryPoints.taskId })
    .from(deliveryPoints)
    .where(eq(deliveryPoints.id, pointId))
    .limit(1);

  if (point[0]) {
    // 3. 更新任務的completedPoints
    const taskId = point[0].taskId;
    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveryPoints)
      .where(
        and(
          eq(deliveryPoints.taskId, taskId),
          eq(deliveryPoints.status, "completed")
        )
      );

    await db
      .update(deliveryTasks)
      .set({ completedPoints: Number(completedCount[0]?.count || 0) })
      .where(eq(deliveryTasks.id, taskId));

    // 4. 檢查是否所有送餐點都已完成
    const task = await db
      .select()
      .from(deliveryTasks)
      .where(eq(deliveryTasks.id, taskId))
      .limit(1);

    if (task[0] && task[0].completedPoints === task[0].totalPoints) {
      // 所有送餐點都已完成，更新任務狀態
      await db
        .update(deliveryTasks)
        .set({
          status: "completed",
          completedTime: new Date(),
        })
        .where(eq(deliveryTasks.id, taskId));
    }
  }

  return { success: true };
}

/**
 * 開始送餐任務
 */
export async function startDeliveryTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(deliveryTasks)
    .set({
      status: "in_progress",
      startTime: new Date(),
    })
    .where(eq(deliveryTasks.id, taskId));

  return { success: true };
}

/**
 * 取得所有志工的送餐統計
 */
export async function getVolunteerDeliveryStats() {
  const db = await getDb();
  if (!db) return [];

  // 查詢所有志工及其使用者資料
  const volunteersData = await db
    .select({
      volunteerId: volunteers.id,
      employeeId: volunteers.employeeId,
      department: volunteers.department,
      position: volunteers.position,
      userId: volunteers.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(volunteers)
    .leftJoin(users, eq(volunteers.userId, users.id));

  // 為每位志工統計送餐任務
  const stats = await Promise.all(
    volunteersData.map(async volunteer => {
      // 查詢該志工的所有送餐任務
      const deliveries = await db
        .select()
        .from(mealDeliveries)
        .where(eq(mealDeliveries.volunteerId, volunteer.volunteerId));

      // 統計各狀態的任務數
      const total = deliveries.length;
      const completed = deliveries.filter(d => d.status === "delivered").length;
      const inProgress = deliveries.filter(
        d => d.status === "in_transit"
      ).length;
      const assigned = deliveries.filter(d => d.status === "assigned").length;
      const pending = deliveries.filter(d => d.status === "pending").length;

      return {
        volunteerId: volunteer.volunteerId,
        employeeId: volunteer.employeeId,
        department: volunteer.department,
        position: volunteer.position,
        userName: volunteer.userName,
        userEmail: volunteer.userEmail,
        total,
        completed,
        inProgress,
        assigned,
        pending,
      };
    })
  );

  // 只返回有送餐任務的志工，並按總任務數排序
  return stats.filter(s => s.total > 0).sort((a, b) => b.total - a.total);
}

export async function deleteMealDelivery(id: number): Promise<void> {
  const database = await getDb();
  if (!database) {
    console.warn(
      "[Database] Cannot delete meal delivery: database not available"
    );
    return;
  }

  try {
    await database.delete(mealDeliveries).where(eq(mealDeliveries.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete meal delivery:", error);
    throw error;
  }
}

export async function batchDeleteMealDeliveries(ids: number[]): Promise<void> {
  const database = await getDb();
  if (!database) {
    console.warn(
      "[Database] Cannot batch delete meal deliveries: database not available"
    );
    return;
  }

  try {
    // 使用 Drizzle ORM 的 inArray 函數批次刪除
    await database
      .delete(mealDeliveries)
      .where(inArray(mealDeliveries.id, ids));
  } catch (error) {
    console.error("[Database] Failed to batch delete meal deliveries:", error);
    throw error;
  }
}

// ============ 最新消息相關 ============

export async function createNews(newsData: InsertNews): Promise<News> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    const result = await database.insert(news).values(newsData);
    const insertedId = Number(result[0].insertId);
    const inserted = await database
      .select()
      .from(news)
      .where(eq(news.id, insertedId))
      .limit(1);
    return inserted[0]!;
  } catch (error) {
    console.error("[Database] Failed to create news:", error);
    throw error;
  }
}

export async function updateNews(
  id: number,
  newsData: Partial<InsertNews>
): Promise<void> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    await database.update(news).set(newsData).where(eq(news.id, id));
  } catch (error) {
    console.error("[Database] Failed to update news:", error);
    throw error;
  }
}

export async function deleteNews(id: number): Promise<void> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    await database.delete(news).where(eq(news.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete news:", error);
    throw error;
  }
}

export async function getNewsById(id: number): Promise<News | undefined> {
  const database = await getDb();
  if (!database) {
    return undefined;
  }

  try {
    const result = await database
      .select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get news by id:", error);
    return undefined;
  }
}

export async function getAllNews(limit?: number): Promise<News[]> {
  const database = await getDb();
  if (!database) {
    return [];
  }

  try {
    const query = database.select().from(news).orderBy(desc(news.createdAt));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  } catch (error) {
    console.error("[Database] Failed to get all news:", error);
    return [];
  }
}

export async function getPublishedNews(limit?: number): Promise<News[]> {
  const database = await getDb();
  if (!database) {
    return [];
  }

  try {
    const query = database
      .select()
      .from(news)
      .where(eq(news.isPublished, true))
      .orderBy(desc(news.publishedAt));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  } catch (error) {
    console.error("[Database] Failed to get published news:", error);
    return [];
  }
}

export async function incrementNewsViewCount(id: number): Promise<void> {
  const database = await getDb();
  if (!database) {
    return;
  }

  try {
    await database
      .update(news)
      .set({ viewCount: sql`${news.viewCount} + 1` })
      .where(eq(news.id, id));
  } catch (error) {
    console.error("[Database] Failed to increment news view count:", error);
  }
}

// ============ 服務花絮照片牆相關 ============

export async function createGalleryItem(
  galleryData: InsertGallery
): Promise<Gallery> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    const result = await database.insert(gallery).values(galleryData);
    const insertedId = Number(result[0].insertId);
    const inserted = await database
      .select()
      .from(gallery)
      .where(eq(gallery.id, insertedId))
      .limit(1);
    return inserted[0]!;
  } catch (error) {
    console.error("[Database] Failed to create gallery item:", error);
    throw error;
  }
}

export async function updateGalleryItem(
  id: number,
  galleryData: Partial<InsertGallery>
): Promise<void> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    await database.update(gallery).set(galleryData).where(eq(gallery.id, id));
  } catch (error) {
    console.error("[Database] Failed to update gallery item:", error);
    throw error;
  }
}

export async function deleteGalleryItem(id: number): Promise<void> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    await database.delete(gallery).where(eq(gallery.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete gallery item:", error);
    throw error;
  }
}

export async function getGalleryById(id: number): Promise<Gallery | undefined> {
  const database = await getDb();
  if (!database) {
    return undefined;
  }

  try {
    const result = await database
      .select()
      .from(gallery)
      .where(eq(gallery.id, id))
      .limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get gallery by id:", error);
    return undefined;
  }
}

export async function getAllGallery(): Promise<Gallery[]> {
  const database = await getDb();
  if (!database) {
    return [];
  }

  try {
    return await database
      .select()
      .from(gallery)
      .orderBy(desc(gallery.displayOrder), desc(gallery.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get all gallery:", error);
    return [];
  }
}

export async function getPublishedGallery(limit?: number): Promise<Gallery[]> {
  const database = await getDb();
  if (!database) {
    return [];
  }

  try {
    const query = database
      .select()
      .from(gallery)
      .where(eq(gallery.isPublished, true))
      .orderBy(desc(gallery.displayOrder), desc(gallery.createdAt));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  } catch (error) {
    console.error("[Database] Failed to get published gallery:", error);
    return [];
  }
}

export async function batchDeleteGalleryItems(ids: number[]): Promise<number> {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    await database.delete(gallery).where(inArray(gallery.id, ids));
    return ids.length;
  } catch (error) {
    console.error("[Database] Failed to batch delete gallery items:", error);
    throw error;
  }
}

// ============ 報表匯出相關 ============

/**
 * 查詢指定時間範圍內的送餐資料，用於衛福部報表匯出
 */
export async function getMealDeliveriesForReport(
  startDate: Date,
  endDate: Date
) {
  console.log('[getMealDeliveriesForReport] 開始查詢報表資料');
  console.log('[getMealDeliveriesForReport] 時間範圍:', startDate, '至', endDate);
  
  try {
    const db = await getDb();
    if (!db) {
      console.log('[getMealDeliveriesForReport] 資料庫連線失敗');
      return [];
    }

    const deliveries = await db
      .select({
        // mealDeliveries 欄位
        id: mealDeliveries.id,
        deliveryNumber: mealDeliveries.deliveryNumber,
        recipientName: mealDeliveries.recipientName,
        recipientPhone: mealDeliveries.recipientPhone,
        deliveryAddress: mealDeliveries.deliveryAddress,
        deliveryDate: mealDeliveries.deliveryDate,
        deliveryTime: mealDeliveries.deliveryTime,
        mealType: mealDeliveries.mealType,
        status: mealDeliveries.status,
        startTime: mealDeliveries.startTime,
        deliveredAt: mealDeliveries.deliveredAt,
        deliveredLatitude: mealDeliveries.deliveredLatitude,
        deliveredLongitude: mealDeliveries.deliveredLongitude,
        deliveryPhotoUrl: mealDeliveries.deliveryPhotoUrl,
        deliveryNotes: mealDeliveries.notes,
        specialInstructions: mealDeliveries.specialInstructions,
        
        // 志工資訊
        volunteerName: users.name,
        
        // deliveryServiceLogs 欄位
        recipientStatus: deliveryServiceLogs.recipientStatus,
        mealStatus: deliveryServiceLogs.mealStatus,
        serviceNotes: deliveryServiceLogs.notes,
        serviceLogCreatedAt: deliveryServiceLogs.createdAt,
      })
      .from(mealDeliveries)
      .leftJoin(volunteers, eq(mealDeliveries.volunteerId, volunteers.id))
      .leftJoin(users, eq(volunteers.userId, users.id))
      .leftJoin(deliveryServiceLogs, eq(deliveryServiceLogs.deliveryId, mealDeliveries.id))
      .where(
        and(
          gte(mealDeliveries.deliveryDate, startDate),
          lte(mealDeliveries.deliveryDate, endDate)
        )
      )
      .orderBy(desc(mealDeliveries.deliveryDate), desc(mealDeliveries.createdAt));

    console.log(`[getMealDeliveriesForReport] 查詢完成，找到 ${deliveries.length} 筆資料`);
    return deliveries;
  } catch (error) {
    console.error('[getMealDeliveriesForReport] 發生錯誤:', error);
    console.error('[getMealDeliveriesForReport] 錯誤堆疊:', error.stack);
    return [];
  }
}
