import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { users } from "../drizzle/schema";
import {
  getEmailLogs,
  getEmailStats,
  getVolunteerPerformanceStats,
  getAllVolunteersPerformance,
} from "./db";
import {
  sendPublicBookingConfirmationEmail,
  sendGroupBookingConfirmationEmail,
} from "./emailService";
import { triggerBookingReminders } from "./scheduledTasks";
import {
  optimizeDeliveryRoute,
  formatDistance,
  formatDuration,
} from "./routeOptimization";
import {
  generateVerificationCode,
  sendDeliveryNotificationSMS,
} from "./smsService";
import QRCode from "qrcode";
import * as recipientsDb from "./recipientsDb";
import {
  getLineUserProfile,
  sendLineMessage,
  createDeliveryNotificationMessage,
} from "./_core/lineMessaging";

// 管理員專用 procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

// 志工專用 procedure（志工和管理員都可使用）
const volunteerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "volunteer" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要志工或管理員權限" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => {
      // 優先使用 OAuth session 的使用者
      if (opts.ctx.user) {
        return opts.ctx.user;
      }

      // 如果沒有 OAuth session，嘗試從 cookie 讀取測試登入的使用者資料
      const sessionCookie = opts.ctx.req.cookies[COOKIE_NAME];
      if (sessionCookie) {
        try {
          const testUser = JSON.parse(sessionCookie);
          // 驗證資料結構
          if (testUser && testUser.id && testUser.email && testUser.role) {
            return testUser;
          }
        } catch (error) {
          console.error('[auth.me] Failed to parse session cookie:', error);
        }
      }

      // 如果都沒有，返回 null（未登入）
      return null;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // 環境變數檢查 API（僅供調試使用）
    checkEnv: publicProcedure.query(() => {
      return {
        ENABLE_TEST_LOGIN: process.env.ENABLE_TEST_LOGIN || "undefined",
        NODE_ENV: process.env.NODE_ENV || "undefined",
      };
    }),
    
    // 測試登入 API（僅供資安掃描使用）
    testLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 檢查是否啟用測試登入
        const envValue = process.env.ENABLE_TEST_LOGIN;
        console.log("[testLogin] ENABLE_TEST_LOGIN raw value:", JSON.stringify(envValue));
        console.log("[testLogin] Type:", typeof envValue);
        console.log("[testLogin] Trimmed value:", envValue?.trim());
        
        const enableTestLogin = envValue?.trim().toLowerCase() === "true";
        console.log("[testLogin] enableTestLogin result:", enableTestLogin);
        
        if (!enableTestLogin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `測試登入功能未啟用 (env=${JSON.stringify(envValue)})`,
          });
        }

        // 測試帳號列表
        const testAccounts = [
          {
            id: 9999,  // 測試帳號使用高數字 ID 以避免與真實使用者衝突
            email: "jacky.hsieh@insight.ntu.edu.tw",
            password: "SecurityTest2024!",
            role: "admin" as const,
            name: "Jacky Hsieh",
          },
          {
            id: 9998,
            email: "chelsea.juan@udngroup.com.tw",
            password: "SecurityTest2024!",
            role: "admin" as const,
            name: "Chelsea Juan",
          },
          {
            id: 9997,
            email: "vol3@taitung.gov.tw",
            password: "Volunteer2024!",
            role: "volunteer" as const,
            name: "志工三號",
          },
        ];

        // 驗證帳號密碼
        const account = testAccounts.find(
          acc => acc.email === input.email && acc.password === input.password
        );

        if (!account) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "帳號或密碼錯誤",
          });
        }

        // 確保測試使用者存在於資料庫中
        try {
          const existingUser = await db.getUserById(account.id);
          if (!existingUser) {
            // 如果使用者不存在，建立新使用者
            const dbInstance = await db.getDb();
            if (dbInstance) {
              await dbInstance.insert(users).values({
                id: account.id,
                openId: `test_${account.id}`, // 使用 test_ 前綴作為 openId
                email: account.email,
                name: account.name,
                role: account.role as "admin" | "volunteer",
              });
              console.log(`[testLogin] Created test user with ID ${account.id}`);
            }
          } else {
            console.log(`[testLogin] Test user ${account.id} already exists`);
          }
        } catch (error) {
          console.error("[testLogin] Failed to ensure user exists:", error);
          // 繼續執行，因為 session 仍然可以使用
        }

        // 建立測試用的 session
        const testUser = {
          id: account.id, // 使用整數 ID
          email: account.email,
          name: account.name,
          role: account.role,
        };

        // 設定 session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const sessionData = JSON.stringify(testUser);
        ctx.res.cookie(COOKIE_NAME, sessionData, cookieOptions);

        return { success: true } as const;
      }),
  }),

  // ============ 使用者管理 ============
  users: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    updateRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "volunteer", "admin"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // ============ 志工管理 ============
  volunteers: router({
    importFromExcel: adminProcedure
      .input(
        z.object({
          volunteers: z.array(
            z.object({
              userId: z.number(),
              employeeId: z.string().optional(),
              department: z.string().optional(),
              position: z.string().optional(),
              skills: z.string().optional(),
              availability: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = {
          success: 0,
          failed: 0,
          errors: [] as string[],
          successDetails: [] as Array<{
            userId: number;
            employeeId?: string;
            name?: string;
            email?: string;
          }>,
        };

        for (const volunteerData of input.volunteers) {
          try {
            await db.createVolunteer(volunteerData);
            await db.updateUserRole(volunteerData.userId, "volunteer");

            // 取得使用者資訊以顯示在結果中
            const user = await db.getUserById(volunteerData.userId);
            results.successDetails.push({
              userId: volunteerData.userId,
              employeeId: volunteerData.employeeId,
              name: user?.name || undefined,
              email: user?.email || undefined,
            });

            results.success++;
          } catch (error) {
            results.failed++;
            const employeeId = volunteerData.employeeId || "未知";
            results.errors.push(
              `員工編號 ${employeeId}: ${error instanceof Error ? error.message : "未知錯誤"}`
            );
          }
        }

        return results;
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          employeeId: z.string().optional(),
          department: z.string().optional(),
          position: z.string().optional(),
          category: z.enum(["導覽館志工", "送餐志工"]).default("導覽館志工"),
          skills: z.string().optional(),
          availability: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { name, email, phone, ...volunteerData } = input;

        // 自動建立使用者帳號
        const openId = `volunteer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const userData = {
          openId,
          name,
          email: email || null,
          loginMethod: "manual",
          role: "user" as const,
        };

        await db.upsertUser(userData);
        const user = await db.getUserByOpenId(openId);

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "建立使用者失敗",
          });
        }

        // 建立志工記錄
        await db.createVolunteer({
          userId: user.id,
          ...volunteerData,
        });

        return { success: true, userId: user.id };
      }),

    getAll: adminProcedure.query(async () => {
      return await db.getAllVolunteers();
    }),

    getMyProfile: volunteerProcedure.query(async ({ ctx }) => {
      return await db.getVolunteerByUserId(ctx.user.id);
    }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          userId: z.number().optional(),
          employeeId: z.string().optional(),
          department: z.string().optional(),
          position: z.string().optional(),
          skills: z.string().optional(),
          availability: z.string().optional(),
          status: z.enum(["active", "inactive", "leave"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVolunteer(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(
        z.object({
          id: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.deleteVolunteer(input.id);
        return { success: true };
      }),

    // 查詢單一志工績效統計
    getPerformance: adminProcedure
      .input(
        z.object({
          volunteerId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await getVolunteerPerformanceStats(input.volunteerId);
      }),

    // 查詢所有志工績效統計
    getAllPerformance: adminProcedure.query(async () => {
      return await getAllVolunteersPerformance();
    }),
  }),

  // ============ 排程任務管理 ============
  scheduledTasks: router({
    // 手動觸發發送預約提醒Email（管理員專用）
    triggerBookingReminders: adminProcedure.mutation(async () => {
      const results = await triggerBookingReminders();
      return results;
    }),
  }),

  // ============ Email歷史記錄 ============
  emailLogs: router({
    // 查詢Email發送歷史（管理員專用）
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().optional(),
          offset: z.number().optional(),
          emailType: z.string().optional(),
          isTest: z.boolean().optional(),
        })
      )
      .query(async ({ input }) => {
        const logs = await getEmailLogs(input);
        return logs;
      }),

    // 統計Email發送狀況（管理員專用）
    stats: adminProcedure.query(async () => {
      const stats = await getEmailStats();
      return stats;
    }),
  }),

  // ============ Email測試 ============
  emailTest: router({
    // 測試預約確認Email（管理員專用）
    testBookingConfirmation: adminProcedure
      .input(
        z.object({
          recipientEmail: z.string().email(),
          recipientName: z.string(),
          bookingType: z.enum(["public", "group"]),
          organizationName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const testBookingNumber = `TEST${Date.now()}`;
        const testVisitDate = new Date();
        testVisitDate.setDate(testVisitDate.getDate() + 7);
        const visitDate = testVisitDate.toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const testVisitTime = "10:00-12:00";
        const testVisitorCount = input.bookingType === "group" ? 30 : 5;

        let success = false;
        if (input.bookingType === "group" && input.organizationName) {
          success = await sendGroupBookingConfirmationEmail(
            input.recipientEmail,
            input.organizationName,
            input.recipientName,
            testBookingNumber,
            visitDate,
            testVisitTime,
            testVisitorCount
          );
        } else {
          success = await sendPublicBookingConfirmationEmail(
            input.recipientEmail,
            input.recipientName,
            testBookingNumber,
            visitDate,
            testVisitTime,
            testVisitorCount
          );
        }

        return {
          success,
          bookingNumber: testBookingNumber,
          message: success
            ? "Email發送成功！請檢查收件匣（可能在垃圾郵件中）"
            : "Email發送失敗，請檢查Email設定",
        };
      }),

    // 測試預約提醒Email（管理員專用）
    testBookingReminder: adminProcedure
      .input(
        z.object({
          recipientEmail: z.string().email(),
          recipientName: z.string(),
          bookingType: z.enum(["public", "group"]),
          organizationName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const testBookingNumber = `TEST${Date.now()}`;
        const testVisitDate = new Date();
        testVisitDate.setDate(testVisitDate.getDate() + 3);
        const visitDate = testVisitDate.toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const testVisitTime = "14:00-16:00";
        const testVisitorCount = input.bookingType === "group" ? 25 : 4;

        let success = false;
        if (input.bookingType === "group" && input.organizationName) {
          const { sendGroupBookingReminderEmail } =
            await import("./emailService");
          success = await sendGroupBookingReminderEmail(
            input.recipientEmail,
            input.organizationName,
            input.recipientName,
            testBookingNumber,
            visitDate,
            testVisitTime,
            testVisitorCount
          );
        } else {
          const { sendPublicBookingReminderEmail } =
            await import("./emailService");
          success = await sendPublicBookingReminderEmail(
            input.recipientEmail,
            input.recipientName,
            testBookingNumber,
            visitDate,
            testVisitTime,
            testVisitorCount
          );
        }

        return {
          success,
          bookingNumber: testBookingNumber,
          message: success
            ? "Email發送成功！請檢查收件匣（可能在垃圾郵件中）"
            : "Email發送失敗，請檢查Email設定",
        };
      }),
  }),

  // ============ SMS測試 ============
  smsTest: router({
    // 測試送餐SMS通知（管理員專用）
    testDeliveryNotification: adminProcedure
      .input(
        z.object({
          recipientPhone: z.string(),
          recipientName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const testDeliveryNumber = `TEST${Date.now()}`;
        const testVerificationCode = generateVerificationCode();
        const testDeliveryDate = new Date();
        testDeliveryDate.setDate(testDeliveryDate.getDate() + 1);
        const testDeliveryTime = "12:00-13:00";

        // 發送SMS（模擬模式）
        const result = await sendDeliveryNotificationSMS({
          recipientPhone: input.recipientPhone,
          recipientName: input.recipientName,
          verificationCode: testVerificationCode,
          deliveryId: 999999, // 測試用ID
          deliveryDate: testDeliveryDate,
          deliveryTime: testDeliveryTime,
        });

        // 返回SMS內容供預覽
        const smsContent = `
【台東防災館送餐服務】
親愛的 ${input.recipientName}，您好！

您的送餐服務已安排：
送達日期：${testDeliveryDate.toLocaleDateString("zh-TW")}
送達時段：${testDeliveryTime}

驗證序號：${testVerificationCode}

請保管好此序號，志工送達時需要此序號完成簽收。

確認連結：http://localhost:3000/confirm-receipt/999999

如有疑問，請聯繫我們。
        `.trim();

        return {
          success: result.success,
          verificationCode: testVerificationCode,
          deliveryNumber: testDeliveryNumber,
          smsContent,
          message: result.success
            ? "SMS發送成功！（模擬模式，請查看console輸出）"
            : "SMS發送失敗，請檢查SMS設定",
        };
      }),
  }),

  // ============ 預約管理 ============
  bookings: router({
    create: publicProcedure
      .input(
        z.object({
          type: z.enum(["group", "individual"]),
          contactName: z.string(),
          contactPhone: z.string(),
          contactEmail: z.string().email("請輸入有效的Email地址"),
          organizationName: z.string().optional(),
          numberOfPeople: z.number(),
          adultCount: z.number(),
          childCount: z.number(),
          visitDate: z.date(),
          visitTime: z.string(),
          arrivalTime: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const bookingNumber = `BK${Date.now()}`;
        await db.createBooking({
          ...input,
          bookingNumber,
          userId: ctx.user?.id,
          status: "pending",
        });

        // 發送Email通知（如果有提供Email）
        if (input.contactEmail) {
          const visitDate = input.visitDate.toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          if (input.type === "group" && input.organizationName) {
            // 團體預約
            await sendGroupBookingConfirmationEmail(
              input.contactEmail,
              input.organizationName,
              input.contactName,
              bookingNumber,
              visitDate,
              input.visitTime,
              input.numberOfPeople
            );
          } else {
            // 民眾預約
            await sendPublicBookingConfirmationEmail(
              input.contactEmail,
              input.contactName,
              bookingNumber,
              visitDate,
              input.visitTime,
              input.numberOfPeople
            );
          }
        }

        return { success: true, bookingNumber };
      }),

    // 志工和管理員都可以查看預約列表，但只有管理員可以編輯/刪除
    getAll: protectedProcedure.query(async () => {
      return await db.getAllBookings();
    }),

    getByNumber: publicProcedure
      .input(z.object({ bookingNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getBookingByNumber(input.bookingNumber);
      }),

    getByPhone: publicProcedure
      .input(z.object({ contactPhone: z.string() }))
      .query(async ({ input }) => {
        return await db.getBookingByPhone(input.contactPhone);
      }),

    getByDateRange: adminProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await db.getBookingsByDateRange(input.startDate, input.endDate);
      }),

    getByMonth: publicProcedure
      .input(
        z.object({
          year: z.number(),
          month: z.number().min(1).max(12),
        })
      )
      .query(async ({ input }) => {
        // 計算該月份的開始和結束日期
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
        return await db.getBookingsByDateRange(startDate, endDate);
      }),

    // 只查詢個人預約
    getIndividualByMonth: publicProcedure
      .input(
        z.object({
          year: z.number(),
          month: z.number().min(1).max(12),
        })
      )
      .query(async ({ input }) => {
        // 使用 UTC 時間建立日期範圍，避免時區轉換問題
        // 計算該月份的第一天
        const firstDay = new Date(Date.UTC(input.year, input.month - 1, 1));
        const startDate = new Date(
          Date.UTC(
            firstDay.getUTCFullYear(),
            firstDay.getUTCMonth(),
            firstDay.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );

        // 計算該月份的最後一天
        const lastDay = new Date(Date.UTC(input.year, input.month, 0));
        const endDate = new Date(
          Date.UTC(
            lastDay.getUTCFullYear(),
            lastDay.getUTCMonth(),
            lastDay.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );

        return await db.getIndividualBookingsByDateRange(startDate, endDate);
      }),

    // 只查詢團體預約
    getGroupByMonth: publicProcedure
      .input(
        z.object({
          year: z.number(),
          month: z.number().min(1).max(12),
        })
      )
      .query(async ({ input }) => {
        // 使用 UTC 時間建立日期範圍，避免時區轉換問題
        // 計算該月份的第一天
        const firstDay = new Date(Date.UTC(input.year, input.month - 1, 1));
        const startDate = new Date(
          Date.UTC(
            firstDay.getUTCFullYear(),
            firstDay.getUTCMonth(),
            firstDay.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );

        // 計算該月份的最後一天
        const lastDay = new Date(Date.UTC(input.year, input.month, 0));
        const endDate = new Date(
          Date.UTC(
            lastDay.getUTCFullYear(),
            lastDay.getUTCMonth(),
            lastDay.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );

        return await db.getGroupBookingsByDateRange(startDate, endDate);
      }),

    getAvailableTimeSlots: publicProcedure
      .input(
        z.object({
          date: z.date(),
          type: z
            .enum(["individual", "group"])
            .optional()
            .default("individual"),
        })
      )
      .query(async ({ input }) => {
        // 所有可用時段
        const allTimeSlots = [
          "09:00-10:00",
          "10:00-11:00",
          "11:00-12:00",
          "14:00-15:00",
          "15:00-16:00",
          "16:00-17:00",
        ];

        // 查詢該日的預約（根據類型查詢對應的表）
        // 使用 UTC 時間建立日期範圍，避免時區轉換問題
        // 必須使用 getUTCFullYear/getUTCMonth/getUTCDate 來取得 UTC 時間的年月日
        const inputDate = new Date(input.date);
        const startOfDay = new Date(
          Date.UTC(
            inputDate.getUTCFullYear(),
            inputDate.getUTCMonth(),
            inputDate.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );
        const endOfDay = new Date(
          Date.UTC(
            inputDate.getUTCFullYear(),
            inputDate.getUTCMonth(),
            inputDate.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );

        // 根據類型查詢對應的表
        let bookings;
        if (input.type === "individual") {
          bookings = await db.getIndividualBookingsByDateRange(
            startOfDay,
            endOfDay
          );
        } else {
          bookings = await db.getGroupBookingsByDateRange(startOfDay, endOfDay);
        }

        // 篩選出非取消狀態的預約
        const activeBookings = bookings.filter(b => b.status !== "cancelled");

        // 取得已被預約的時段（使用Set去除重複）
        const bookedTimeSlotsSet = new Set(
          activeBookings.map(b => b.visitTime)
        );
        const bookedTimeSlots = Array.from(bookedTimeSlotsSet);

        // 計算可用時段
        const availableTimeSlots = allTimeSlots.filter(
          slot => !bookedTimeSlots.includes(slot)
        );

        return {
          date: input.date,
          allTimeSlots,
          bookedTimeSlots,
          availableTimeSlots,
          isFull: availableTimeSlots.length === 0,
        };
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
          type: z.enum(["individual", "group"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateBookingStatus(input.id, input.status, input.type);
        return { success: true };
      }),

    // 編輯預約資料
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          type: z.enum(["individual", "group"]),
          contactName: z.string().optional(),
          contactPhone: z.string().optional(),
          contactEmail: z.string().email().optional(),
          numberOfPeople: z.number().optional(),
          visitDate: z.date().optional(),
          visitTime: z.string().optional(),
          purpose: z.string().optional(),
          specialNeeds: z.string().optional(),
          status: z
            .enum(["pending", "confirmed", "cancelled", "completed"])
            .optional(),
          organizationName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, type, ...data } = input;
        await db.updateBooking(id, type, data);
        return { success: true };
      }),

    // 刪除預約
    delete: adminProcedure
      .input(
        z.object({
          id: z.number(),
          type: z.enum(["individual", "group"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.deleteBooking(input.id, input.type);
        return { success: true };
      }),

    assignVolunteer: adminProcedure
      .input(
        z.object({
          bookingId: z.number(),
          volunteerId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.assignVolunteerToBooking(input.bookingId, input.volunteerId);
        return { success: true };
      }),

    cancel: publicProcedure
      .input(
        z.object({
          bookingNumber: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // 查詢預約是否存在
        const booking = await db.getBookingByNumber(input.bookingNumber);
        if (!booking) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到該預約" });
        }

        // 檢查預約狀態
        if (booking.status === "cancelled") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "該預約已經取消",
          });
        }
        if (booking.status === "completed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "已完成的預約無法取消",
          });
        }

        // 更新狀態為取消（傳遞預約類型以更新正確的表）
        const bookingType = (booking as any).type as
          | "individual"
          | "group"
          | undefined;
        await db.updateBookingStatus(booking.id, "cancelled", bookingType);

        // 發送取消通知Email（如果有提供Email）
        if (booking.contactEmail) {
          const { sendBookingCancellationEmail } =
            await import("./emailService");
          const visitDate = new Date(booking.visitDate).toLocaleDateString(
            "zh-TW",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          );
          await sendBookingCancellationEmail(
            booking.contactEmail,
            booking.contactName,
            input.bookingNumber,
            visitDate,
            booking.visitTime
          );
        }

        return { success: true };
      }),
  }),

  // ============ 排班管理 ============
  schedules: router({
    create: adminProcedure
      .input(
        z.object({
          volunteerId: z.number(),
          shiftDate: z.date(),
          shiftTime: z.string(),
          shiftType: z.enum(["morning", "afternoon", "fullday"]),
          bookingId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.createSchedule({ ...input, status: "scheduled" });
        return { success: true };
      }),

    getByVolunteer: volunteerProcedure
      .input(z.object({ volunteerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSchedulesByVolunteer(input.volunteerId);
      }),

    getMySchedules: volunteerProcedure.query(async ({ ctx }) => {
      const volunteer = await db.getVolunteerByUserId(ctx.user.id);
      if (!volunteer) return [];
      return await db.getSchedulesByVolunteer(volunteer.id);
    }),

    getByDateRange: adminProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await db.getSchedulesByDateRange(input.startDate, input.endDate);
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["scheduled", "completed", "absent", "leave"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateScheduleStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ============ 打卡管理 ============
  attendances: router({
    checkIn: volunteerProcedure
      .input(
        z.object({
          scheduleId: z.number().optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const volunteer = await db.getVolunteerByUserId(ctx.user.id);
        if (!volunteer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到志工資料" });
        }
        await db.createAttendance({
          volunteerId: volunteer.id,
          scheduleId: input.scheduleId,
          checkInTime: new Date(),
          location: input.location,
          notes: input.notes,
        });
        return { success: true };
      }),

    checkOut: volunteerProcedure
      .input(
        z.object({
          attendanceId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "資料庫連線失敗",
          });
        }

        const { attendances } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const attendance = await database
          .select()
          .from(attendances)
          .where(eq(attendances.id, input.attendanceId))
          .limit(1);

        if (!attendance || attendance.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到打卡記錄" });
        }
        const checkInTime = attendance[0].checkInTime;
        if (!checkInTime) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "尚未簽到" });
        }
        const checkOutTime = new Date();
        const workHours = Math.floor(
          (checkOutTime.getTime() - checkInTime.getTime()) / 60000
        );
        await db.checkOut(input.attendanceId, checkOutTime, workHours);

        const volunteerId = attendance[0].volunteerId;
        await db.updateVolunteerHours(volunteerId, Math.floor(workHours / 60));

        return { success: true, workHours };
      }),

    getMyAttendances: volunteerProcedure.query(async ({ ctx }) => {
      const volunteer = await db.getVolunteerByUserId(ctx.user.id);
      if (!volunteer) return [];
      return await db.getAttendancesByVolunteer(volunteer.id);
    }),
  }),

  // ============ 請假/換班管理 ============
  leaveRequests: router({
    create: volunteerProcedure
      .input(
        z.object({
          scheduleId: z.number(),
          type: z.enum(["leave", "swap"]),
          targetVolunteerId: z.number().optional(),
          reason: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const volunteer = await db.getVolunteerByUserId(ctx.user.id);
        if (!volunteer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到志工資料" });
        }
        await db.createLeaveRequest({
          volunteerId: volunteer.id,
          ...input,
          status: "pending",
        });
        return { success: true };
      }),

    getMyRequests: volunteerProcedure.query(async ({ ctx }) => {
      const volunteer = await db.getVolunteerByUserId(ctx.user.id);
      if (!volunteer) return [];
      return await db.getLeaveRequestsByVolunteer(volunteer.id);
    }),

    getPending: adminProcedure.query(async () => {
      return await db.getPendingLeaveRequests();
    }),

    approve: adminProcedure
      .input(
        z.object({
          id: z.number(),
          reviewNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await db.updateLeaveRequestStatus(
          input.id,
          "approved",
          ctx.user.id,
          input.reviewNotes
        );

        // 發送Email通知
        if (result && result.userEmail) {
          const { sendLeaveRequestReviewEmail } =
            await import("./emailService");
          await sendLeaveRequestReviewEmail(
            result.userEmail,
            result.userName,
            result.requestType,
            "approved",
            input.reviewNotes
          );
        }

        return { success: true };
      }),

    reject: adminProcedure
      .input(
        z.object({
          id: z.number(),
          reviewNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await db.updateLeaveRequestStatus(
          input.id,
          "rejected",
          ctx.user.id,
          input.reviewNotes
        );

        // 發送Email通知
        if (result && result.userEmail) {
          const { sendLeaveRequestReviewEmail } =
            await import("./emailService");
          await sendLeaveRequestReviewEmail(
            result.userEmail,
            result.userName,
            result.requestType,
            "rejected",
            input.reviewNotes
          );
        }

        return { success: true };
      }),
  }),

  // ============ 案件管理 ============
  cases: router({
    create: publicProcedure
      .input(
        z.object({
          applicantName: z.string(),
          applicantPhone: z.string(),
          applicantEmail: z.string().optional(),
          caseType: z.string(),
          title: z.string(),
          description: z.string(),
          attachments: z.string().optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const caseNumber = `CS${Date.now()}`;
        await db.createCase({
          ...input,
          caseNumber,
          userId: ctx.user?.id,
          status: "submitted",
          priority: input.priority || "medium",
        });
        return { success: true, caseNumber };
      }),

    getAll: adminProcedure.query(async () => {
      return await db.getAllCases();
    }),

    getByCaseNumber: publicProcedure
      .input(z.object({ caseNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getCaseByCaseNumber(input.caseNumber);
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "submitted",
            "reviewing",
            "processing",
            "completed",
            "rejected",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateCaseStatus(input.id, input.status);
        return { success: true };
      }),

    assign: adminProcedure
      .input(
        z.object({
          caseId: z.number(),
          assignedTo: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.assignCaseTo(input.caseId, input.assignedTo);
        return { success: true };
      }),

    addProgress: adminProcedure
      .input(
        z.object({
          caseId: z.number(),
          step: z.string(),
          description: z.string(),
          status: z.enum(["pending", "in_progress", "completed"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.createCaseProgress({
          ...input,
          updatedBy: ctx.user.id,
        });
        return { success: true };
      }),

    getProgress: publicProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseProgressByCaseId(input.caseId);
      }),
  }),

  // ============ 送餐服務管理 ============
  mealDeliveries: router({
    create: adminProcedure
      .input(
        z.object({
          recipientName: z.string(),
          recipientPhone: z.string(),
          deliveryAddress: z.string(),
          deliveryDate: z.date(),
          deliveryTime: z.string(),
          mealType: z.string().optional(),
          specialInstructions: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const deliveryNumber = `MD${Date.now()}`;
        // 生成6位純數字驗證碼 (000000-999999)
        const verificationCode = Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, "0");
        const qrCode = JSON.stringify({ deliveryNumber, verificationCode });

        const delivery = await db.createMealDelivery({
          ...input,
          deliveryNumber,
          verificationCode,
          qrCode,
          status: "pending",
        });

        if (!delivery) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "建立送餐任務失敗",
          });
        }

        // 查詢收餐人是否有LINE綁定
        const recipient = await recipientsDb.getRecipientByPhone(
          input.recipientPhone
        );

        // 如果收餐人已綁定LINE，優先使用LINE通知
        if (
          recipient?.lineUserId &&
          recipient.preferredNotificationMethod !== "sms"
        ) {
          const confirmUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "https://taitungaibookingsystem.cc"}/meal-delivery-confirm/${delivery.id}?code=${verificationCode}`;
          const messages = createDeliveryNotificationMessage(
            input.recipientName,
            input.deliveryDate.toLocaleDateString("zh-TW"),
            input.deliveryTime,
            confirmUrl
          );

          const result = await sendLineMessage(recipient.lineUserId, messages);
          if (result.success) {
            console.log(
              `[Meal Delivery] LINE notification sent to ${input.recipientName}`
            );
          } else {
            console.error(
              `[Meal Delivery] Failed to send LINE notification, falling back to SMS`
            );
            // LINE發送失敗，備用SMS
            await sendDeliveryNotificationSMS({
              recipientPhone: input.recipientPhone,
              recipientName: input.recipientName,
              verificationCode,
              deliveryId: delivery.id,
              deliveryDate: input.deliveryDate,
              deliveryTime: input.deliveryTime,
            });
          }
        } else {
          // 沒有LINE綁定或偏好SMS，使用SMS通知
          await sendDeliveryNotificationSMS({
            recipientPhone: input.recipientPhone,
            recipientName: input.recipientName,
            verificationCode,
            deliveryId: delivery.id,
            deliveryDate: input.deliveryDate,
            deliveryTime: input.deliveryTime,
          });
        }

        return delivery;
      }),

    createBatch: adminProcedure
      .input(
        z.object({
          deliveries: z.array(
            z.object({
              recipientName: z.string(),
              recipientPhone: z.string(),
              deliveryAddress: z.string(),
              deliveryDate: z.date(),
              deliveryTime: z.string(),
              mealType: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = [];
        for (const delivery of input.deliveries) {
          const deliveryNumber = `D${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const verificationCode = generateVerificationCode();
          const qrCode = JSON.stringify({ deliveryNumber, verificationCode });

          const createdDelivery = await db.createMealDelivery({
            ...delivery,
            deliveryNumber,
            verificationCode,
            qrCode,
            status: "pending",
          });

          // 發送SMS通知收餐人
          if (createdDelivery) {
            await sendDeliveryNotificationSMS({
              recipientPhone: delivery.recipientPhone,
              recipientName: delivery.recipientName,
              verificationCode,
              deliveryId: createdDelivery.id,
              deliveryDate: delivery.deliveryDate,
              deliveryTime: delivery.deliveryTime,
            });
          }

          results.push({ deliveryNumber, verificationCode });
        }
        return { success: true, count: results.length, deliveries: results };
      }),

    getAll: adminProcedure.query(async () => {
      return await db.getAllMealDeliveries();
    }),

    getById: volunteerProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const delivery = await db.getMealDeliveryById(input.id);
        if (!delivery) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到送餐記錄" });
        }
        return delivery;
      }),

    getMyDeliveries: protectedProcedure.query(async ({ ctx }) => {
      // 管理員可以查看所有送餐任務
      if (ctx.user.role === "admin") {
        return await db.getAllMealDeliveries();
      }

      // 一般志工只能查看自己的任務
      const volunteers = await db.getVolunteersByUserId(ctx.user.id);
      if (!volunteers || volunteers.length === 0) return [];

      // 查詢所有關聯志工的送餐任務
      const allDeliveries = await Promise.all(
        volunteers.map(v => db.getMealDeliveriesByVolunteer(v.id))
      );

      // 合併結果並去重
      const deliveries = allDeliveries.flat();
      const uniqueDeliveries = Array.from(
        new Map(deliveries.map(d => [d.id, d])).values()
      );

      return uniqueDeliveries;
    }),

    // 取得志工送餐統計（僅管理員可用）
    getVolunteerDeliveryStats: adminProcedure.query(async () => {
      return await db.getVolunteerDeliveryStats();
    }),

    assignVolunteer: adminProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          volunteerId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        // 指派志工
        await db.assignVolunteerToDelivery(input.deliveryId, input.volunteerId);

        // 查詢送餐任務資訊
        const delivery = await db.getMealDeliveryById(input.deliveryId);
        if (!delivery) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到送餐任務" });
        }

        // 查詢志工資訊（需要取得userId以查詢LINE綁定）
        const volunteer = await db.getVolunteerById(input.volunteerId);
        if (!volunteer) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到志工資料" });
        }

        // 查詢志工的使用者資料（取得姓名和LINE綁定）
        const user = await db.getUserById(volunteer.userId);
        if (!user) {
          console.warn(
            `[Meal Delivery] Volunteer user not found: ${volunteer.userId}`
          );
          return { success: true };
        }

        // 查詢志工是否有LINE綁定（透過recipients表）
        const recipient = await recipientsDb.getRecipientByPhone(
          user.phone || ""
        );

        // 如果志工已綁定LINE，發送任務指派通知
        if (recipient?.lineUserId) {
          const { createVolunteerTaskAssignmentMessage } =
            await import("./_core/lineMessaging");
          const messages = createVolunteerTaskAssignmentMessage(
            user.name || "志工",
            delivery.recipientName,
            delivery.deliveryAddress,
            delivery.deliveryDate.toLocaleDateString("zh-TW"),
            delivery.deliveryTime,
            delivery.deliveryNumber
          );

          const result = await sendLineMessage(recipient.lineUserId, messages);
          if (result.success) {
            console.log(
              `[Meal Delivery] Task assignment notification sent to volunteer: ${user.name}`
            );
          } else {
            console.error(
              `[Meal Delivery] Failed to send task assignment notification:`,
              result.error
            );
          }
        } else {
          console.log(
            `[Meal Delivery] Volunteer ${user.name} has no LINE binding, skipping notification`
          );
        }

        return { success: true };
      }),

    start: volunteerProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ input }) => {
        await db.startDelivery(input.deliveryId);
        return { success: true };
      }),

    complete: volunteerProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          photo: z.string().optional(),
          signature: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.completeDelivery(
          input.deliveryId,
          input.photo,
          input.signature
        );
        return { success: true };
      }),

    verify: volunteerProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          verificationCode: z.string(),
        })
      )
      .query(async ({ input }) => {
        const delivery = await db.getMealDeliveryById(input.deliveryId);
        if (!delivery) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到送餐記錄" });
        }
        const isValid = delivery.verificationCode === input.verificationCode;
        return { valid: isValid };
      }),

    addTracking: volunteerProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          latitude: z.string(),
          longitude: z.string(),
          speed: z.string().optional(),
          accuracy: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.createDeliveryTracking({
          ...input,
          timestamp: new Date(),
        });
        return { success: true };
      }),

    getTracking: adminProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliveryTrackingByDeliveryId(input.deliveryId);
      }),

    optimizeRoute: adminProcedure
      .input(
        z.object({
          startPoint: z.string(),
          deliveryIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        // 獲取送餐任務資料
        const deliveries = await Promise.all(
          input.deliveryIds.map(id => db.getMealDeliveryById(id))
        );

        const validDeliveries = deliveries.filter(d => d !== undefined);
        if (validDeliveries.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到送餐任務" });
        }

        const deliveryPoints = validDeliveries.map(d => ({
          id: d!.id,
          address: d!.deliveryAddress,
          recipientName: d!.recipientName,
        }));

        const optimizedRoute = await optimizeDeliveryRoute(
          input.startPoint,
          deliveryPoints
        );

        return {
          success: true,
          orderedDeliveryIds: optimizedRoute.orderedPoints.map(p => p.id),
          totalDistance: formatDistance(optimizedRoute.totalDistance),
          totalDuration: formatDuration(optimizedRoute.totalDuration),
          polyline: optimizedRoute.polyline,
        };
      }),

    getQRCode: publicProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        const database = await db.getDb();
        if (!database)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });

        const { mealDeliveries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // 驗證送餐任務是否存在
        const delivery = await database
          .select()
          .from(mealDeliveries)
          .where(eq(mealDeliveries.id, input.deliveryId))
          .limit(1);
        if (delivery.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Delivery not found",
          });
        }

        // 生成QR Code URL（收餐人掃描後會導向確認頁面）
        const confirmUrl = `${process.env.VITE_APP_URL || "https://3000-il1io6hgxt6mik0thc87e-9837adb0.manus-asia.computer"}/confirm-receipt/${input.deliveryId}`;

        // 生成QR Code圖片（Base64格式）
        const qrCodeDataUrl = await QRCode.toDataURL(confirmUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        return {
          deliveryId: input.deliveryId,
          qrCodeDataUrl,
          confirmUrl,
        };
      }),

    confirmReceipt: publicProcedure
      .input(
        z.object({
          deliveryId: z.number(),
          verificationCode: z.string(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });

        const { mealDeliveries, deliveryTracking } =
          await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // 驗證送餐任務是否存在
        const delivery = await database
          .select()
          .from(mealDeliveries)
          .where(eq(mealDeliveries.id, input.deliveryId))
          .limit(1);
        if (delivery.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "送餐任務不存在" });
        }

        const currentDelivery = delivery[0];

        // 檢查是否已經確認過
        if (currentDelivery.status === "delivered") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "此送餐任務已經確認收餐",
          });
        }

        // 驗證序號
        if (currentDelivery.verificationCode !== input.verificationCode) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "驗證序號錯誤" });
        }

        // 更新送餐任務狀態為已送達
        await database
          .update(mealDeliveries)
          .set({
            status: "delivered",
          })
          .where(eq(mealDeliveries.id, input.deliveryId));

        // 如果提供了GPS位置，記錄到追蹤系統
        if (input.latitude && input.longitude) {
          await database.insert(deliveryTracking).values({
            deliveryId: input.deliveryId,
            latitude: input.latitude.toString(),
            longitude: input.longitude.toString(),
            timestamp: new Date(),
          });
        }

        return {
          success: true,
          message: "收餐確認成功！感謝您的配合。",
          deliveryId: input.deliveryId,
        };
      }),

    // 簡化版：只用驗證碼確認收餐（供公開頁面使用）
    confirmReceiptByCode: publicProcedure
      .input(
        z.object({
          verificationCode: z.string().length(6),
        })
      )
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });

        const { mealDeliveries, volunteers, users } =
          await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        // 透過驗證碼查詢送餐任務
        const deliveryResult = await database
          .select({
            delivery: mealDeliveries,
            volunteer: volunteers,
            user: users,
          })
          .from(mealDeliveries)
          .leftJoin(volunteers, eq(mealDeliveries.volunteerId, volunteers.id))
          .leftJoin(users, eq(volunteers.userId, users.id))
          .where(eq(mealDeliveries.verificationCode, input.verificationCode))
          .limit(1);

        if (deliveryResult.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "驗證碼錯誤或送餐任務不存在",
          });
        }

        const { delivery, user } = deliveryResult[0];

        // 檢查是否已經確認過
        if (delivery.status === "delivered") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "此送餐任務已經確認收餐",
          });
        }

        // 更新送餐任務狀態為已送達
        await database
          .update(mealDeliveries)
          .set({
            status: "delivered",
          })
          .where(eq(mealDeliveries.id, delivery.id));

        return {
          success: true,
          message: "收餐確認成功！感謝您的配合。",
          deliveryNumber: delivery.deliveryNumber,
          volunteerName: user?.name || "未知志工",
          deliveryId: delivery.id,
        };
      }),

    // 刪除送餐任務（僅管理員可用）
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMealDelivery(input.id);
        return { success: true };
      }),

    // 批次刪除送餐任務（僅管理員可用）
    batchDelete: adminProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await db.batchDeleteMealDeliveries(input.ids);
        return { success: true, count: input.ids.length };
      }),
  }),

  // ============ 收餐人管理 ============
  recipients: router({
    // 查詢所有收餐人
    getAll: adminProcedure.query(async () => {
      return await recipientsDb.getAllRecipients();
    }),

    // 新增收餐人
    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          phone: z.string(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // 檢查電話是否已存在
        const existing = await recipientsDb.getRecipientByPhone(input.phone);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "此電話號碼已經存在",
          });
        }

        const recipient = await recipientsDb.createRecipient(input);
        if (!recipient) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "建立收餐人失敗",
          });
        }

        return recipient;
      }),

    // 更新收餐人
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const success = await recipientsDb.updateRecipient(id, data);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "更新收餐人失敗",
          });
        }
        return { success: true };
      }),

    // 刪除收餐人
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await recipientsDb.deleteRecipient(input.id);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "刪除收餐人失敗",
          });
        }
        return { success: true };
      }),

    // 綁定LINE帳號（管理員手動綁定）
    bindLine: adminProcedure
      .input(
        z.object({
          recipientId: z.number(),
          lineUserId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // 取得LINE使用者資料
        const profileResult = await getLineUserProfile(input.lineUserId);
        if (!profileResult.success || !profileResult.profile) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "無法取得LINE使用者資料，請確認使用者已加入好友",
          });
        }

        const success = await recipientsDb.updateRecipientLineBinding(
          input.recipientId,
          input.lineUserId,
          profileResult.profile.displayName
        );

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "綁定LINE帳號失敗",
          });
        }

        return {
          success: true,
          displayName: profileResult.profile.displayName,
        };
      }),

    // 解除LINE綁定
    unbindLine: adminProcedure
      .input(z.object({ recipientId: z.number() }))
      .mutation(async ({ input }) => {
        const success = await recipientsDb.clearRecipientLineBinding(
          input.recipientId
        );
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "解除LINE綁定失敗",
          });
        }
        return { success: true };
      }),

    // 取得LINE機器人資訊（用於QR Code顯示）
    getLineBotInfo: adminProcedure.query(() => {
      const botBasicId = process.env.LINE_BOT_BASIC_ID;
      if (!botBasicId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "LINE機器人未設定",
        });
      }
      return {
        basicId: botBasicId,
        qrCodeUrl: `https://line.me/R/ti/p/${botBasicId}`,
        addFriendUrl: `https://line.me/R/ti/p/${botBasicId}`,
      };
    }),
  }),

  // ============ 通知管理 ============
  notifications: router({
    getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotificationsByUser(ctx.user.id);
    }),

    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============ 義工申請與管理 ============
  volunteerManagement: router({
    // 義工申請（需登入）
    submitApplication: protectedProcedure
      .input(
        z.object({
          employeeId: z.string().optional(),
          department: z.string().optional(),
          position: z.string().optional(),
          skills: z.string().optional(),
          availability: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 檢查是否已經申請過
        const existing = await db.getVolunteerByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "您已經提交過義工申請",
          });
        }

        await db.createVolunteerApplication({
          userId: ctx.user.id,
          ...input,
        });

        return { success: true, message: "申請已提交，請等待管理員審核" };
      }),

    // 獲取待審核的義工列表（管理員）
    getPending: adminProcedure.query(async () => {
      return await db.getPendingVolunteers();
    }),

    // 審核義工申請 - 核准（管理員）
    approve: adminProcedure
      .input(z.object({ volunteerId: z.number() }))
      .mutation(async ({ input }) => {
        await db.approveVolunteer(input.volunteerId);
        return { success: true, message: "已核准義工申請" };
      }),

    // 審核義工申請 - 拒絕（管理員）
    reject: adminProcedure
      .input(z.object({ volunteerId: z.number() }))
      .mutation(async ({ input }) => {
        await db.rejectVolunteer(input.volunteerId);
        return { success: true, message: "已拒絕義工申請" };
      }),
  }),

  // ============ 送餐任務管理 ============
  deliveryTasks: router({
    // 建立送餐任務（管理員）
    create: adminProcedure
      .input(
        z.object({
          taskNumber: z.string(),
          taskDate: z.date(),
          volunteerId: z.number().optional(),
          volunteerName: z.string().optional(),
          notes: z.string().optional(),
          points: z.array(
            z.object({
              sequence: z.number(),
              recipientName: z.string(),
              recipientPhone: z.string(),
              deliveryAddress: z.string(),
              latitude: z.string().optional(),
              longitude: z.string().optional(),
              specialInstructions: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const result = await db.createDeliveryTask(input);
        return { success: true, taskId: result.taskId };
      }),

    // 獲取所有送餐任務（管理員）
    getAll: adminProcedure
      .input(
        z
          .object({
            status: z.string().optional(),
            volunteerId: z.number().optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await db.getAllDeliveryTasks(input);
      }),

    // 獲取單一送餐任務詳細資訊
    getById: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliveryTaskById(input.taskId);
      }),

    // 指派送餐任務給義工（管理員）
    assign: adminProcedure
      .input(
        z.object({
          taskId: z.number(),
          volunteerId: z.number(),
          volunteerName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await db.assignDeliveryTask(
          input.taskId,
          input.volunteerId,
          input.volunteerName
        );
        return { success: true };
      }),

    // 獲取我的送餐任務（義工）
    getMyTasks: volunteerProcedure.query(async ({ ctx }) => {
      const volunteer = await db.getVolunteerByUserId(ctx.user.id);
      if (!volunteer) return [];

      // 獲取今日的任務
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await db.getAllDeliveryTasks({
        volunteerId: volunteer.id,
        startDate: today,
        endDate: tomorrow,
      });
    }),

    // 開始送餐任務（義工）
    start: volunteerProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        await db.startDeliveryTask(input.taskId);
        return { success: true };
      }),

    // 標記送餐點為已完成（義工）
    markPointComplete: volunteerProcedure
      .input(z.object({ pointId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markDeliveryPointComplete(input.pointId);
        return { success: true };
      }),
  }),

  // ============ 最新消息管理 ============
  news: router({
    // 公開的最新消息列表（前台）
    getPublished: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getPublishedNews(input?.limit);
      }),

    // 獲取單一最新消息（前台）
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const newsItem = await db.getNewsById(input.id);
        if (newsItem && newsItem.isPublished) {
          // 增加瀏覽次數
          await db.incrementNewsViewCount(input.id);
        }
        return newsItem;
      }),

    // 獲取所有最新消息（後台）
    getAll: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllNews(input?.limit);
      }),

    // 新增最新消息（後台）
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(200),
          content: z.string().min(1),
          summary: z.string().max(500).optional(),
          coverImage: z.string().max(500).optional(),
          category: z.enum(["防災宣導", "活動公告", "新聞稿", "其他"]),
          isPublished: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const newsData = {
          ...input,
          authorId: ctx.user.id,
          publishedAt: input.isPublished ? new Date() : null,
        };
        const result = await db.createNews(newsData);
        return result;
      }),

    // 更新最新消息（後台）
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(200).optional(),
          content: z.string().min(1).optional(),
          summary: z.string().max(500).optional(),
          coverImage: z.string().max(500).optional(),
          category: z
            .enum(["防災宣導", "活動公告", "新聞稿", "其他"])
            .optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;

        // 如果更新為已發布，設定發布時間
        if (updateData.isPublished) {
          const existing = await db.getNewsById(id);
          if (existing && !existing.isPublished) {
            (updateData as any).publishedAt = new Date();
          }
        }

        await db.updateNews(id, updateData);
        const updated = await db.getNewsById(id);
        return updated;
      }),

    // 刪除最新消息（後台）
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteNews(input.id);
        return { success: true };
      }),

    // 增加瀏覽次數
    incrementViewCount: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementNewsViewCount(input.id);
        return { success: true };
      }),
  }),

  // ============ 服務花絮照片牆管理 ============
  gallery: router({
    // 公開的照片列表（前台）
    getPublished: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getPublishedGallery(input?.limit);
      }),

    // 獲取所有照片（後台）
    getAll: adminProcedure.query(async () => {
      return await db.getAllGallery();
    }),

    // 獲取單一照片
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getGalleryById(input.id);
      }),

    // 新增照片（後台）
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(200),
          description: z.string().optional(),
          imageUrl: z.string().min(1).max(500),
          category: z.enum([
            "活動花絮",
            "設施環境",
            "教育訓練",
            "志工服務",
            "其他",
          ]),
          isPublished: z.boolean().default(true),
          displayOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const galleryData = {
          ...input,
          uploadedBy: ctx.user.id,
        };
        const result = await db.createGalleryItem(galleryData);
        return result;
      }),

    // 更新照片（後台）
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(200).optional(),
          description: z.string().optional(),
          imageUrl: z.string().min(1).max(500).optional(),
          category: z
            .enum(["活動花絮", "設施環境", "教育訓練", "志工服務", "其他"])
            .optional(),
          isPublished: z.boolean().optional(),
          displayOrder: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateGalleryItem(id, updateData);
        const updated = await db.getGalleryById(id);
        return updated;
      }),

    // 刪除照片（後台）
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteGalleryItem(input.id);
        return { success: true };
      }),

    // 批次刪除照片（後台）
    batchDelete: adminProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const deletedCount = await db.batchDeleteGalleryItems(input.ids);
        return { success: true, deletedCount };
      }),
  }),

  // ============ 圖片上傳 ============
  upload: router({
    // 上傳圖片（管理員專用）
    image: adminProcedure
      .input(
        z.object({
          base64Data: z.string(),
          mimeType: z.string(),
          originalName: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { uploadImage } = await import("./imageUpload");
        const result = await uploadImage(
          input.base64Data,
          input.mimeType,
          input.originalName,
          ctx.user.id
        );
        return result;
      }),
  }),

  // ============ 首頁內容管理 ============
  homeContent: router({
    // 查詢首頁內容（公開）
    get: publicProcedure.query(async () => {
      const content = await db.getHomeContent();
      if (!content) {
        console.warn(
          "[homeContent.get] No content found in database, returning default values"
        );
        // 返回預設值而不是拋出錯誤
        return {
          id: 0,
          aboutTitle: "關於臺東災害警覺教育館",
          aboutParagraph1: "臺東災害警覺教育館致力於提供全民防災教育。",
          aboutParagraph2: "我們提供專業的導覽服務和互動體驗。",
          aboutParagraph3: "歡迎預約參訪，一起學習防災知識。",
          heroImage1: "/images/gallery/taitung-fire-dept-exterior.jpg",
          heroImage1Title: "臺東災害警覺教育館外觀",
          heroImage1Desc: "現代化的防災教育場館",
          heroImage2: "/images/gallery/earthquake-simulation.jpg",
          heroImage2Title: "地震模擬區",
          heroImage2Desc: "體驗地震並學習避難技巧",
          heroImage3: "/images/gallery/climate-projection-globe.jpg",
          heroImage3Title: "即時氣候投影球",
          heroImage3Desc: "了解全球氣候變化",
          heroImage4: "/images/gallery/fire-rescue-experience.jpg",
          heroImage4Title: "消防救災體驗區",
          heroImage4Desc: "模擬消防救災情境",
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: null,
        };
      }
      return content;
    }),

    // 更新首頁內容（管理員專用）
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          aboutTitle: z.string().optional(),
          aboutParagraph1: z.string().optional(),
          aboutParagraph2: z.string().optional(),
          aboutParagraph3: z.string().optional(),
          heroImage1: z.string().optional(),
          heroImage1Title: z.string().optional(),
          heroImage1Desc: z.string().optional(),
          heroImage2: z.string().optional(),
          heroImage2Title: z.string().optional(),
          heroImage2Desc: z.string().optional(),
          heroImage3: z.string().optional(),
          heroImage3Title: z.string().optional(),
          heroImage3Desc: z.string().optional(),
          heroImage4: z.string().optional(),
          heroImage4Title: z.string().optional(),
          heroImage4Desc: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateHomeContent({ ...input, updatedBy: ctx.user.id });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
