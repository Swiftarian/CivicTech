import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { volunteers, users } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function fixVolunteerUsers() {
  console.log("開始清理志工使用者關聯...");

  // 1. 查詢所有關聯到EDDIE LIN的志工
  const eddieUser = await db
    .select()
    .from(users)
    .where(eq(users.name, "EDDIE LIN"))
    .limit(1);
  if (eddieUser.length === 0) {
    console.log("找不到EDDIE LIN使用者");
    return;
  }

  const eddieUserId = eddieUser[0].id;
  console.log(`EDDIE LIN使用者ID: ${eddieUserId}`);

  const volunteersWithEddie = await db
    .select()
    .from(volunteers)
    .where(eq(volunteers.userId, eddieUserId));
  console.log(`找到${volunteersWithEddie.length}個關聯到EDDIE LIN的志工`);

  // 2. 為每個志工建立獨立的使用者帳號
  for (const volunteer of volunteersWithEddie) {
    // 檢查是否已經有獨立的使用者帳號
    const openId = `volunteer-${volunteer.id}-${Date.now()}`;
    const email = `volunteer${volunteer.id}@taitung-disaster.local`;

    console.log(
      `為志工 ${volunteer.employeeId || volunteer.id} 建立使用者帳號...`
    );

    // 建立新的使用者帳號
    const [newUser] = await db.insert(users).values({
      openId,
      name: volunteer.employeeId || `志工${volunteer.id}`,
      email,
      loginMethod: "manus",
      role: "user",
    });

    // 更新志工記錄關聯到新的使用者
    await db
      .update(volunteers)
      .set({ userId: newUser.insertId })
      .where(eq(volunteers.id, volunteer.id));

    console.log(
      `✓ 志工 ${volunteer.employeeId || volunteer.id} 已關聯到新使用者 (ID: ${newUser.insertId})`
    );
  }

  console.log("清理完成！");
}

fixVolunteerUsers()
  .catch(console.error)
  .finally(() => process.exit(0));
