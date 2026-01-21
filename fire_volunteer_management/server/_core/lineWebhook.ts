/**
 * LINE Webhook 處理模組
 * 
 * 處理LINE平台發送的webhook事件，例如：
 * - 使用者加入好友
 * - 使用者封鎖機器人
 * - 使用者發送訊息
 */

import type { Request, Response } from "express";
import { verifyLineSignature, replyLineMessage, getLineUserProfile, createWelcomeMessage } from "./lineMessaging";
import { getDb } from "../db";
import { recipients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  source?: {
    type: string;
    userId?: string;
  };
  timestamp?: number;
  [key: string]: unknown;
}

interface LineWebhookRequest {
  destination?: string;
  events: LineWebhookEvent[];
}

/**
 * 處理LINE webhook請求
 */
export async function handleLineWebhook(req: Request, res: Response): Promise<void> {
  try {
    // 驗證簽名
    const signature = req.headers["x-line-signature"] as string;
    const body = JSON.stringify(req.body);

    if (!signature || !verifyLineSignature(body, signature)) {
      console.error("[LINE Webhook] Invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const webhookRequest = req.body as LineWebhookRequest;
    const events = webhookRequest.events || [];

    console.log(`[LINE Webhook] Received ${events.length} events`);

    // 處理每個事件
    for (const event of events) {
      await handleLineEvent(event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[LINE Webhook] Error handling webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * 處理單個LINE事件
 */
async function handleLineEvent(event: LineWebhookEvent): Promise<void> {
  console.log(`[LINE Webhook] Processing event type: ${event.type}`);

  switch (event.type) {
    case "follow":
      await handleFollowEvent(event);
      break;
    case "unfollow":
      await handleUnfollowEvent(event);
      break;
    case "message":
      await handleMessageEvent(event);
      break;
    default:
      console.log(`[LINE Webhook] Unhandled event type: ${event.type}`);
  }
}

/**
 * 處理使用者加入好友事件
 */
async function handleFollowEvent(event: LineWebhookEvent): Promise<void> {
  try {
    const userId = event.source?.userId;
    if (!userId) {
      console.error("[LINE Webhook] Follow event missing userId");
      return;
    }

    console.log(`[LINE Webhook] User ${userId} followed the bot`);

    // 取得使用者資料
    const profileResult = await getLineUserProfile(userId);
    if (!profileResult.success || !profileResult.profile) {
      console.error("[LINE Webhook] Failed to get user profile");
      return;
    }

    const { displayName } = profileResult.profile;

    // 檢查資料庫中是否已有此使用者的電話記錄
    // 注意：此時我們還不知道使用者的電話號碼
    // 需要管理員在後台手動綁定LINE User ID到收餐人記錄

    console.log(`[LINE Webhook] User profile: ${displayName} (${userId})`);

    // 發送歡迎訊息
    if (event.replyToken) {
      await replyLineMessage(event.replyToken, createWelcomeMessage());
    }
  } catch (error) {
    console.error("[LINE Webhook] Error handling follow event:", error);
  }
}

/**
 * 處理使用者封鎖機器人事件
 */
async function handleUnfollowEvent(event: LineWebhookEvent): Promise<void> {
  try {
    const userId = event.source?.userId;
    if (!userId) {
      console.error("[LINE Webhook] Unfollow event missing userId");
      return;
    }

    console.log(`[LINE Webhook] User ${userId} unfollowed the bot`);

    // 更新資料庫中的收餐人記錄，清除LINE綁定
    const db = await getDb();
    if (!db) {
      console.warn("[LINE Webhook] Database not available");
      return;
    }

    await db
      .update(recipients)
      .set({
        lineUserId: null,
        lineDisplayName: null,
        lineAuthorizedAt: null,
        preferredNotificationMethod: "sms",
      })
      .where(eq(recipients.lineUserId, userId));

    console.log(`[LINE Webhook] Cleared LINE binding for user ${userId}`);
  } catch (error) {
    console.error("[LINE Webhook] Error handling unfollow event:", error);
  }
}

/**
 * 處理使用者發送訊息事件
 */
async function handleMessageEvent(event: LineWebhookEvent): Promise<void> {
  try {
    const userId = event.source?.userId;
    if (!userId || !event.replyToken) {
      return;
    }

    console.log(`[LINE Webhook] Received message from user ${userId}`);

    // 簡單的自動回覆
    await replyLineMessage(event.replyToken, [
      {
        type: "text",
        text: "感謝您的訊息！\n\n如需協助，請聯絡我們：\n電話：(089)334547、348138",
      },
    ]);
  } catch (error) {
    console.error("[LINE Webhook] Error handling message event:", error);
  }
}
