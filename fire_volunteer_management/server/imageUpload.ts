import { storagePut } from "./storageS3";
import { TRPCError } from "@trpc/server";

// 支援的圖片格式
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// 最大檔案大小 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 驗證圖片檔案
 */
export function validateImageFile(
  base64Data: string,
  mimeType: string
): { isValid: boolean; error?: string } {
  // 檢查 MIME 類型
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: `不支援的圖片格式。支援格式：${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  // 檢查檔案大小
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `檔案大小超過限制（最大 5MB）`,
    };
  }

  return { isValid: true };
}

/**
 * 生成唯一檔名
 */
export function generateUniqueFileName(
  originalName: string,
  userId: number
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const parts = originalName.split(".");
  // 如果沒有副檔名或只有一個部分，預設使用 jpg
  const extension = parts.length > 1 ? parts.pop() : "jpg";
  return `uploads/${userId}/${timestamp}-${randomStr}.${extension}`;
}

/**
 * 上傳圖片到 S3
 */
export async function uploadImage(
  base64Data: string,
  mimeType: string,
  originalName: string,
  userId: number
): Promise<{ url: string; key: string }> {
  // 驗證檔案
  const validation = validateImageFile(base64Data, mimeType);
  if (!validation.isValid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: validation.error,
    });
  }

  try {
    // 生成唯一檔名
    const fileKey = generateUniqueFileName(originalName, userId);

    // 轉換 base64 為 Buffer
    const buffer = Buffer.from(base64Data, "base64");

    // 上傳到 S3
    const result = await storagePut(fileKey, buffer, mimeType);

    return {
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error("[ImageUpload] Failed to upload image:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "圖片上傳失敗，請稍後再試",
    });
  }
}
