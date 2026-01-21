import { eq, and, desc, gte, lte, or, like, sql, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  volunteers, InsertVolunteer,
  bookings, InsertBooking,
  schedules, InsertSchedule,
  attendances, InsertAttendance,
  leaveRequests, InsertLeaveRequest,
  cases, InsertCase,
  caseProgress, InsertCaseProgress,
  mealDeliveries, InsertMealDelivery,
  deliveryTracking, InsertDeliveryTracking,
  notifications, InsertNotification,
  emailLogs, InsertEmailLog, type EmailLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "volunteer" | "admin") {
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
  const result = await db.select().from(volunteers).where(eq(volunteers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVolunteerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(volunteers).where(eq(volunteers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllVolunteers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    volunteer: volunteers,
    user: users
  }).from(volunteers).leftJoin(users, eq(volunteers.userId, users.id)).orderBy(desc(volunteers.createdAt));
}

export async function updateVolunteerHours(volunteerId: number, additionalHours: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(volunteers)
    .set({ totalHours: sql`${volunteers.totalHours} + ${additionalHours}` })
    .where(eq(volunteers.id, volunteerId));
}

export async function updateVolunteer(id: number, data: Partial<InsertVolunteer>) {
  const db = await getDb();
  if (!db) return;
  await db.update(volunteers)
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
  
  // 最後刪除志工記錄
  await db.delete(volunteers).where(eq(volunteers.id, id));
}

// ============ 預約相關 ============

export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(bookings).values(data);
  // Return the created booking by bookingNumber
  if (data.bookingNumber) {
    return await getBookingByNumber(data.bookingNumber);
  }
  return null;
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingByNumber(bookingNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.bookingNumber, bookingNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getBookingsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookings)
    .where(and(gte(bookings.visitDate, startDate), lte(bookings.visitDate, endDate)))
    .orderBy(bookings.visitDate);
}

export async function updateBookingStatus(id: number, status: "pending" | "confirmed" | "cancelled" | "completed") {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
}

export async function assignVolunteerToBooking(bookingId: number, volunteerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(bookings).set({ assignedVolunteerId: volunteerId }).where(eq(bookings.id, bookingId));
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
  return await db.select().from(bookings)
    .where(
      and(
        gte(bookings.visitDate, threeDaysLater),
        lte(bookings.visitDate, threeDaysLaterEnd),
        eq(bookings.reminderSent, 'no'),
        or(
          eq(bookings.status, 'pending'),
          eq(bookings.status, 'confirmed')
        ),
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
  await db.update(bookings).set({ reminderSent: 'yes' }).where(eq(bookings.id, bookingId));
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
  return await db.select().from(schedules)
    .where(eq(schedules.volunteerId, volunteerId))
    .orderBy(desc(schedules.shiftDate));
}

export async function getSchedulesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    schedule: schedules,
    volunteer: volunteers,
    user: users
  }).from(schedules)
    .leftJoin(volunteers, eq(schedules.volunteerId, volunteers.id))
    .leftJoin(users, eq(volunteers.userId, users.id))
    .where(and(gte(schedules.shiftDate, startDate), lte(schedules.shiftDate, endDate)))
    .orderBy(schedules.shiftDate);
}

export async function updateScheduleStatus(id: number, status: "scheduled" | "completed" | "absent" | "leave") {
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
  return await db.select().from(attendances)
    .where(eq(attendances.volunteerId, volunteerId))
    .orderBy(desc(attendances.createdAt));
}

export async function checkOut(attendanceId: number, checkOutTime: Date, workHours: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(attendances)
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
  return await db.select().from(leaveRequests)
    .where(eq(leaveRequests.volunteerId, volunteerId))
    .orderBy(desc(leaveRequests.createdAt));
}

export async function getPendingLeaveRequests() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    request: leaveRequests,
    volunteer: volunteers,
    user: users
  }).from(leaveRequests)
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
  const leaveRequest = await db.select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, id))
    .limit(1);
  
  if (leaveRequest.length === 0) return;
  
  const request = leaveRequest[0];
  
  // 更新請假申請狀態
  await db.update(leaveRequests)
    .set({ status, reviewedBy, reviewedAt: new Date(), reviewNotes })
    .where(eq(leaveRequests.id, id));
  
  // 取得志工和使用者資料
  const volunteerData = await db.select({
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
  const notificationTitle = status === 'approved' 
    ? '請假/換班申請已核准' 
    : '請假/換班申請已拒絕';
  
  const notificationMessage = status === 'approved'
    ? `您的${request.type === 'leave' ? '請假' : '換班'}申請已被核准。${reviewNotes ? `\n審核備註：${reviewNotes}` : ''}`
    : `您的${request.type === 'leave' ? '請假' : '換班'}申請已被拒絕。${reviewNotes ? `\n拒絕原因：${reviewNotes}` : ''}`;
  
  await createNotification({
    userId,
    type: 'leave_request_review',
    title: notificationTitle,
    message: notificationMessage,
    relatedId: id,
    relatedType: 'leave_request',
    isRead: false
  });
  
  return { 
    volunteerId: volunteerData[0].volunteerId, 
    userId, 
    userName: userName || '志工',
    userEmail: userEmail || null,
    requestType: request.type
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
  const result = await db.select().from(cases).where(eq(cases.caseNumber, caseNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cases).orderBy(desc(cases.createdAt));
}

export async function updateCaseStatus(id: number, status: "submitted" | "reviewing" | "processing" | "completed" | "rejected") {
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
  return await db.select().from(caseProgress)
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
  const delivery = await db.select().from(mealDeliveries).where(eq(mealDeliveries.id, insertId)).limit(1);
  return delivery.length > 0 ? delivery[0] : null;
}

export async function getMealDeliveryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(mealDeliveries).where(eq(mealDeliveries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMealDeliveriesByVolunteer(volunteerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mealDeliveries)
    .where(eq(mealDeliveries.volunteerId, volunteerId))
    .orderBy(desc(mealDeliveries.createdAt));
}

export async function getAllMealDeliveries() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mealDeliveries).orderBy(desc(mealDeliveries.createdAt));
}

export async function updateMealDeliveryStatus(id: number, status: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  await db.update(mealDeliveries).set({ status }).where(eq(mealDeliveries.id, id));
}

export async function assignVolunteerToDelivery(deliveryId: number, volunteerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(mealDeliveries).set({ volunteerId, status: "assigned" }).where(eq(mealDeliveries.id, deliveryId));
}

export async function startDelivery(deliveryId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(mealDeliveries)
    .set({ status: "in_transit", startTime: new Date() })
    .where(eq(mealDeliveries.id, deliveryId));
}

export async function completeDelivery(deliveryId: number, photo?: string, signature?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(mealDeliveries)
    .set({ 
      status: "delivered", 
      deliveredTime: new Date(),
      photo,
      recipientSignature: signature
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
  return await db.select().from(deliveryTracking)
    .where(eq(deliveryTracking.deliveryId, deliveryId))
    .orderBy(deliveryTracking.timestamp);
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
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
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
      success: allLogs.filter(log => log.status === 'success').length,
      failed: allLogs.filter(log => log.status === 'failed').length,
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
      const duration = (delivery.deliveredTime.getTime() - delivery.startTime.getTime()) / 1000 / 60;
      totalDuration += duration;
      durationCount++;
    }
  }

  const avgDeliveryTime = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

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

  const onTimeRate = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0;

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
    volunteersData.map(async (volunteer) => {
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
