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

describe("gallery API", () => {
  it("should create a gallery item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const galleryData = {
      title: "測試照片",
      description: "這是測試照片描述",
      imageUrl: "https://example.com/photo.jpg",
      category: "活動花絮" as const,
      isPublished: true,
      displayOrder: 10,
    };

    const result = await caller.gallery.create(galleryData);

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.title).toBe(galleryData.title);
    expect(result.description).toBe(galleryData.description);
    expect(result.imageUrl).toBe(galleryData.imageUrl);
    expect(result.category).toBe(galleryData.category);
    expect(result.isPublished).toBe(true);
    expect(result.displayOrder).toBe(10);
  });

  it("should get published gallery items only", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建已發布照片
    await caller.gallery.create({
      title: "已發布照片",
      description: "描述",
      imageUrl: "https://example.com/published.jpg",
      category: "設施環境",
      isPublished: true,
      displayOrder: 0,
    });

    // 創建未發布照片
    await caller.gallery.create({
      title: "未發布照片",
      description: "描述",
      imageUrl: "https://example.com/unpublished.jpg",
      category: "其他",
      isPublished: false,
      displayOrder: 0,
    });

    const publishedGallery = await caller.gallery.getPublished({ limit: 10 });

    expect(publishedGallery).toBeDefined();
    expect(Array.isArray(publishedGallery)).toBe(true);
    // 所有返回的照片都應該是已發布狀態
    publishedGallery.forEach((item) => {
      expect(item.isPublished).toBe(true);
    });
  });

  it("should sort by displayOrder descending", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建多張照片，不同的 displayOrder
    await caller.gallery.create({
      title: "照片1",
      description: "",
      imageUrl: "https://example.com/1.jpg",
      category: "其他",
      isPublished: true,
      displayOrder: 5,
    });

    await caller.gallery.create({
      title: "照片2",
      description: "",
      imageUrl: "https://example.com/2.jpg",
      category: "其他",
      isPublished: true,
      displayOrder: 20,
    });

    await caller.gallery.create({
      title: "照片3",
      description: "",
      imageUrl: "https://example.com/3.jpg",
      category: "其他",
      isPublished: true,
      displayOrder: 10,
    });

    const gallery = await caller.gallery.getPublished({ limit: 10 });

    // 驗證排序：displayOrder 大的在前
    expect(gallery.length).toBeGreaterThanOrEqual(3);
    const orders = gallery.map((item) => item.displayOrder);
    for (let i = 0; i < orders.length - 1; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i + 1]);
    }
  });

  it("should update gallery item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建照片
    const created = await caller.gallery.create({
      title: "原標題",
      description: "原描述",
      imageUrl: "https://example.com/old.jpg",
      category: "其他",
      isPublished: false,
      displayOrder: 0,
    });

    // 更新照片
    const updated = await caller.gallery.update({
      id: created.id,
      title: "新標題",
      description: "新描述",
      imageUrl: "https://example.com/new.jpg",
      category: "教育訓練",
      isPublished: true,
      displayOrder: 15,
    });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("新標題");
    expect(updated.description).toBe("新描述");
    expect(updated.imageUrl).toBe("https://example.com/new.jpg");
    expect(updated.category).toBe("教育訓練");
    expect(updated.isPublished).toBe(true);
    expect(updated.displayOrder).toBe(15);
  });

  it("should delete gallery item", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建照片
    const created = await caller.gallery.create({
      title: "待刪除照片",
      description: "",
      imageUrl: "https://example.com/delete.jpg",
      category: "其他",
      isPublished: false,
      displayOrder: 0,
    });

    // 刪除照片
    const result = await caller.gallery.delete({ id: created.id });

    expect(result.success).toBe(true);

    // 驗證已刪除
    const allGallery = await caller.gallery.getAll();
    const deleted = allGallery.find((item) => item.id === created.id);
    expect(deleted).toBeUndefined();
  });

  it("should batch delete gallery items", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // 創建多張照片
    const item1 = await caller.gallery.create({
      title: "批次刪除1",
      description: "",
      imageUrl: "https://example.com/batch1.jpg",
      category: "其他",
      isPublished: false,
      displayOrder: 0,
    });

    const item2 = await caller.gallery.create({
      title: "批次刪除2",
      description: "",
      imageUrl: "https://example.com/batch2.jpg",
      category: "其他",
      isPublished: false,
      displayOrder: 0,
    });

    const item3 = await caller.gallery.create({
      title: "批次刪除3",
      description: "",
      imageUrl: "https://example.com/batch3.jpg",
      category: "其他",
      isPublished: false,
      displayOrder: 0,
    });

    // 批次刪除
    const result = await caller.gallery.batchDelete({
      ids: [item1.id, item2.id, item3.id],
    });

    expect(result.success).toBe(true);
    expect(result.deletedCount).toBe(3);

    // 驗證已刪除
    const allGallery = await caller.gallery.getAll();
    const deleted1 = allGallery.find((item) => item.id === item1.id);
    const deleted2 = allGallery.find((item) => item.id === item2.id);
    const deleted3 = allGallery.find((item) => item.id === item3.id);

    expect(deleted1).toBeUndefined();
    expect(deleted2).toBeUndefined();
    expect(deleted3).toBeUndefined();
  });
});
