// Imgur API storage implementation - Free image hosting for POC
import fetch from "node-fetch";

type StorageConfig = {
  clientId: string;
};

function getStorageConfig(): StorageConfig {
  const clientId = process.env.IMGUR_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      "Imgur credentials missing: set IMGUR_CLIENT_ID environment variable"
    );
  }

  return { clientId };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * 上傳檔案到 Imgur
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  // 轉換為 base64
  const base64Data =
    typeof data === "string"
      ? Buffer.from(data).toString("base64")
      : Buffer.from(data).toString("base64");

  try {
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${config.clientId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Data,
        type: "base64",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Imgur upload failed (${response.status}): ${errorText}`
      );
    }

    const result = (await response.json()) as any;

    if (!result.success || !result.data || !result.data.link) {
      throw new Error("Imgur API returned invalid response");
    }

    return {
      key: result.data.id, // Imgur 圖片 ID
      url: result.data.link, // 公開 URL
    };
  } catch (error) {
    console.error("[StorageImgur] Failed to upload file:", error);
    throw new Error(
      `Imgur upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * 獲取檔案的公開 URL（Imgur 不需要此功能，因為上傳時就會返回 URL）
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  // Imgur 的圖片 URL 格式：https://i.imgur.com/{id}.{ext}
  // 但我們通常直接使用上傳時返回的 URL
  const key = normalizeKey(relKey);
  return {
    key,
    url: `https://i.imgur.com/${key}`,
  };
}
