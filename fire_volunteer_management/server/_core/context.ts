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
    // Manus認證失敗，嘗試測試登入JWT token
    if (process.env.ENABLE_TEST_LOGIN === "true") {
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
        // JWT認證也失敗，用戶未登入
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
