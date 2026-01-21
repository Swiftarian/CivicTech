/**
 * LINE Messaging API 整合模組
 * 
 * 提供發送LINE訊息、處理webhook事件等功能
 */

interface LineMessage {
  type: string;
  text?: string;
  [key: string]: unknown;
}

interface LinePushMessageRequest {
  to: string;
  messages: LineMessage[];
}

interface LineReplyMessageRequest {
  replyToken: string;
  messages: LineMessage[];
}

/**
 * 發送LINE推播訊息給指定使用者
 */
export async function sendLineMessage(
  userId: string,
  messages: LineMessage[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error("[LINE] Channel Access Token not configured");
      return { success: false, error: "LINE credentials not configured" };
    }

    const body: LinePushMessageRequest = {
      to: userId,
      messages,
    };

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LINE] Failed to send message:", errorText);
      return { success: false, error: errorText };
    }

    console.log(`[LINE] Message sent successfully to user: ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("[LINE] Error sending message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 回覆LINE訊息（用於webhook事件）
 */
export async function replyLineMessage(
  replyToken: string,
  messages: LineMessage[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error("[LINE] Channel Access Token not configured");
      return { success: false, error: "LINE credentials not configured" };
    }

    const body: LineReplyMessageRequest = {
      replyToken,
      messages,
    };

    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LINE] Failed to reply message:", errorText);
      return { success: false, error: errorText };
    }

    console.log("[LINE] Reply sent successfully");
    return { success: true };
  } catch (error) {
    console.error("[LINE] Error replying message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 取得LINE使用者資料
 */
export async function getLineUserProfile(
  userId: string
): Promise<{ success: boolean; profile?: { displayName: string; userId: string; pictureUrl?: string }; error?: string }> {
  try {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error("[LINE] Channel Access Token not configured");
      return { success: false, error: "LINE credentials not configured" };
    }

    // Validate userId to prevent SSRF attacks
    // LINE User IDs are alphanumeric strings (typically 33 characters)
    if (!userId || !/^[a-zA-Z0-9]+$/.test(userId) || userId.length > 50) {
      console.error("[LINE] Invalid userId format");
      return { success: false, error: "Invalid userId format" };
    }

    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LINE] Failed to get user profile:", errorText);
      return { success: false, error: errorText };
    }

    const profile = await response.json();
    console.log(`[LINE] User profile retrieved: ${profile.displayName}`);
    return { success: true, profile };
  } catch (error) {
    console.error("[LINE] Error getting user profile:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 驗證LINE webhook簽名
 */
export function verifyLineSignature(
  body: string,
  signature: string
): boolean {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    
    if (!channelSecret) {
      console.error("[LINE] Channel Secret not configured");
      return false;
    }

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha256", channelSecret)
      .update(body)
      .digest("base64");

    return hash === signature;
  } catch (error) {
    console.error("[LINE] Error verifying signature:", error);
    return false;
  }
}

/**
 * 建立送餐通知訊息
 */
export function createDeliveryNotificationMessage(
  recipientName: string,
  deliveryDate: string,
  deliveryTime: string,
  confirmUrl: string
): LineMessage[] {
  return [
    {
      type: "text",
      text: `${recipientName} 您好！\n\n您的餐點預計於 ${deliveryDate} ${deliveryTime} 送達。\n\n請點擊以下連結確認收餐：\n${confirmUrl}\n\n※ 此連結僅在送達後30分鐘內有效\n※ 請確認您在送餐地址附近再點擊連結`,
    },
  ];
}

/**
 * 建立歡迎訊息
 */
export function createWelcomeMessage(): LineMessage[] {
  return [
    {
      type: "text",
      text: "歡迎加入台東防災館送餐服務！\n\n您將會收到送餐通知訊息。\n\n如有任何問題，請聯絡我們：\n電話：(089)334547、348138",
    },
  ];
}

/**
 * 建立志工任務指派通知訊息
 */
export function createVolunteerTaskAssignmentMessage(
  volunteerName: string,
  recipientName: string,
  deliveryAddress: string,
  deliveryDate: string,
  deliveryTime: string,
  deliveryNumber: string
): LineMessage[] {
  return [
    {
      type: "text",
      text: `${volunteerName} 您好！\n\n您有新的送餐任務：\n\n📦 送餐編號：${deliveryNumber}\n👤 收餐人：${recipientName}\n📍 送餐地址：${deliveryAddress}\n📅 送餐日期：${deliveryDate}\n⏰ 送餐時間：${deliveryTime}\n\n請登入系統查看詳細資訊並開始配送。\n\n※ 請準時送達\n※ 送達後請協助收餐人確認收餐`,
    },
  ];
}
