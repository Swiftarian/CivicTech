// Cloudinary storage implementation using HTTP API
// This is a fallback implementation that doesn't rely on the Cloudinary SDK

import crypto from "crypto";

type StorageConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function getStorageConfig(): StorageConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function normalizeKey(relKey: string): string {
  // 移除開頭的斜線和副檔名
  return relKey.replace(/^\/+/, "").replace(/\.[^/.]+$/, "");
}

/**
 * 生成 Cloudinary 簽名
 *
 * Note: SHA-1 is used here because it is REQUIRED by the Cloudinary API specification.
 * This is not a security vulnerability as this is not used for cryptographic security,
 * but rather for API request authentication as mandated by Cloudinary's documentation.
 * Reference: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 *
 * lgtm[js/weak-cryptographic-algorithm]
 */
function generateSignature(
  params: Record<string, any>,
  apiSecret: string
): string {
  // 按字母順序排序參數
  const sortedKeys = Object.keys(params).sort();

  // 建立簽名字串
  const signatureString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join("&");

  // SHA-1 is required by Cloudinary API - not a security concern in this context
  // CodeQL suppression: This is a third-party API requirement, not a cryptographic security use
  return crypto
    .createHash("sha1") // lgtm[js/weak-cryptographic-algorithm]
    .update(signatureString + apiSecret)
    .digest("hex");
}

/**
 * 上傳檔案到 Cloudinary（使用 HTTP API）
 */
export async function storagePutHttp(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const publicId = normalizeKey(relKey);
  const fullPublicId = `taitung-disaster-system/${publicId}`;

  // 轉換為 base64 data URI
  const buffer =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const base64 = buffer.toString("base64");
  const dataUri = `data:${contentType};base64,${base64}`;

  console.log("[StorageCloudinaryHttp] Starting upload...");
  console.log("[StorageCloudinaryHttp] Public ID:", fullPublicId);
  console.log("[StorageCloudinaryHttp] Content Type:", contentType);
  console.log("[StorageCloudinaryHttp] Data URI length:", dataUri.length);

  try {
    // 準備上傳參數
    const timestamp = Math.floor(Date.now() / 1000);
    const params: Record<string, any> = {
      public_id: fullPublicId,
      timestamp: timestamp,
    };

    // 生成簽名
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join("&");

    console.log("[StorageCloudinaryHttp] Signature string:", signatureString);
    console.log(
      "[StorageCloudinaryHttp] API Secret (first 5 chars):",
      config.apiSecret.substring(0, 5)
    );

    const signature = generateSignature(params, config.apiSecret);
    console.log("[StorageCloudinaryHttp] Generated signature:", signature);

    // 準備表單資料
    const formData = new FormData();
    formData.append("file", dataUri);
    formData.append("public_id", fullPublicId);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", config.apiKey);
    formData.append("signature", signature);

    // 發送 HTTP 請求
    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

    console.log("[StorageCloudinaryHttp] Uploading to:", uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[StorageCloudinaryHttp] Upload failed with status:",
        response.status
      );
      console.error("[StorageCloudinaryHttp] Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log("[StorageCloudinaryHttp] Upload successful!");
    console.log("[StorageCloudinaryHttp] Public ID:", result.public_id);
    console.log("[StorageCloudinaryHttp] URL:", result.secure_url);

    return {
      key: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error(
      "[StorageCloudinaryHttp] ========== UPLOAD FAILED =========="
    );
    console.error("[StorageCloudinaryHttp] Error:", error);
    console.error("[StorageCloudinaryHttp] Error type:", typeof error);

    if (error instanceof Error) {
      console.error("[StorageCloudinaryHttp] Error message:", error.message);
      console.error("[StorageCloudinaryHttp] Error stack:", error.stack);
    }

    console.error(
      "[StorageCloudinaryHttp] ====================================="
    );

    throw new Error(
      `Cloudinary HTTP upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
