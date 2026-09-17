// Works with any S3-compatible provider: AWS S3, Cloudflare R2, Backblaze B2,
// DigitalOcean Spaces. Set S3_ENDPOINT for non-AWS providers; leave it unset for AWS.
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getClient(): S3Client | null {
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT || undefined, // unset = real AWS S3
    forcePathStyle: Boolean(process.env.S3_ENDPOINT), // most non-AWS providers need this
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.S3_BUCKET && getClient());
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
  const client = getClient();
  const bucket = process.env.S3_BUCKET;
  if (!client || !bucket) throw new Error("File storage is not configured.");

  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function getDownloadUrl(key: string): Promise<string> {
  const client = getClient();
  const bucket = process.env.S3_BUCKET;
  if (!client || !bucket) throw new Error("File storage is not configured.");

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 300 }); // 5-minute signed link
}

export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  const bucket = process.env.S3_BUCKET;
  if (!client || !bucket) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
