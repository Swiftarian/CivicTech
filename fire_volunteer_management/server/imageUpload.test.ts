import { describe, expect, it } from "vitest";
import { validateImageFile, generateUniqueFileName } from "./imageUpload";

describe("imageUpload", () => {
  describe("validateImageFile", () => {
    it("應接受有效的 JPEG 圖片", () => {
      const base64Data = Buffer.from("test image data").toString("base64");
      const result = validateImageFile(base64Data, "image/jpeg");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("應接受有效的 PNG 圖片", () => {
      const base64Data = Buffer.from("test image data").toString("base64");
      const result = validateImageFile(base64Data, "image/png");
      expect(result.isValid).toBe(true);
    });

    it("應接受有效的 GIF 圖片", () => {
      const base64Data = Buffer.from("test image data").toString("base64");
      const result = validateImageFile(base64Data, "image/gif");
      expect(result.isValid).toBe(true);
    });

    it("應接受有效的 WebP 圖片", () => {
      const base64Data = Buffer.from("test image data").toString("base64");
      const result = validateImageFile(base64Data, "image/webp");
      expect(result.isValid).toBe(true);
    });

    it("應拒絕不支援的圖片格式", () => {
      const base64Data = Buffer.from("test image data").toString("base64");
      const result = validateImageFile(base64Data, "image/bmp");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("不支援的圖片格式");
    });

    it("應拒絕超過大小限制的檔案", () => {
      // 創建一個超過 5MB 的 base64 字串
      const largeData = "a".repeat(6 * 1024 * 1024);
      const base64Data = Buffer.from(largeData).toString("base64");
      const result = validateImageFile(base64Data, "image/jpeg");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("檔案大小超過限制");
    });
  });

  describe("generateUniqueFileName", () => {
    it("應生成包含使用者 ID 的檔名", () => {
      const userId = 123;
      const fileName = generateUniqueFileName("test.jpg", userId);
      expect(fileName).toContain(`uploads/${userId}/`);
    });

    it("應保留原始檔案的副檔名", () => {
      const fileName = generateUniqueFileName("test.jpg", 1);
      expect(fileName).toMatch(/\.jpg$/);
    });

    it("應為不同的呼叫生成不同的檔名", () => {
      const fileName1 = generateUniqueFileName("test.jpg", 1);
      const fileName2 = generateUniqueFileName("test.jpg", 1);
      expect(fileName1).not.toBe(fileName2);
    });

    it("應處理沒有副檔名的檔案", () => {
      const fileName = generateUniqueFileName("test", 1);
      expect(fileName).toMatch(/\.jpg$/); // 預設使用 jpg
    });

    it("應處理多個點的檔名", () => {
      const fileName = generateUniqueFileName("test.image.png", 1);
      expect(fileName).toMatch(/\.png$/);
    });
  });
});
