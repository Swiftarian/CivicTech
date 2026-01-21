import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-test-user",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("news API", () => {
  it("should create a news item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const newsData = {
      title: "測試新聞",
      content: "這是測試新聞內容",
      summary: "測試摘要",
      coverImage: "https://example.com/image.jpg",
      category: "防災宣導" as const,
      isPublished: true,
    };

    const result = await caller.news.create(newsData);

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.title).toBe(newsData.title);
    expect(result.content).toBe(newsData.content);
    expect(result.category).toBe(newsData.category);
    expect(result.isPublished).toBe(true);
  });

  it("should get published news only", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建一則已發布的新聞
    await caller.news.create({
      title: "已發布新聞",
      content: "內容",
      summary: "",
      coverImage: "",
      category: "活動公告",
      isPublished: true,
    });

    // 創建一則未發布的新聞
    await caller.news.create({
      title: "草稿新聞",
      content: "內容",
      summary: "",
      coverImage: "",
      category: "其他",
      isPublished: false,
    });

    const publishedNews = await caller.news.getPublished({ limit: 10 });

    expect(publishedNews).toBeDefined();
    expect(Array.isArray(publishedNews)).toBe(true);
    // 所有返回的新聞都應該是已發布狀態
    publishedNews.forEach(news => {
      expect(news.isPublished).toBe(true);
    });
  });

  it("should update news item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建新聞
    const created = await caller.news.create({
      title: "原標題",
      content: "原內容",
      summary: "",
      coverImage: "",
      category: "其他",
      isPublished: false,
    });

    // 更新新聞
    const updated = await caller.news.update({
      id: created.id,
      title: "新標題",
      content: "新內容",
      summary: "新摘要",
      coverImage: "https://example.com/new.jpg",
      category: "新聞稿",
      isPublished: true,
    });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("新標題");
    expect(updated.content).toBe("新內容");
    expect(updated.summary).toBe("新摘要");
    expect(updated.category).toBe("新聞稿");
    expect(updated.isPublished).toBe(true);
  });

  it("should delete news item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建新聞
    const created = await caller.news.create({
      title: "待刪除新聞",
      content: "內容",
      summary: "",
      coverImage: "",
      category: "其他",
      isPublished: false,
    });

    // 刪除新聞
    const result = await caller.news.delete({ id: created.id });

    expect(result.success).toBe(true);

    // 驗證已刪除
    const allNews = await caller.news.getAll();
    const deletedNews = allNews.find(n => n.id === created.id);
    expect(deletedNews).toBeUndefined();
  });

  it("should increment view count", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建新聞
    const created = await caller.news.create({
      title: "測試瀏覽次數",
      content: "內容",
      summary: "",
      coverImage: "",
      category: "其他",
      isPublished: true,
    });

    expect(created.viewCount).toBe(0);

    // 增加瀏覽次數
    await caller.news.incrementViewCount({ id: created.id });

    // 獲取更新後的新聞
    const allNews = await caller.news.getAll();
    const updated = allNews.find(n => n.id === created.id);

    expect(updated).toBeDefined();
    expect(updated!.viewCount).toBe(1);
  });
});
