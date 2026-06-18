import { S3Client } from "@aws-sdk/client-s3";

/** Cloudflare R2 (S3-compatible) client. Creds from env. */
export function getR2(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID not set");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export const R2_BUCKET = process.env.R2_BUCKET ?? "";

/** True when R2 is configured (so callers can fall back to Postgres). */
export const r2Configured = () =>
  !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);

/** Object key for a chapter art image. */
export const artKey = (slug: string, slot: string) => `psychenomicon-art/${slug}/${slot}`;
