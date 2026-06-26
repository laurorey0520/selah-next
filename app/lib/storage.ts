import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Server-side signing for direct-to-bucket uploads (S3-compatible: AWS S3,
 * Cloudflare R2, Backblaze B2, MinIO, …).
 *
 * The browser never sends bytes through Next or Render — it asks for a short-
 * lived presigned PUT URL, then streams the file straight to the bucket. Keep
 * these env vars server-side (no NEXT_PUBLIC_ prefix):
 *
 *   S3_BUCKET            bucket name
 *   S3_REGION            e.g. us-east-1   (use "auto" for R2)
 *   S3_ENDPOINT          custom endpoint for R2/MinIO; omit for AWS S3
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_PUBLIC_BASE_URL   public origin objects are served from (CDN / bucket URL)
 *
 * Presigned URLs expire quickly and bind the Content-Type, so a leaked URL is
 * only briefly useful and can't be repurposed for a different payload type.
 */
const EXPIRES_IN = 120; // seconds — ephemeral by design

function env() {
  return {
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  };
}

/** True once a real bucket is configured; otherwise we sign to the dev receiver. */
export function isCloudConfigured(): boolean {
  const e = env();
  return Boolean(
    e.bucket && e.accessKeyId && e.secretAccessKey && e.publicBaseUrl,
  );
}

let cached: S3Client | null = null;
function s3(): S3Client {
  if (cached) return cached;
  const e = env();
  cached = new S3Client({
    region: e.region,
    endpoint: e.endpoint,
    // Path-style addressing for R2/MinIO-style custom endpoints.
    forcePathStyle: Boolean(e.endpoint),
    // AWS SDK v3 injects a default CRC32 checksum that breaks browser direct
    // PUTs to presigned URLs (the placeholder checksum can't match the body).
    // Only checksum when an operation actually requires it.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: e.accessKeyId as string,
      secretAccessKey: e.secretAccessKey as string,
    },
  });
  return cached;
}

function makeKey(filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "asset";
  return `${randomUUID()}-${safe}`;
}

export type UploadPlan = {
  method: "PUT";
  /** Where the browser PUTs the bytes (presigned bucket URL, or dev receiver). */
  uploadUrl: string;
  /** Where the asset will be readable after upload. */
  publicUrl: string;
  key: string;
  /** Headers the browser must send on the PUT so the signature validates. */
  headers: Record<string, string>;
};

/** Produce a presigned upload plan for one image. */
export async function createSignedUpload(input: {
  filename: string;
  contentType: string;
}): Promise<UploadPlan> {
  const key = makeKey(input.filename);
  const headers = { "content-type": input.contentType };

  if (!isCloudConfigured()) {
    // Dev fallback: identical client flow, but PUT lands on a local receiver
    // that writes to public/uploads. Lets the feature run without cloud creds.
    return {
      method: "PUT",
      uploadUrl: `/api/uploads/local/${key}`,
      publicUrl: `/uploads/${key}`,
      key,
      headers,
    };
  }

  const e = env();
  const objectKey = `vision-board/${key}`;
  const command = new PutObjectCommand({
    Bucket: e.bucket,
    Key: objectKey,
    ContentType: input.contentType,
  });
  const uploadUrl = await getSignedUrl(s3(), command, { expiresIn: EXPIRES_IN });
  const publicUrl = `${e.publicBaseUrl?.replace(/\/+$/, "")}/${objectKey}`;

  return { method: "PUT", uploadUrl, publicUrl, key: objectKey, headers };
}
