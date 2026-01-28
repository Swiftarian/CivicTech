// Cloudinary storage implementation - Free image hosting for POC
import { v2 as cloudinary } from "cloudinary";

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

let isConfigured = false;

function configureCloudinary() {
  if (!isConfigured) {
    const config = getStorageConfig();
    console.log("[StorageCloudinary] Configuring Cloudinary with cloud_name:", config.cloudName);
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
    isConfigured = true;
    console.log("[StorageCloudinary] Cloudinary configured successfully");
  }
}

function normalizeKey(relKey: string): string {
  // 移除開頭的斜線和副檔名
  return relKey.replace(/^\/+/, "").replace(/\.[^/.]+$/, "");
}

/**
 * 上傳檔案到 Cloudinary
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  configureCloudinary();
  const publicId = normalizeKey(relKey);

  // 轉換為 base64 data URI
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  const base64 = buffer.toString("base64");
  const dataUri = `data:${contentType};base64,${base64}`;
  
  // 將 folder 整合到 public_id 中，避免參數衝突
  const fullPublicId = `taitung-disaster-system/${publicId}`;

  try {
    
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: fullPublicId,
      resource_type: "auto", // 自動偵測資源類型
      overwrite: true, // 允許覆蓋同名檔案
    });

    return {
      key: result.public_id,
      url: result.secure_url, // 使用 HTTPS URL
    };
  } catch (error) {
    console.error("[StorageCloudinary] ========== UPLOAD FAILED ==========");
    console.error("[StorageCloudinary] Error object:", error);
    console.error("[StorageCloudinary] Error type:", typeof error);
    console.error("[StorageCloudinary] Error constructor:", error?.constructor?.name);
    
    // 記錄所有錯誤屬性
    if (error && typeof error === 'object') {
      const errorObj = error as any;
      console.error("[StorageCloudinary] Error properties:", {
        message: errorObj.message,
        name: errorObj.name,
        http_code: errorObj.http_code,
        error: errorObj.error,
        stack: errorObj.stack,
      });
      
      // 記錄所有可枚舉屬性
      console.error("[StorageCloudinary] All error keys:", Object.keys(errorObj));
    }
    
    console.error("[StorageCloudinary] Upload context:", {
      publicId,
      fullPublicId,
      contentType,
      dataUriLength: dataUri.length,
      dataUriPrefix: dataUri.substring(0, 50) + "...",
    });
    console.error("[StorageCloudinary] =====================================");
    
    throw new Error(
      `Cloudinary upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * 獲取檔案的公開 URL
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  configureCloudinary();
  const config = getStorageConfig();
  const publicId = normalizeKey(relKey);

  // 生成 Cloudinary URL
  const url = cloudinary.url(publicId, {
    secure: true,
    cloud_name: config.cloudName,
  });

  return { key: publicId, url };
}
