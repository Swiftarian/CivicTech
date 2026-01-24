import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): { ctx: TrpcContext; cookies: Map<string, any> } {
  const cookies = new Map<string, any>();

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: any, options: any) => {
        cookies.set(name, { value, options });
      },
      clearCookie: (name: string) => {
        cookies.delete(name);
      },
    } as TrpcContext["res"],
  };

  return { ctx, cookies };
}

describe("測試專用登入功能", () => {
  it("應該能夠使用測試帳號1登入", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.testLogin({
      email: "jacky.hsieh@insight.ntu.edu.tw",
      password: process.env.TEST_ADMIN_PASSWORD || "admin-password-placeholder",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("jacky.hsieh@insight.ntu.edu.tw");
    expect(result.user.role).toBe("admin");

    // 檢查是否設定了session cookie
    expect(cookies.has("app_session_id")).toBe(true);

    console.log("✅ 測試帳號1登入成功");
    console.log(`   Email: ${result.user.email}`);
    console.log(`   角色: ${result.user.role}`);
  });

  it("應該能夠使用測試帳號2登入", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.testLogin({
      email: "chelsea.juan@udngroup.com.tw",
      password: process.env.TEST_ADMIN_PASSWORD || "admin-password-placeholder",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("chelsea.juan@udngroup.com.tw");
    expect(result.user.role).toBe("admin");

    // 檢查是否設定了session cookie
    expect(cookies.has("app_session_id")).toBe(true);

    console.log("✅ 測試帳號2登入成功");
    console.log(`   Email: ${result.user.email}`);
    console.log(`   角色: ${result.user.role}`);
  });

  it("應該拒絕錯誤的密碼", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.testLogin({
        email: "jacky.hsieh@insight.ntu.edu.tw",
        password: "WrongPassword123!",
      })
    ).rejects.toThrow("帳號或密碼錯誤");

    console.log("✅ 正確拒絕錯誤密碼");
  });

  it("應該拒絕不存在的帳號", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.testLogin({
        email: "nonexistent@example.com",
        password:
          process.env.TEST_ADMIN_PASSWORD || "admin-password-placeholder",
      })
    ).rejects.toThrow("帳號或密碼錯誤");

    console.log("✅ 正確拒絕不存在的帳號");
  });
});
