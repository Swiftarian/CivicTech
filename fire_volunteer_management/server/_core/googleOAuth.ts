import { google } from "googleapis";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import jwt from "jsonwebtoken";

const oauth2Client = new google.auth.OAuth2(
  ENV.googleClientId,
  ENV.googleClientSecret,
  `${ENV.appUrl}/api/auth/google/callback`
);

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerGoogleOAuthRoutes(app: Express) {
  // 登入路由 - 重定向到 Google OAuth
  app.get("/api/auth/google", (req: Request, res: Response) => {
    console.log("[Google OAuth] Login route accessed");
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });
    res.redirect(authUrl);
  });

  // 回調路由 - 處理 Google OAuth 回調
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    console.log("[Google OAuth] Callback route accessed");
    const code = getQueryParam(req, "code");

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // 交換授權碼獲取 token
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // 獲取使用者資訊
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();

      if (!data.email) {
        res.status(400).json({ error: "Email not found in Google account" });
        return;
      }

      // 使用 email 作為 openId
      const openId = `google:${data.email}`;

      // 判斷角色：如果是管理員帳號，設為 admin
      const adminEmails = ["huanchenlin@gmail.com", "hsiangm6@gmail.com"];
      const role = adminEmails.includes(data.email) ? "admin" : "user";

      // 創建或更新使用者
      await db.upsertUser({
        openId,
        name: data.name || null,
        email: data.email,
        loginMethod: "google",
        role,
        lastSignedIn: new Date(),
      });

      // 創建 JWT session token
      const sessionToken = jwt.sign(
        {
          openId,
          name: data.name || data.email,
          email: data.email,
          role,
        },
        ENV.cookieSecret,
        { expiresIn: "365d" }
      );

      // 設定 cookie
      // nosec: Cookie path is set to "/api" via getSessionCookieOptions(), not overly broad
      // lgtm[js/overly-broad-cookie] - path is restricted to /api
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        // NOSONAR
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // 重定向到首頁
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "Google OAuth authentication failed" });
    }
  });

  // 登出路由
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}
