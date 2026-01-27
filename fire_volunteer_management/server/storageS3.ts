// AWS S3 storage implementation
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

type StorageConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
};

function getStorageConfig(): StorageConfig {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "ap-northeast-1";
  const bucket = process.env.AWS_S3_BUCKET;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "AWS S3 credentials missing: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET"
    );
  }

  return { accessKeyId, secretAccessKey, region, bucket };
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const config = getStorageConfig();
    s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return s3Client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * 上傳檔案到 S3
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);
  const client = getS3Client();

  const buffer = typeof data === "string" ? Buffer.from(data) : data;

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // 設定為公開讀取
    ACL: "public-read",
  });

  try {
    await client.send(command);

    // 生成公開 URL
    const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

    return { key, url };
  } catch (error) {
    console.error("[StorageS3] Failed to upload file:", error);
    throw new Error(
      `S3 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * 獲取檔案的公開 URL
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  // 生成公開 URL
  const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

  return { key, url };
}
