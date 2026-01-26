import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import { getUserByOpenId } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 嘗試使用Manus SDK認證
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Manus認證失敗，嘗試JWT token認證（用於Google OAuth）
    try {
      const token = opts.req.cookies?.[COOKIE_NAME];
      if (token) {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(
          token,
          process.env.JWT_SECRET || "test-secret"
        ) as { openId: string };

        if (decoded.openId) {
          const foundUser = await getUserByOpenId(decoded.openId);
          user = foundUser || null;
        }
      }
    } catch (jwtError) {
      // JWT認證也失敗，嘗試解析測試登入的 JSON 格式 cookie
      try {
        const token = opts.req.cookies?.[COOKIE_NAME];
        if (token) {
          const testUser = JSON.parse(token);
          // 驗證資料結構
          if (testUser && testUser.id && testUser.email && testUser.role) {
            // 將測試使用者資料轉換為 User 格式
            user = {
              id: testUser.id,
              email: testUser.email,
              name: testUser.name,
              role: testUser.role,
              openId: testUser.email, // 使用 email 作為 openId
              createdAt: new Date(),
              updatedAt: new Date(),
            } as User;
          }
        }
      } catch (parseError) {
        // 解析測試登入 cookie 也失敗，用戶未登入
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
