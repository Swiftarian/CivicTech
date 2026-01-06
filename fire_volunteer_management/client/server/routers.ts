import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { getEmailLogs, getEmailStats, getVolunteerPerformanceStats, getAllVolunteersPerformance } from "./db";
import { sendPublicBookingConfirmationEmail, sendGroupBookingConfirmationEmail } from "./emailService";
import { triggerBookingReminders } from "./scheduledTasks";
import { optimizeDeliveryRoute, formatDistance, formatDuration } from "./routeOptimization";
import { generateVerificationCode, sendDeliveryNotificationSMS } from "./smsService";
import QRCode from "qrcode";

// 管理員專用 procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

// 志工專用 procedure（志工和管理員都可使用）
const volunteerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'volunteer' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要志工或管理員權限' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ 使用者管理 ============
  users: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "volunteer", "admin"])
      }))
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
            const employeeId = volunteerData.employeeId || '未知';
            results.errors.push(
              `員工編號 ${employeeId}: ${error instanceof Error ? error.message : '未知錯誤'}`
            );
          }
        }

        return results;
      }),

    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        employeeId: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        skills: z.string().optional(),
        availability: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createVolunteer(input);
        await db.updateUserRole(input.userId, "volunteer");
        return { success: true };
      }),

    getAll: adminProcedure.query(async () => {
      return await db.getAllVolunteers();
    }),

    getMyProfile: volunteerProcedure.query(async ({ ctx }) => {
      return await db.getVolunteerByUserId(ctx.user.id);
    }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        employeeId: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        skills: z.string().optional(),
        availability: z.string().optional(),
        status: z.enum(["active", "inactive", "leave"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVolunteer(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteVolunteer(input.id);
        return { success: true };
      }),

    // 查詢單一志工績效統計
    getPerformance: adminProcedure
      .input(z.object({
        volunteerId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getVolunteerPerformanceStats(input.volunteerId);
      }),

    // 查詢所有志工績效統計
    getAllPerformance: adminProcedure
      .query(async () => {
        return await getAllVolunteersPerformance();
      }),
  }),

  // ============ 排程任務管理 ============
  scheduledTasks: router({
    // 手動觸發發送預約提醒Email（管理員專用）
    triggerBookingReminders: adminProcedure
      .mutation(async () => {
        const results = await triggerBookingReminders();
        return results;
      }),
  }),

  // ============ Email歷史記錄 ============
  emailLogs: router({
    // 查詢Email發送歷史（管理員專用）
    list: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        emailType: z.string().optional(),
        isTest: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        const logs = await getEmailLogs(input);
        return logs;
      }),

    // 統計Email發送狀況（管理員專用）
    stats: adminProcedure
      .query(async () => {
        const stats = await getEmailStats();
        return stats;
      }),
  }),

  // ============ Email測試 ============
  emailTest: router({
    // 測試預約確認Email（管理員專用）
    testBookingConfirmation: adminProcedure
      .input(z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        bookingType: z.enum(["public", "group"]),
        organizationName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const testBookingNumber = `TEST${Date.now()}`;
        const testVisitDate = new Date();
        testVisitDate.setDate(testVisitDate.getDate() + 7);
        const visitDate = testVisitDate.toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
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
          message: success ? 'Email發送成功！請檢查收件匣（可能在垃圾郵件中）' : 'Email發送失敗，請檢查Email設定'
        };
      }),

    // 測試預約提醒Email（管理員專用）
    testBookingReminder: adminProcedure
      .input(z.object({
        recipientEmail: z.string().email(),
        recipientName: z.string(),
        bookingType: z.enum(["public", "group"]),
        organizationName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const testBookingNumber = `TEST${Date.now()}`;
        const testVisitDate = new Date();
        testVisitDate.setDate(testVisitDate.getDate() + 3);
        const visitDate = testVisitDate.toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const testVisitTime = "14:00-16:00";
        const testVisitorCount = input.bookingType === "group" ? 25 : 4;

        let success = false;
        if (input.bookingType === "group" && input.organizationName) {
          const { sendGroupBookingReminderEmail } = await import("./emailService");
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
          const { sendPublicBookingReminderEmail } = await import("./emailService");
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
          message: success ? 'Email發送成功！請檢查收件匣（可能在垃圾郵件中）' : 'Email發送失敗，請檢查Email設定'
        };
      }),
  }),

  // ============ SMS測試 ============
  smsTest: router({
    // 測試送餐SMS通知（管理員專用）
    testDeliveryNotification: adminProcedure
      .input(z.object({
        recipientPhone: z.string(),
        recipientName: z.string(),
      }))
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
送達日期：${testDeliveryDate.toLocaleDateString('zh-TW')}
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
            ? 'SMS發送成功！（模擬模式，請查看console輸出）' 
            : 'SMS發送失敗，請檢查SMS設定'
        };
      }),
  }),

  // ============ 預約管理 ============
  bookings: router({
    create: publicProcedure
      .input(z.object({
        type: z.enum(["group", "individual"]),
        contactName: z.string(),
        contactPhone: z.string(),
        contactEmail: z.string().optional(),
        organizationName: z.string().optional(),
        numberOfPeople: z.number(),
        visitDate: z.date(),
        visitTime: z.string(),
        purpose: z.string().optional(),
        specialNeeds: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const bookingNumber = `BK${Date.now()}`;
        await db.createBooking({
          ...input,
          bookingNumber,
          userId: ctx.user?.id,
          status: "pending"
        });
        
        // 發送Email通知（如果有提供Email）
        if (input.contactEmail) {
          const visitDate = input.visitDate.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          
          if (input.type === 'group' && input.organizationName) {
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

    getAll: adminProcedure.query(async () => {
      return await db.getAllBookings();
    }),

    getByNumber: publicProcedure
      .input(z.object({ bookingNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getBookingByNumber(input.bookingNumber);
      }),

    getByDateRange: adminProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date()
      }))
      .query(async ({ input }) => {
        return await db.getBookingsByDateRange(input.startDate, input.endDate);
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"])
      }))
      .mutation(async ({ input }) => {
        await db.updateBookingStatus(input.id, input.status);
        return { success: true };
      }),

    assignVolunteer: adminProcedure
      .input(z.object({
        bookingId: z.number(),
        volunteerId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.assignVolunteerToBooking(input.bookingId, input.volunteerId);
        return { success: true };
      }),
  }),

  // ============ 排班管理 ============
  schedules: router({
    create: adminProcedure
      .input(z.object({
        volunteerId: z.number(),
        shiftDate: z.date(),
        shiftTime: z.string(),
        shiftType: z.enum(["morning", "afternoon", "fullday"]),
        bookingId: z.number().optional(),
        notes: z.string().optional(),
      }))
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
      .input(z.object({
        startDate: z.date(),
        endDate: z.date()
      }))
      .query(async ({ input }) => {
        return await db.getSchedulesByDateRange(input.startDate, input.endDate);
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["scheduled", "completed", "absent", "leave"])
      }))
      .mutation(async ({ input }) => {
        await db.updateScheduleStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ============ 打卡管理 ============
  attendances: router({
    checkIn: volunteerProcedure
      .input(z.object({
        scheduleId: z.number().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const volunteer = await db.getVolunteerByUserId(ctx.user.id);
        if (!volunteer) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到志工資料' });
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
      .input(z.object({
        attendanceId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const database = await db.getDb();
        if (!database) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '資料庫連線失敗' });
        }
        
        const { attendances } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        const attendance = await database.select().from(attendances)
          .where(eq(attendances.id, input.attendanceId)).limit(1);
        
        if (!attendance || attendance.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到打卡記錄' });
        }
        const checkInTime = attendance[0].checkInTime;
        if (!checkInTime) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '尚未簽到' });
        }
        const checkOutTime = new Date();
        const workHours = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);
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
      .input(z.object({
        scheduleId: z.number(),
        type: z.enum(["leave", "swap"]),
        targetVolunteerId: z.number().optional(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const volunteer = await db.getVolunteerByUserId(ctx.user.id);
        if (!volunteer) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到志工資料' });
        }
        await db.createLeaveRequest({
          volunteerId: volunteer.id,
          ...input,
          status: "pending"
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
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.updateLeaveRequestStatus(input.id, "approved", ctx.user.id, input.reviewNotes);
        
        // 發送Email通知
        if (result && result.userEmail) {
          const { sendLeaveRequestReviewEmail } = await import('./emailService');
          await sendLeaveRequestReviewEmail(
            result.userEmail,
            result.userName,
            result.requestType,
            'approved',
            input.reviewNotes
          );
        }
        
        return { success: true };
      }),

    reject: adminProcedure
      .input(z.object({
        id: z.number(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.updateLeaveRequestStatus(input.id, "rejected", ctx.user.id, input.reviewNotes);
        
        // 發送Email通知
        if (result && result.userEmail) {
          const { sendLeaveRequestReviewEmail } = await import('./emailService');
          await sendLeaveRequestReviewEmail(
            result.userEmail,
            result.userName,
            result.requestType,
            'rejected',
            input.reviewNotes
          );
        }
        
        return { success: true };
      }),
  }),

  // ============ 案件管理 ============
  cases: router({
    create: publicProcedure
      .input(z.object({
        applicantName: z.string(),
        applicantPhone: z.string(),
        applicantEmail: z.string().optional(),
        caseType: z.string(),
        title: z.string(),
        description: z.string(),
        attachments: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const caseNumber = `CS${Date.now()}`;
        await db.createCase({
          ...input,
          caseNumber,
          userId: ctx.user?.id,
          status: "submitted",
          priority: input.priority || "medium"
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
      .input(z.object({
        id: z.number(),
        status: z.enum(["submitted", "reviewing", "processing", "completed", "rejected"])
      }))
      .mutation(async ({ input }) => {
        await db.updateCaseStatus(input.id, input.status);
        return { success: true };
      }),

    assign: adminProcedure
      .input(z.object({
        caseId: z.number(),
        assignedTo: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.assignCaseTo(input.caseId, input.assignedTo);
        return { success: true };
      }),

    addProgress: adminProcedure
      .input(z.object({
        caseId: z.number(),
        step: z.string(),
        description: z.string(),
        status: z.enum(["pending", "in_progress", "completed"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createCaseProgress({
          ...input,
          updatedBy: ctx.user.id
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
      .input(z.object({
        recipientName: z.string(),
        recipientPhone: z.string(),
        deliveryAddress: z.string(),
        deliveryDate: z.date(),
        deliveryTime: z.string(),
        mealType: z.string().optional(),
        specialInstructions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const deliveryNumber = `MD${Date.now()}`;
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const qrCode = JSON.stringify({ deliveryNumber, verificationCode });
        
        const delivery = await db.createMealDelivery({
          ...input,
          deliveryNumber,
          verificationCode,
          qrCode,
          status: "pending"
        });
        
        if (!delivery) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "建立送餐任務失敗" });
        }
        
        // 發送SMS簡訊通知收餐人
        await sendDeliveryNotificationSMS({
          recipientPhone: input.recipientPhone,
          recipientName: input.recipientName,
          verificationCode,
          deliveryId: delivery.id,
          deliveryDate: input.deliveryDate,
          deliveryTime: input.deliveryTime,
        });
        
        return delivery;
      }),

    createBatch: adminProcedure
      .input(z.object({
        deliveries: z.array(z.object({
          recipientName: z.string(),
          recipientPhone: z.string(),
          deliveryAddress: z.string(),
          deliveryDate: z.date(),
          deliveryTime: z.string(),
          mealType: z.string().optional(),
        }))
      }))
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
            status: "pending"
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
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到送餐記錄' });
        }
        return delivery;
      }),

    getMyDeliveries: volunteerProcedure.query(async ({ ctx }) => {
      const volunteer = await db.getVolunteerByUserId(ctx.user.id);
      if (!volunteer) return [];
      return await db.getMealDeliveriesByVolunteer(volunteer.id);
    }),

    assignVolunteer: adminProcedure
      .input(z.object({
        deliveryId: z.number(),
        volunteerId: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.assignVolunteerToDelivery(input.deliveryId, input.volunteerId);
        return { success: true };
      }),

    start: volunteerProcedure
      .input(z.object({ deliveryId: z.number() }))
      .mutation(async ({ input }) => {
        await db.startDelivery(input.deliveryId);
        return { success: true };
      }),

    complete: volunteerProcedure
      .input(z.object({
        deliveryId: z.number(),
        photo: z.string().optional(),
        signature: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.completeDelivery(input.deliveryId, input.photo, input.signature);
        return { success: true };
      }),

    verify: volunteerProcedure
      .input(z.object({
        deliveryId: z.number(),
        verificationCode: z.string()
      }))
      .query(async ({ input }) => {
        const delivery = await db.getMealDeliveryById(input.deliveryId);
        if (!delivery) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到送餐記錄' });
        }
        const isValid = delivery.verificationCode === input.verificationCode;
        return { valid: isValid };
      }),

    addTracking: volunteerProcedure
      .input(z.object({
        deliveryId: z.number(),
        latitude: z.string(),
        longitude: z.string(),
        speed: z.string().optional(),
        accuracy: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createDeliveryTracking({
          ...input,
          timestamp: new Date()
        });
        return { success: true };
      }),

    getTracking: adminProcedure
      .input(z.object({ deliveryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliveryTrackingByDeliveryId(input.deliveryId);
      }),

    optimizeRoute: adminProcedure
      .input(z.object({
        startPoint: z.string(),
        deliveryIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        // 獲取送餐任務資料
        const deliveries = await Promise.all(
          input.deliveryIds.map(id => db.getMealDeliveryById(id))
        );

        const validDeliveries = deliveries.filter(d => d !== undefined);
        if (validDeliveries.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到送餐任務' });
        }

        const deliveryPoints = validDeliveries.map(d => ({
          id: d!.id,
          address: d!.deliveryAddress,
          recipientName: d!.recipientName,
        }));

        const optimizedRoute = await optimizeDeliveryRoute(input.startPoint, deliveryPoints);

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
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { mealDeliveries } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        // 驗證送餐任務是否存在
        const delivery = await database.select().from(mealDeliveries).where(eq(mealDeliveries.id, input.deliveryId)).limit(1);
        if (delivery.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
        }

        // 生成QR Code URL（收餐人掃描後會導向確認頁面）
        const confirmUrl = `${process.env.VITE_APP_URL || 'https://3000-il1io6hgxt6mik0thc87e-9837adb0.manus-asia.computer'}/confirm-receipt/${input.deliveryId}`;
        
        // 生成QR Code圖片（Base64格式）
        const qrCodeDataUrl = await QRCode.toDataURL(confirmUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        return {
          deliveryId: input.deliveryId,
          qrCodeDataUrl,
          confirmUrl,
        };
      }),

    confirmReceipt: publicProcedure
      .input(z.object({
        deliveryId: z.number(),
        verificationCode: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }))
      .mutation(async ({ input }) => {        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const { mealDeliveries, deliveryTracking } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        // 驗證送餐任務是否存在
        const delivery = await database.select().from(mealDeliveries).where(eq(mealDeliveries.id, input.deliveryId)).limit(1);
        if (delivery.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "送餐任務不存在" });
        }

        const currentDelivery = delivery[0];

        // 檢查是否已經確認過
        if (currentDelivery.status === 'delivered') {
          throw new TRPCError({ code: "BAD_REQUEST", message: "此送餐任務已經確認收餐" });
        }

        // 驗證序號
        if (currentDelivery.verificationCode !== input.verificationCode) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "驗證序號錯誤" });
        }

        // 更新送餐任務狀態為已送達
        await database.update(mealDeliveries)
          .set({
            status: 'delivered',
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
});

export type AppRouter = typeof appRouter;
