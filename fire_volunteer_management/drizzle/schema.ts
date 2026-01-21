import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "volunteer", "admin"])
    .default("user")
    .notNull(),
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
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  employeeId: varchar("employeeId", { length: 50 }), // 員工編號
  department: varchar("department", { length: 100 }), // 部門
  position: varchar("position", { length: 100 }), // 職位
  skills: text("skills"), // 專長（JSON格式）
  availability: text("availability"), // 可服務時段（JSON格式）
  category: mysqlEnum("category", ["導覽館志工", "送餐志工"])
    .default("導覽館志工")
    .notNull(), // 志工分類
  lineUserId: varchar("lineUserId", { length: 100 }), // LINE User ID（用於接收LINE通知）
  totalHours: int("totalHours").default(0), // 累計服務時數
  status: mysqlEnum("status", ["active", "inactive", "leave"])
    .default("active")
    .notNull(),
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
  numberOfPeople: int("numberOfPeople").notNull(), // 總人數（成人+兒童）
  adultCount: int("adultCount").notNull(), // 成人人數
  childCount: int("childCount").notNull(), // 兒童人數
  visitDate: timestamp("visitDate").notNull(), // 參訪日期
  visitTime: varchar("visitTime", { length: 20 }).notNull(), // 參訪時段
  arrivalTime: varchar("arrivalTime", { length: 20 }), // 抵達時間（團體專用）
  notes: text("notes"), // 備註（合併原參訪目的和特殊需求）
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ])
    .default("pending")
    .notNull(),
  assignedVolunteerId: int("assignedVolunteerId").references(
    () => volunteers.id
  ), // 指派志工
  reminderSent: mysqlEnum("reminderSent", ["no", "yes"])
    .default("no")
    .notNull(), // 是否已發送提醒Email
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
  volunteerId: int("volunteerId")
    .notNull()
    .references(() => volunteers.id),
  shiftDate: timestamp("shiftDate").notNull(), // 班次日期
  shiftTime: varchar("shiftTime", { length: 50 }).notNull(), // 班次時段（如：09:00-12:00）
  shiftType: mysqlEnum("shiftType", [
    "morning",
    "afternoon",
    "fullday",
  ]).notNull(), // 班次類型
  status: mysqlEnum("status", ["scheduled", "completed", "absent", "leave"])
    .default("scheduled")
    .notNull(),
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
  volunteerId: int("volunteerId")
    .notNull()
    .references(() => volunteers.id),
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
  volunteerId: int("volunteerId")
    .notNull()
    .references(() => volunteers.id),
  scheduleId: int("scheduleId")
    .notNull()
    .references(() => schedules.id),
  type: mysqlEnum("type", ["leave", "swap"]).notNull(), // 請假或換班
  targetVolunteerId: int("targetVolunteerId").references(() => volunteers.id), // 換班對象（換班時使用）
  reason: text("reason").notNull(), // 原因
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
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
  status: mysqlEnum("status", [
    "submitted",
    "reviewing",
    "processing",
    "completed",
    "rejected",
  ])
    .default("submitted")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
    .default("medium")
    .notNull(),
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
  caseId: int("caseId")
    .notNull()
    .references(() => cases.id),
  step: varchar("step", { length: 100 }).notNull(), // 進度步驟
  description: text("description").notNull(), // 進度描述
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
  ]).notNull(),
  updatedBy: int("updatedBy").references(() => users.id), // 更新人
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaseProgress = typeof caseProgress.$inferSelect;
export type InsertCaseProgress = typeof caseProgress.$inferInsert;

/**
 * 收餐人資料表
 * 用於管理長期送餐服務的收餐人資訊和LINE綁定狀態
 */
export const recipients = mysqlTable("recipients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  address: text("address"),

  // LINE Messaging API 相關
  lineUserId: varchar("lineUserId", { length: 255 }),
  lineDisplayName: varchar("lineDisplayName", { length: 100 }),
  lineAuthorizedAt: timestamp("lineAuthorizedAt"),

  // 通知偏好
  preferredNotificationMethod: mysqlEnum("preferredNotificationMethod", [
    "line",
    "sms",
    "both",
  ]).default("sms"),

  // 備註
  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recipient = typeof recipients.$inferSelect;
export type InsertRecipient = typeof recipients.$inferInsert;

/**
 * 送餐任務表
 */
export const mealDeliveries = mysqlTable("mealDeliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryNumber: varchar("deliveryNumber", { length: 50 }).notNull().unique(), // 送餐編號

  // 關聯到收餐人表
  recipientId: int("recipientId").references(() => recipients.id),

  // 冗餘欄位（方便快速查詢，避免每次都要join）
  recipientName: varchar("recipientName", { length: 100 }).notNull(), // 收餐人姓名
  recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(), // 收餐人電話
  deliveryAddress: text("deliveryAddress").notNull(), // 送餐地址

  volunteerId: int("volunteerId").references(() => volunteers.id), // 送餐志工
  deliveryDate: timestamp("deliveryDate").notNull(), // 送餐日期
  deliveryTime: varchar("deliveryTime", { length: 20 }).notNull(), // 送餐時段
  mealType: varchar("mealType", { length: 100 }), // 餐點類型
  specialInstructions: text("specialInstructions"), // 特殊說明
  status: mysqlEnum("status", [
    "pending",
    "assigned",
    "in_transit",
    "delivered",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
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
  deliveryId: int("deliveryId")
    .notNull()
    .references(() => mealDeliveries.id),
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
  userId: int("userId")
    .notNull()
    .references(() => users.id), // 接收通知的使用者
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

/**
 * 一般民眾預約表（1-19人）
 */
export const individualBookings = mysqlTable("individualBookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingNumber: varchar("bookingNumber", { length: 50 }).notNull().unique(),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  numberOfPeople: int("numberOfPeople").notNull(), // 總人數
  adultCount: int("adultCount").notNull(), // 成人人數
  childCount: int("childCount").notNull(), // 兒童人數
  visitDate: timestamp("visitDate").notNull(),
  visitTime: varchar("visitTime", { length: 50 }).notNull(), // 例如：09:00-10:00
  purpose: text("purpose"), // 參訪目的
  specialNeeds: text("specialNeeds"), // 特殊需求
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IndividualBooking = typeof individualBookings.$inferSelect;
export type InsertIndividualBooking = typeof individualBookings.$inferInsert;

/**
 * 團體預約表（20-50人）
 */
export const groupBookings = mysqlTable("groupBookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingNumber: varchar("bookingNumber", { length: 50 }).notNull().unique(),
  organizationName: varchar("organizationName", { length: 200 }).notNull(),
  organizationType: varchar("organizationType", { length: 100 }),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  numberOfPeople: int("numberOfPeople").notNull(), // 總人數
  adultCount: int("adultCount").notNull(), // 成人人數
  childCount: int("childCount").notNull(), // 兒童人數
  visitDate: timestamp("visitDate").notNull(),
  visitTime: varchar("visitTime", { length: 50 }).notNull(),
  arrivalTime: varchar("arrivalTime", { length: 20 }), // 抵達時間（團體專用）
  notes: text("notes"), // 備註
  hasDisabilities: boolean("hasDisabilities").default(false),
  disabilityDetails: text("disabilityDetails"),
  status: mysqlEnum("status", [
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupBooking = typeof groupBookings.$inferSelect;
export type InsertGroupBooking = typeof groupBookings.$inferInsert;

/**
 * 送餐任務表（批次送餐）
 * 一個任務包含多個送餐點，由一位義工負責完成
 */
export const deliveryTasks = mysqlTable("deliveryTasks", {
  id: int("id").autoincrement().primaryKey(),
  taskNumber: varchar("taskNumber", { length: 50 }).notNull().unique(), // 任務編號
  taskDate: timestamp("taskDate").notNull(), // 送餐日期
  volunteerId: int("volunteerId").references(() => volunteers.id), // 指派的義工
  volunteerName: varchar("volunteerName", { length: 100 }), // 義工姓名（冗餘欄位）
  status: mysqlEnum("status", [
    "pending",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  totalPoints: int("totalPoints").default(0).notNull(), // 總送餐點數
  completedPoints: int("completedPoints").default(0).notNull(), // 已完成數
  startTime: timestamp("startTime"), // 開始送餐時間
  completedTime: timestamp("completedTime"), // 完成時間
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliveryTask = typeof deliveryTasks.$inferSelect;
export type InsertDeliveryTask = typeof deliveryTasks.$inferInsert;

/**
 * 送餐點表
 * 每個送餐點對應一個收餐人和地址
 */
export const deliveryPoints = mysqlTable("deliveryPoints", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId")
    .notNull()
    .references(() => deliveryTasks.id), // 關聯到送餐任務
  sequence: int("sequence").notNull(), // 順序（用於路線規劃）
  recipientName: varchar("recipientName", { length: 100 }).notNull(), // 收餐人姓名
  recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(), // 收餐人電話
  deliveryAddress: text("deliveryAddress").notNull(), // 送餐地址
  latitude: varchar("latitude", { length: 50 }), // 緯度（用於地圖導航）
  longitude: varchar("longitude", { length: 50 }), // 經度（用於地圖導航）
  specialInstructions: text("specialInstructions"), // 特殊需求/注意事項
  status: mysqlEnum("status", ["pending", "completed"])
    .default("pending")
    .notNull(),
  completedAt: timestamp("completedAt"), // 完成時間
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliveryPoint = typeof deliveryPoints.$inferSelect;
export type InsertDeliveryPoint = typeof deliveryPoints.$inferInsert;

/**
 * 最新消息表 - 防災宣導、活動公告等
 */
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(), // 標題
  content: text("content").notNull(), // 內容
  summary: varchar("summary", { length: 500 }), // 摘要
  coverImage: varchar("coverImage", { length: 500 }), // 封面圖片URL
  category: mysqlEnum("category", ["防災宣導", "活動公告", "新聞稿", "其他"])
    .default("其他")
    .notNull(), // 分類
  isPublished: boolean("isPublished").default(false).notNull(), // 是否發布
  publishedAt: timestamp("publishedAt"), // 發布時間
  viewCount: int("viewCount").default(0), // 瀏覽次數
  authorId: int("authorId").references(() => users.id), // 作者
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * 服務花絮照片牆表
 */
export const gallery = mysqlTable("gallery", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(), // 照片標題
  description: text("description"), // 照片描述
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(), // 照片URL
  category: mysqlEnum("category", [
    "活動花絮",
    "設施環境",
    "教育訓練",
    "志工服務",
    "其他",
  ])
    .default("其他")
    .notNull(), // 分類
  isPublished: boolean("isPublished").default(true).notNull(), // 是否發布
  displayOrder: int("displayOrder").default(0), // 顯示順序
  uploadedBy: int("uploadedBy").references(() => users.id), // 上傳者
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gallery = typeof gallery.$inferSelect;
export type InsertGallery = typeof gallery.$inferInsert;

/**
 * 首頁內容管理表
 * 儲存首頁的可編輯內容，包括文字、輪播照片、設施介紹等
 */
export const homeContent = mysqlTable("homeContent", {
  id: int("id").autoincrement().primaryKey(),
  // 關於教育館的介紹文字
  aboutTitle: varchar("aboutTitle", { length: 200 })
    .default("關於臺東災害警覺教育館")
    .notNull(),
  aboutParagraph1: text("aboutParagraph1").notNull(),
  aboutParagraph2: text("aboutParagraph2").notNull(),
  aboutParagraph3: text("aboutParagraph3").notNull(),

  // 首頁主視覺輪播照片（4張）
  heroImage1: varchar("heroImage1", { length: 500 }),
  heroImage1Title: varchar("heroImage1Title", { length: 200 }),
  heroImage1Desc: text("heroImage1Desc"),

  heroImage2: varchar("heroImage2", { length: 500 }),
  heroImage2Title: varchar("heroImage2Title", { length: 200 }),
  heroImage2Desc: text("heroImage2Desc"),

  heroImage3: varchar("heroImage3", { length: 500 }),
  heroImage3Title: varchar("heroImage3Title", { length: 200 }),
  heroImage3Desc: text("heroImage3Desc"),

  heroImage4: varchar("heroImage4", { length: 500 }),
  heroImage4Title: varchar("heroImage4Title", { length: 200 }),
  heroImage4Desc: text("heroImage4Desc"),

  updatedBy: int("updatedBy").references(() => users.id), // 更新者
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomeContent = typeof homeContent.$inferSelect;
export type InsertHomeContent = typeof homeContent.$inferInsert;
