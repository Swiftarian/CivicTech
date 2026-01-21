/**
 * 排程任務處理器
 * 
 * 此模組負責執行定期排程任務，包含：
 * - 發送預約提醒Email（參訪日前3天）
 */

import * as db from "./db";
import { sendPublicBookingReminderEmail, sendGroupBookingReminderEmail } from "./emailService";

/**
 * 發送預約提醒Email給即將到來的預約
 * 
 * 此函數會：
 * 1. 查詢3天後的所有預約
 * 2. 篩選還沒發送過提醒的預約
 * 3. 發送提醒Email
 * 4. 標記已發送提醒
 * 
 * 建議每天執行一次（例如：每天早上9點）
 */
export async function sendBookingReminders(): Promise<{
  success: number;
  failed: number;
  total: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    total: 0,
    errors: [] as string[],
  };

  try {
    // 查詢需要發送提醒的預約
    const bookingsNeedingReminder = await db.getBookingsNeedingReminder();
    results.total = bookingsNeedingReminder.length;

    console.log(`[排程任務] 找到 ${results.total} 筆需要發送提醒的預約`);

    // 逐一發送提醒Email
    for (const booking of bookingsNeedingReminder) {
      try {
        // 確保有Email地址
        if (!booking.contactEmail) {
          console.warn(`[排程任務] 預約 ${booking.bookingNumber} 沒有Email地址，跳過`);
          continue;
        }

        // 格式化日期
        const visitDate = new Date(booking.visitDate).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        let emailSent = false;

        // 根據預約類型選擇Email範本
        if (booking.type === 'group' && booking.organizationName) {
          // 團體預約
          emailSent = await sendGroupBookingReminderEmail(
            booking.contactEmail,
            booking.organizationName,
            booking.contactName,
            booking.bookingNumber,
            visitDate,
            booking.visitTime,
            booking.numberOfPeople
          );
        } else {
          // 民眾預約
          emailSent = await sendPublicBookingReminderEmail(
            booking.contactEmail,
            booking.contactName,
            booking.bookingNumber,
            visitDate,
            booking.visitTime,
            booking.numberOfPeople
          );
        }

        if (emailSent) {
          // 標記已發送提醒
          await db.markBookingReminderSent(booking.id);
          results.success++;
          console.log(`[排程任務] 成功發送提醒Email給預約 ${booking.bookingNumber}`);
        } else {
          results.failed++;
          results.errors.push(`預約 ${booking.bookingNumber} Email發送失敗`);
          console.error(`[排程任務] 發送提醒Email失敗：預約 ${booking.bookingNumber}`);
        }
      } catch (error) {
        results.failed++;
        const errorMsg = `預約 ${booking.bookingNumber} 處理失敗: ${error instanceof Error ? error.message : String(error)}`;
        results.errors.push(errorMsg);
        console.error(`[排程任務] ${errorMsg}`);
      }
    }

    console.log(`[排程任務] 完成發送提醒Email：成功 ${results.success} 筆，失敗 ${results.failed} 筆`);
  } catch (error) {
    console.error('[排程任務] 執行發送提醒Email任務時發生錯誤:', error);
    results.errors.push(`系統錯誤: ${error instanceof Error ? error.message : String(error)}`);
  }

  return results;
}

/**
 * 初始化排程任務
 * 
 * 設定定期執行的排程任務
 * 目前設定為每天早上9點執行
 */
export function initializeScheduledTasks() {
  // 計算下一次執行時間（明天早上9點）
  const now = new Date();
  const tomorrow9AM = new Date(now);
  tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
  tomorrow9AM.setHours(9, 0, 0, 0);
  
  const timeUntilFirstRun = tomorrow9AM.getTime() - now.getTime();

  console.log(`[排程任務] 初始化完成，首次執行時間：${tomorrow9AM.toLocaleString('zh-TW')}`);

  // 設定首次執行
  setTimeout(() => {
    // 執行任務
    sendBookingReminders();

    // 之後每24小時執行一次
    setInterval(() => {
      sendBookingReminders();
    }, 24 * 60 * 60 * 1000); // 24小時
  }, timeUntilFirstRun);
}

/**
 * 手動觸發發送提醒Email（用於測試或管理員手動執行）
 */
export async function triggerBookingReminders() {
  console.log('[排程任務] 手動觸發發送預約提醒Email');
  return await sendBookingReminders();
}
