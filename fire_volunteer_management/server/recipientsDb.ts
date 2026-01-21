/**
 * 收餐人資料庫操作模組
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  recipients,
  type Recipient,
  type InsertRecipient,
} from "../drizzle/schema";

/**
 * 建立新的收餐人記錄
 */
export async function createRecipient(
  data: InsertRecipient
): Promise<Recipient | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return null;
  }

  try {
    const result = await db.insert(recipients).values(data);
    const insertId = Number(result[0].insertId);

    const newRecipient = await db
      .select()
      .from(recipients)
      .where(eq(recipients.id, insertId))
      .limit(1);

    return newRecipient[0] || null;
  } catch (error) {
    console.error("[Recipients DB] Error creating recipient:", error);
    return null;
  }
}

/**
 * 根據電話號碼查詢收餐人
 */
export async function getRecipientByPhone(
  phone: string
): Promise<Recipient | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(recipients)
      .where(eq(recipients.phone, phone))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Recipients DB] Error getting recipient by phone:", error);
    return null;
  }
}

/**
 * 根據LINE User ID查詢收餐人
 */
export async function getRecipientByLineUserId(
  lineUserId: string
): Promise<Recipient | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(recipients)
      .where(eq(recipients.lineUserId, lineUserId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error(
      "[Recipients DB] Error getting recipient by LINE user ID:",
      error
    );
    return null;
  }
}

/**
 * 更新收餐人的LINE綁定資訊
 */
export async function updateRecipientLineBinding(
  recipientId: number,
  lineUserId: string,
  lineDisplayName: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return false;
  }

  try {
    await db
      .update(recipients)
      .set({
        lineUserId,
        lineDisplayName,
        lineAuthorizedAt: new Date(),
        preferredNotificationMethod: "line",
      })
      .where(eq(recipients.id, recipientId));

    console.log(
      `[Recipients DB] Updated LINE binding for recipient ${recipientId}`
    );
    return true;
  } catch (error) {
    console.error("[Recipients DB] Error updating LINE binding:", error);
    return false;
  }
}

/**
 * 清除收餐人的LINE綁定
 */
export async function clearRecipientLineBinding(
  recipientId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return false;
  }

  try {
    await db
      .update(recipients)
      .set({
        lineUserId: null,
        lineDisplayName: null,
        lineAuthorizedAt: null,
        preferredNotificationMethod: "sms",
      })
      .where(eq(recipients.id, recipientId));

    console.log(
      `[Recipients DB] Cleared LINE binding for recipient ${recipientId}`
    );
    return true;
  } catch (error) {
    console.error("[Recipients DB] Error clearing LINE binding:", error);
    return false;
  }
}

/**
 * 取得所有收餐人列表
 */
export async function getAllRecipients(): Promise<Recipient[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return [];
  }

  try {
    const result = await db.select().from(recipients);
    return result;
  } catch (error) {
    console.error("[Recipients DB] Error getting all recipients:", error);
    return [];
  }
}

/**
 * 更新收餐人資訊
 */
export async function updateRecipient(
  recipientId: number,
  data: Partial<InsertRecipient>
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return false;
  }

  try {
    await db.update(recipients).set(data).where(eq(recipients.id, recipientId));

    console.log(`[Recipients DB] Updated recipient ${recipientId}`);
    return true;
  } catch (error) {
    console.error("[Recipients DB] Error updating recipient:", error);
    return false;
  }
}

/**
 * 刪除收餐人
 */
export async function deleteRecipient(recipientId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Recipients DB] Database not available");
    return false;
  }

  try {
    await db.delete(recipients).where(eq(recipients.id, recipientId));
    console.log(`[Recipients DB] Deleted recipient ${recipientId}`);
    return true;
  } catch (error) {
    console.error("[Recipients DB] Error deleting recipient:", error);
    return false;
  }
}
