/**
 * Email 通知服務
 * 
 * 此模組負責發送各類Email通知
 * 使用 Nodemailer + Gmail SMTP 發送Email
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logEmailSent } from './db';

// Email transporter (懶加載)
let transporter: Transporter | null = null;

/**
 * 獲取或建立 Email transporter
 */
function getTransporter(): Transporter | null {
  // 如果已經建立，直接返回
  if (transporter) {
    return transporter;
  }

  // 檢查環境變數
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 如果沒有設定，使用模擬模式
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('[Email] SMTP環境變數未設定，使用模擬模式');
    return null;
  }

  // 建立 transporter
  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log('[Email] SMTP transporter 已建立');
    return transporter;
  } catch (error) {
    console.error('[Email] 建立 SMTP transporter 失敗:', error);
    return null;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * 發送Email
 * 
 * 使用 Nodemailer + Gmail SMTP 發送Email
 * 如果 SMTP 未設定，則使用 console.log 模擬發送
 */
export async function sendEmail(
  options: EmailOptions,
  metadata?: {
    emailType: string;
    recipientName?: string;
    bookingId?: number;
    isTest?: boolean;
  }
): Promise<boolean> {
  const smtp = getTransporter();
  let success = false;
  let errorMessage: string | undefined;

  // 如果沒有 SMTP 設定，使用模擬模式
  if (!smtp) {
    console.log('=== 發送Email（模擬模式） ===');
    console.log('收件人:', options.to);
    console.log('主旨:', options.subject);
    console.log('內容:', options.text);
    console.log('================');
    success = true;
  } else {
    // 使用 SMTP 發送
    try {
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@taitung-disaster.gov.tw';
      
      await smtp.sendMail({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });

      console.log(`[Email] 成功發送Email給 ${options.to}`);
      success = true;
    } catch (error) {
      console.error('[Email] 發送Email失敗:', error);
      errorMessage = error instanceof Error ? error.message : String(error);
      success = false;
    }
  }

  // 記錄Email發送歷史
  if (metadata) {
    await logEmailSent({
      recipientEmail: options.to,
      recipientName: metadata.recipientName,
      subject: options.subject,
      emailType: metadata.emailType,
      status: success ? 'success' : 'failed',
      errorMessage,
      bookingId: metadata.bookingId,
      isTest: metadata.isTest || false,
    });
  }

  return success;
}

/**
 * 發送請假審核結果通知Email
 */
export async function sendLeaveRequestReviewEmail(
  recipientEmail: string,
  recipientName: string,
  requestType: 'leave' | 'swap',
  status: 'approved' | 'rejected',
  reviewNotes?: string
): Promise<boolean> {
  const typeText = requestType === 'leave' ? '請假' : '換班';
  const statusText = status === 'approved' ? '已核准' : '已拒絕';
  
  const subject = `【台東防災館】${typeText}申請${statusText}通知`;
  
  let text = `親愛的 ${recipientName}，您好：\n\n`;
  text += `您的${typeText}申請已經過審核，結果為：${statusText}\n\n`;
  
  if (reviewNotes) {
    text += status === 'approved' 
      ? `審核備註：${reviewNotes}\n\n`
      : `拒絕原因：${reviewNotes}\n\n`;
  }
  
  text += `如有任何疑問，請聯繫管理員。\n\n`;
  text += `此為系統自動發送的通知信件，請勿直接回覆。\n\n`;
  text += `台東防災館管理系統`;
  
  // HTML版本（選用）
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">台東防災館 - ${typeText}申請${statusText}通知</h2>
      <p>親愛的 <strong>${recipientName}</strong>，您好：</p>
      <p>您的${typeText}申請已經過審核，結果為：<strong style="color: ${status === 'approved' ? '#16a34a' : '#dc2626'}">${statusText}</strong></p>
      ${reviewNotes ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid ${status === 'approved' ? '#16a34a' : '#dc2626'}; margin: 20px 0;">
          <p style="margin: 0;"><strong>${status === 'approved' ? '審核備註' : '拒絕原因'}：</strong></p>
          <p style="margin: 5px 0 0 0;">${reviewNotes}</p>
        </div>
      ` : ''}
      <p>如有任何疑問，請聯繫管理員。</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">此為系統自動發送的通知信件，請勿直接回覆。</p>
      <p style="color: #6b7280; font-size: 12px;">台東防災館管理系統</p>
    </div>
  `;
  
  return await sendEmail(
    {
      to: recipientEmail,
      subject,
      text,
      html,
    },
    {
      emailType: 'leave_request_review',
      recipientName,
    }
  );
}

/**
 * 發送民眾預約確認Email
 */
export async function sendPublicBookingConfirmationEmail(
  recipientEmail: string,
  recipientName: string,
  bookingNumber: string,
  visitDate: string,
  visitTime: string,
  visitorCount: number,
  bookingId?: number,
  isTest?: boolean
): Promise<boolean> {
  const subject = `【台東防災館】預約確認通知 - 案件編號 ${bookingNumber}`;
  
  let text = `親愛的 ${recipientName}，您好：\n\n`;
  text += `感謝您預約台東防災館參訪服務，您的預約已經成功建立！\n\n`;
  text += `預約資訊：\n`;
  text += `案件編號：${bookingNumber}\n`;
  text += `參訪日期：${visitDate}\n`;
  text += `參訪時段：${visitTime}\n`;
  text += `參訪人數：${visitorCount}人\n\n`;
  text += `請於參訪當日提早10分鐘抵達，並出示此案件編號。\n\n`;
  text += `如需取消或變更預約，請至少於參訪日前3天聯繫我們。\n\n`;
  text += `聯繫資訊：\n`;
  text += `地址：台東市更生北路616巷9號\n`;
  text += `電話：(089) XXX-XXXX\n`;
  text += `Email: info@taitung-disaster.gov.tw\n\n`;
  text += `期待您的到訪！\n\n`;
  text += `此為系統自動發送的通知信件，請勿直接回覆。\n\n`;
  text += `台東防災館管理系統`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">台東防災館 - 預約確認通知</h2>
      <p>親愛的 <strong>${recipientName}</strong>，您好：</p>
      <p>感謝您預約台東防災館參訪服務，您的預約已經成功建立！</p>
      <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #16a34a; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #16a34a;">預約資訊</h3>
        <p style="margin: 5px 0;"><strong>案件編號：</strong> ${bookingNumber}</p>
        <p style="margin: 5px 0;"><strong>參訪日期：</strong> ${visitDate}</p>
        <p style="margin: 5px 0;"><strong>參訪時段：</strong> ${visitTime}</p>
        <p style="margin: 5px 0;"><strong>參訪人數：</strong> ${visitorCount}人</p>
      </div>
      <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <p style="margin: 0;"><strong>温馨提醒：</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>請於參訪當日提早10分鐘抵達</li>
          <li>請出示此案件編號：<strong>${bookingNumber}</strong></li>
          <li>如需取消或變更，請至少於參訪日前3天聯繫</li>
        </ul>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0;">聯繫資訊</h4>
        <p style="margin: 5px 0;">地址：台東市更生北路616巷9號</p>
        <p style="margin: 5px 0;">電話：(089) XXX-XXXX</p>
        <p style="margin: 5px 0;">Email: info@taitung-disaster.gov.tw</p>
      </div>
      <p>期待您的到訪！</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">此為系統自動發送的通知信件，請勿直接回覆。</p>
      <p style="color: #6b7280; font-size: 12px;">台東防災館管理系統</p>
    </div>
  `;
  
  return await sendEmail(
    {
      to: recipientEmail,
      subject,
      text,
      html,
    },
    {
      emailType: isTest ? 'test_public_booking_confirmation' : 'public_booking_confirmation',
      recipientName,
      bookingId,
      isTest: isTest || false,
    }
  );
}

/**
 * 發送團體預約確認Email
 */
export async function sendGroupBookingConfirmationEmail(
  recipientEmail: string,
  organizationName: string,
  contactPerson: string,
  bookingNumber: string,
  visitDate: string,
  visitTime: string,
  visitorCount: number,
  bookingId?: number,
  isTest?: boolean
): Promise<boolean> {
  const subject = `【台東防災館】團體預約確認通知 - 案件編號 ${bookingNumber}`;
  
  let text = `${organizationName} ${contactPerson}，您好：\n\n`;
  text += `感謝貴單位預約台東防災館團體參訪服務，您的預約已經成功建立！\n\n`;
  text += `預約資訊：\n`;
  text += `案件編號：${bookingNumber}\n`;
  text += `單位名稱：${organizationName}\n`;
  text += `聯絡人：${contactPerson}\n`;
  text += `參訪日期：${visitDate}\n`;
  text += `參訪時段：${visitTime}\n`;
  text += `參訪人數：${visitorCount}人\n\n`;
  text += `我們將為貴單位安排專業導覽員，請於參訪當日提早15分鐘抵達。\n\n`;
  text += `如需取消或變更預約，請至少於參訪日前7天聯繫我們。\n\n`;
  text += `聯繫資訊：\n`;
  text += `地址：台東市更生北路616巷9號\n`;
  text += `電話：(089) XXX-XXXX\n`;
  text += `Email: info@taitung-disaster.gov.tw\n\n`;
  text += `期待貴單位的到訪！\n\n`;
  text += `此為系統自動發送的通知信件，請勿直接回覆。\n\n`;
  text += `台東防災館管理系統`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">台東防災館 - 團體預約確認通知</h2>
      <p>${organizationName} <strong>${contactPerson}</strong>，您好：</p>
      <p>感謝貴單位預約台東防災館團體參訪服務，您的預約已經成功建立！</p>
      <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #16a34a; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #16a34a;">預約資訊</h3>
        <p style="margin: 5px 0;"><strong>案件編號：</strong> ${bookingNumber}</p>
        <p style="margin: 5px 0;"><strong>單位名稱：</strong> ${organizationName}</p>
        <p style="margin: 5px 0;"><strong>聯絡人：</strong> ${contactPerson}</p>
        <p style="margin: 5px 0;"><strong>參訪日期：</strong> ${visitDate}</p>
        <p style="margin: 5px 0;"><strong>參訪時段：</strong> ${visitTime}</p>
        <p style="margin: 5px 0;"><strong>參訪人數：</strong> ${visitorCount}人</p>
      </div>
      <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <p style="margin: 0;"><strong>温馨提醒：</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>我們將為貴單位安排專業導覽員</li>
          <li>請於參訪當日提早15分鐘抵達</li>
          <li>請出示此案件編號：<strong>${bookingNumber}</strong></li>
          <li>如需取消或變更，請至少於參訪日前7天聯繫</li>
        </ul>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0;">聯繫資訊</h4>
        <p style="margin: 5px 0;">地址：台東市更生北路616巷9號</p>
        <p style="margin: 5px 0;">電話：(089) XXX-XXXX</p>
        <p style="margin: 5px 0;">Email: info@taitung-disaster.gov.tw</p>
      </div>
      <p>期待貴單位的到訪！</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">此為系統自動發送的通知信件，請勿直接回覆。</p>
      <p style="color: #6b7280; font-size: 12px;">台東防災館管理系統</p>
    </div>
  `;
  
  return await sendEmail(
    {
      to: recipientEmail,
      subject,
      text,
      html,
    },
    {
      emailType: isTest ? 'test_group_booking_confirmation' : 'group_booking_confirmation',
      recipientName: contactPerson,
      bookingId,
      isTest: isTest || false,
    }
  );
}

/**
 * 發送參訪提醒Email（民眾預約）
 */
export async function sendPublicBookingReminderEmail(
  recipientEmail: string,
  recipientName: string,
  bookingNumber: string,
  visitDate: string,
  visitTime: string,
  visitorCount: number,
  bookingId?: number,
  isTest?: boolean
): Promise<boolean> {
  const subject = `【台東防災館】參訪提醒 - 案件編號 ${bookingNumber}`;
  
  let text = `親愛的 ${recipientName}，您好：\n\n`;
  text += `提醒您，您預約的台東防災館參訪將於3天後進行！\n\n`;
  text += `預約資訊：\n`;
  text += `案件編號：${bookingNumber}\n`;
  text += `參訪日期：${visitDate}\n`;
  text += `參訪時段：${visitTime}\n`;
  text += `參訪人數：${visitorCount}人\n\n`;
  text += `參訪前準備事項：\n`;
  text += `1. 請於參訪當日提早10分鐘抵達\n`;
  text += `2. 請攜帶有效證件以便驗證身份\n`;
  text += `3. 請出示此案件編號：${bookingNumber}\n`;
  text += `4. 建議穿著輕便服裝和運動鞋\n\n`;
  text += `如需取消預約，請盡快聯繫我們。\n\n`;
  text += `聯繫資訊：\n`;
  text += `地址：台東市更生北路616巷9號\n`;
  text += `電話：(089) XXX-XXXX\n`;
  text += `Email: info@taitung-disaster.gov.tw\n\n`;
  text += `期待您的到訪！\n\n`;
  text += `此為系統自動發送的提醒信件，請勿直接回覆。\n\n`;
  text += `台東防災館管理系統`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">台東防災館 - 參訪提醒</h2>
      <p>親愛的 <strong>${recipientName}</strong>，您好：</p>
      <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>⚠️ 提醒：您預約的參訪將於3天後進行！</strong></p>
      </div>
      <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #16a34a; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #16a34a;">預約資訊</h3>
        <p style="margin: 5px 0;"><strong>案件編號：</strong> ${bookingNumber}</p>
        <p style="margin: 5px 0;"><strong>參訪日期：</strong> ${visitDate}</p>
        <p style="margin: 5px 0;"><strong>參訪時段：</strong> ${visitTime}</p>
        <p style="margin: 5px 0;"><strong>參訪人數：</strong> ${visitorCount}人</p>
      </div>
      <div style="background-color: #eff6ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #3b82f6;">參訪前準備事項</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>請於參訪當日提早10分鐘抵達</li>
          <li>請攜帶有效證件以便驗證身份</li>
          <li>請出示此案件編號：<strong>${bookingNumber}</strong></li>
          <li>建議穿著輕便服裝和運動鞋</li>
        </ul>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #dc2626;"><strong>重要提醒：</strong>如需取消預約，請盡快聯繫我們。</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0;">聯繫資訊</h4>
        <p style="margin: 5px 0;">地址：台東市更生北路616巷9號</p>
        <p style="margin: 5px 0;">電話：(089) XXX-XXXX</p>
        <p style="margin: 5px 0;">Email: info@taitung-disaster.gov.tw</p>
      </div>
      <p>期待您的到訪！</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">此為系統自動發送的提醒信件，請勿直接回覆。</p>
      <p style="color: #6b7280; font-size: 12px;">台東防災館管理系統</p>
    </div>
  `;
  
  return await sendEmail(
    {
      to: recipientEmail,
      subject,
      text,
      html,
    },
    {
      emailType: isTest ? 'test_public_booking_reminder' : 'public_booking_reminder',
      recipientName,
      bookingId,
      isTest: isTest || false,
    }
  );
}

/**
 * 發送參訪提醒Email（團體預約）
 */
export async function sendGroupBookingReminderEmail(
  recipientEmail: string,
  organizationName: string,
  contactPerson: string,
  bookingNumber: string,
  visitDate: string,
  visitTime: string,
  visitorCount: number,
  bookingId?: number,
  isTest?: boolean
): Promise<boolean> {
  const subject = `【台東防災館】團體參訪提醒 - 案件編號 ${bookingNumber}`;
  
  let text = `${organizationName} ${contactPerson}，您好：\n\n`;
  text += `提醒貴單位，預約的台東防災館團體參訪將於3天後進行！\n\n`;
  text += `預約資訊：\n`;
  text += `案件編號：${bookingNumber}\n`;
  text += `單位名稱：${organizationName}\n`;
  text += `聯絡人：${contactPerson}\n`;
  text += `參訪日期：${visitDate}\n`;
  text += `參訪時段：${visitTime}\n`;
  text += `參訪人數：${visitorCount}人\n\n`;
  text += `參訪前準備事項：\n`;
  text += `1. 我們已為貴單位安排專業導覽員\n`;
  text += `2. 請於參訪當日提早15分鐘抵達\n`;
  text += `3. 請出示此案件編號：${bookingNumber}\n`;
  text += `4. 請提醒學生/成員攜帶有效證件\n`;
  text += `5. 建議穿著輕便服裝和運動鞋\n`;
  text += `6. 若有特殊需求，請提前告知\n\n`;
  text += `如需取消預約，請盡快聯繫我們。\n\n`;
  text += `聯繫資訊：\n`;
  text += `地址：台東市更生北路616巷9號\n`;
  text += `電話：(089) XXX-XXXX\n`;
  text += `Email: info@taitung-disaster.gov.tw\n\n`;
  text += `期待貴單位的到訪！\n\n`;
  text += `此為系統自動發送的提醒信件，請勿直接回覆。\n\n`;
  text += `台東防災館管理系統`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">台東防災館 - 團體參訪提醒</h2>
      <p>${organizationName} <strong>${contactPerson}</strong>，您好：</p>
      <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>⚠️ 提醒：貴單位預約的參訪將於3天後進行！</strong></p>
      </div>
      <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #16a34a; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #16a34a;">預約資訊</h3>
        <p style="margin: 5px 0;"><strong>案件編號：</strong> ${bookingNumber}</p>
        <p style="margin: 5px 0;"><strong>單位名稱：</strong> ${organizationName}</p>
        <p style="margin: 5px 0;"><strong>聯絡人：</strong> ${contactPerson}</p>
        <p style="margin: 5px 0;"><strong>參訪日期：</strong> ${visitDate}</p>
        <p style="margin: 5px 0;"><strong>參訪時段：</strong> ${visitTime}</p>
        <p style="margin: 5px 0;"><strong>參訪人數：</strong> ${visitorCount}人</p>
      </div>
      <div style="background-color: #eff6ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #3b82f6;">參訪前準備事項</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>我們已為貴單位安排專業導覽員</li>
          <li>請於參訪當日提早15分鐘抵達</li>
          <li>請出示此案件編號：<strong>${bookingNumber}</strong></li>
          <li>請提醒學生/成員攜帶有效證件</li>
          <li>建議穿著輕便服裝和運動鞋</li>
          <li>若有特殊需求，請提前告知</li>
        </ul>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #dc2626;"><strong>重要提醒：</strong>如需取消預約，請盡快聯繫我們。</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0;">聯繫資訊</h4>
        <p style="margin: 5px 0;">地址：台東市更生北路616巷9號</p>
        <p style="margin: 5px 0;">電話：(089) XXX-XXXX</p>
        <p style="margin: 5px 0;">Email: info@taitung-disaster.gov.tw</p>
      </div>
      <p>期待貴單位的到訪！</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">此為系統自動發送的提醒信件，請勿直接回覆。</p>
      <p style="color: #6b7280; font-size: 12px;">台東防災館管理系統</p>
    </div>
  `;
  
  return await sendEmail(
    {
      to: recipientEmail,
      subject,
      text,
      html,
    },
    {
      emailType: isTest ? 'test_group_booking_reminder' : 'group_booking_reminder',
      recipientName: contactPerson,
      bookingId,
      isTest: isTest || false,
    }
  );
}

export async function sendNewLeaveRequestEmail(
  adminEmail: string,
  volunteerName: string,
  requestType: 'leave' | 'swap',
  reason: string
): Promise<boolean> {
  const typeText = requestType === 'leave' ? '請假' : '換班';
  
  const subject = `【台東防災館】新的${typeText}申請待審核`;
  
  let text = `管理員，您好：\n\n`;
  text += `志工 ${volunteerName} 提交了一筆新的${typeText}申請，請盡快審核。\n\n`;
  text += `申請原因：${reason}\n\n`;
  text += `請登入管理後台查看詳細資訊並進行審核。\n\n`;
  text += `台東防災館管理系統`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">台東防災館 - 新的${typeText}申請待審核</h2>
      <p>管理員，您好：</p>
      <p>志工 <strong>${volunteerName}</strong> 提交了一筆新的${typeText}申請，請盡快審核。</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
        <p style="margin: 0;"><strong>申請原因：</strong></p>
        <p style="margin: 5px 0 0 0;">${reason}</p>
      </div>
      <p>請登入管理後台查看詳細資訊並進行審核。</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">台東防災館管理系統</p>
    </div>
  `;
  
  return await sendEmail(
    {
      to: adminEmail,
      subject,
      text,
      html,
    },
    {
      emailType: 'new_leave_request',
      recipientName: 'Admin',
    }
  );
}
