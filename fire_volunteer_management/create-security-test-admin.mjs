/**
 * 建立資安掃描測試用管理員帳號
 *
 * 使用方式：
 * node create-security-test-admin.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { users } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function createSecurityTestAdmin() {
  console.log("=".repeat(60));
  console.log("🔐 建立資安掃描測試用管理員帳號");
  console.log("=".repeat(60));

  const testAdmin = {
    openId: "security-test-admin-001",
    name: "資安測試管理員",
    email: "security-test@taitung-disaster.tw",
    loginMethod: "manual",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  try {
    // 檢查是否已存在
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.openId, testAdmin.openId))
      .limit(1);

    if (existing.length > 0) {
      console.log("⚠️  測試帳號已存在，跳過建立");
      console.log(`帳號: ${testAdmin.email}`);
      console.log(`角色: ${testAdmin.role}`);
      return;
    }

    // 建立測試帳號
    await db.insert(users).values(testAdmin);

    console.log("✅ 測試帳號建立成功！");
    console.log("");
    console.log("📋 帳號資訊：");
    console.log(`Email: ${testAdmin.email}`);
    console.log(`姓名: ${testAdmin.name}`);
    console.log(`角色: ${testAdmin.role}`);
    console.log(`OpenID: ${testAdmin.openId}`);
    console.log("");
    console.log("⚠️  注意：此帳號僅供資安掃描測試使用");
    console.log("");
  } catch (error) {
    console.error("❌ 建立測試帳號失敗:", error);
    throw error;
  }

  console.log("=".repeat(60));
}

createSecurityTestAdmin()
  .then(() => {
    console.log("完成！");
    process.exit(0);
  })
  .catch(error => {
    console.error("執行失敗:", error);
    process.exit(1);
  });
