import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * 核心使用者表 - 支援認證流程
 * 擴展角色包含：admin（管理員）、volunteer（志工）、user（一般民眾）
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "volunteer", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 志工資料表 - 擴展志工相關資訊
 */
export const volunteers = mysqlTable("volunteers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  employeeId: varchar("employeeId", { length: 50 }), // 員工編號
  department: varchar("department", { length: 100 }), // 部門
  position: varchar("position", { length: 100 }), // 職位
  skills: text("skills"), // 專長（JSON格式）
  availability: text("availability"), // 可服務時段（JSON格式）
  totalHours: int("totalHours").default(0), // 累計服務時數
  status: mysqlEnum("status", ["active", "inactive", "leave"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = typeof volunteers.$inferInsert;

/**
 * 預約記錄表 - 團體與個人預約
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingNumber: varchar("bookingNumber", { length: 50 }).notNull().unique(), // 預約編號
  type: mysqlEnum("type", ["group", "individual"]).notNull(), // 團體或個人
  userId: int("userId").references(() => users.id), // 預約人（可為空，民眾可能未註冊）
  contactName: varchar("contactName", { length: 100 }).notNull(), // 聯絡人姓名
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(), // 聯絡電話
  contactEmail: varchar("contactEmail", { length: 320 }), // 聯絡信箱
  organizationName: varchar("organizationName", { length: 200 }), // 團體名稱（團體預約用）
  numberOfPeople: int("numberOfPeople").notNull(), // 人數
  visitDate: timestamp("visitDate").notNull(), // 參訪日期
  visitTime: varchar("visitTime", { length: 20 }).notNull(), // 參訪時段
  purpose: text("purpose"), // 參訪目的
  specialNeeds: text("specialNeeds"), // 特殊需求
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  assignedVolunteerId: int("assignedVolunteerId").references(() => volunteers.id), // 指派志工
  reminderSent: mysqlEnum("reminderSent", ["no", "yes"]).default("no").notNull(), // 是否已發送提醒Email
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * 排班表 - 志工排班管理
 */
export const schedules = mysqlTable("schedules", {
  id: int("id").autoincrement().primaryKey(),
  volunteerId: int("volunteerId").notNull().references(() => volunteers.id),
  shiftDate: timestamp("shiftDate").notNull(), // 班次日期
  shiftTime: varchar("shiftTime", { length: 50 }).notNull(), // 班次時段（如：09:00-12:00）
  shiftType: mysqlEnum("shiftType", ["morning", "afternoon", "fullday"]).notNull(), // 班次類型
  status: mysqlEnum("status", ["scheduled", "completed", "absent", "leave"]).default("scheduled").notNull(),
  bookingId: int("bookingId").references(() => bookings.id), // 關聯預約（如有）
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;

/**
 * 打卡記錄表 - 志工簽到簽退
 */
export const attendances = mysqlTable("attendances", {
  id: int("id").autoincrement().primaryKey(),
  volunteerId: int("volunteerId").notNull().references(() => volunteers.id),
  scheduleId: int("scheduleId").references(() => schedules.id),
  checkInTime: timestamp("checkInTime"), // 簽到時間
  checkOutTime: timestamp("checkOutTime"), // 簽退時間
  workHours: int("workHours"), // 工作時數（分鐘）
  location: varchar("location", { length: 200 }), // 打卡地點
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attendance = typeof attendances.$inferSelect;
export type InsertAttendance = typeof attendances.$inferInsert;

/**
 * 換班/請假申請表
 */
export const leaveRequests = mysqlTable("leaveRequests", {
  id: int("id").autoincrement().primaryKey(),
  volunteerId: int("volunteerId").notNull().references(() => volunteers.id),
  scheduleId: int("scheduleId").notNull().references(() => schedules.id),
  type: mysqlEnum("type", ["leave", "swap"]).notNull(), // 請假或換班
  targetVolunteerId: int("targetVolunteerId").references(() => volunteers.id), // 換班對象（換班時使用）
  reason: text("reason").notNull(), // 原因
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id), // 審核人
  reviewedAt: timestamp("reviewedAt"), // 審核時間
  reviewNotes: text("reviewNotes"), // 審核備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

/**
 * 案件表 - 消防局相關申請案件
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 50 }).notNull().unique(), // 案件編號
  userId: int("userId").references(() => users.id), // 申請人
  applicantName: varchar("applicantName", { length: 100 }).notNull(), // 申請人姓名
  applicantPhone: varchar("applicantPhone", { length: 20 }).notNull(), // 申請人電話
  applicantEmail: varchar("applicantEmail", { length: 320 }), // 申請人信箱
  caseType: varchar("caseType", { length: 100 }).notNull(), // 案件類型
  title: varchar("title", { length: 200 }).notNull(), // 案件標題
  description: text("description").notNull(), // 案件描述
  attachments: text("attachments"), // 附件（JSON格式存儲URL列表）
  status: mysqlEnum("status", ["submitted", "reviewing", "processing", "completed", "rejected"]).default("submitted").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assignedTo: int("assignedTo").references(() => users.id), // 承辦人
  currentStep: varchar("currentStep", { length: 100 }), // 當前進度
  estimatedCompletionDate: timestamp("estimatedCompletionDate"), // 預計完成日期
  completedAt: timestamp("completedAt"), // 完成時間
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * 案件進度記錄表
 */
export const caseProgress = mysqlTable("caseProgress", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull().references(() => cases.id),
  step: varchar("step", { length: 100 }).notNull(), // 進度步驟
  description: text("description").notNull(), // 進度描述
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).notNull(),
  updatedBy: int("updatedBy").references(() => users.id), // 更新人
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaseProgress = typeof caseProgress.$inferSelect;
export type InsertCaseProgress = typeof caseProgress.$inferInsert;

/**
 * 送餐任務表
 */
export const mealDeliveries = mysqlTable("mealDeliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryNumber: varchar("deliveryNumber", { length: 50 }).notNull().unique(), // 送餐編號
  volunteerId: int("volunteerId").references(() => volunteers.id), // 送餐志工
  recipientName: varchar("recipientName", { length: 100 }).notNull(), // 收餐人姓名
  recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(), // 收餐人電話
  deliveryAddress: text("deliveryAddress").notNull(), // 送餐地址
  deliveryDate: timestamp("deliveryDate").notNull(), // 送餐日期
  deliveryTime: varchar("deliveryTime", { length: 20 }).notNull(), // 送餐時段
  mealType: varchar("mealType", { length: 100 }), // 餐點類型
  specialInstructions: text("specialInstructions"), // 特殊說明
  status: mysqlEnum("status", ["pending", "assigned", "in_transit", "delivered", "cancelled"]).default("pending").notNull(),
  qrCode: varchar("qrCode", { length: 200 }), // QR Code 資料
  verificationCode: varchar("verificationCode", { length: 20 }), // 驗證碼
  startTime: timestamp("startTime"), // 開始送餐時間
  deliveredTime: timestamp("deliveredTime"), // 送達時間
  recipientSignature: text("recipientSignature"), // 收餐人簽名（Base64）
  photo: varchar("photo", { length: 500 }), // 送達照片URL
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MealDelivery = typeof mealDeliveries.$inferSelect;
export type InsertMealDelivery = typeof mealDeliveries.$inferInsert;

/**
 * 送餐路徑追蹤表
 */
export const deliveryTracking = mysqlTable("deliveryTracking", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull().references(() => mealDeliveries.id),
  latitude: varchar("latitude", { length: 50 }).notNull(), // 緯度
  longitude: varchar("longitude", { length: 50 }).notNull(), // 經度
  timestamp: timestamp("timestamp").notNull(), // 記錄時間
  speed: varchar("speed", { length: 20 }), // 速度
  accuracy: varchar("accuracy", { length: 20 }), // 精確度
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliveryTracking = typeof deliveryTracking.$inferSelect;
export type InsertDeliveryTracking = typeof deliveryTracking.$inferInsert;

/**
 * 系統通知表
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id), // 接收通知的使用者
  type: varchar("type", { length: 50 }).notNull(), // 通知類型
  title: varchar("title", { length: 200 }).notNull(), // 通知標題
  message: text("message").notNull(), // 通知內容
  relatedId: int("relatedId"), // 相關記錄ID（如預約ID、案件ID等）
  relatedType: varchar("relatedType", { length: 50 }), // 相關記錄類型
  isRead: boolean("isRead").default(false).notNull(), // 是否已讀
  readAt: timestamp("readAt"), // 讀取時間
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Email發送歷史記錄表
 * 記錄所有發送的Email（包含測試Email）
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 100 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  emailType: varchar("emailType", { length: 100 }).notNull(), // 例如：booking_confirmation, booking_reminder, test_confirmation
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  // 關聯資訊（可選）
  bookingId: int("bookingId"),
  isTest: boolean("isTest").default(false).notNull(), // 是否為測試Email
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
