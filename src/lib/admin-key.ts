import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived signed keys for the `?key=` admin routes (build-book,
 * migrate-art-r2, db-size), same shape as the book gift links:
 *
 *   key = `${expMs}.${base64url(HMAC-SHA256(AUTH_SECRET, `${purpose}.${expMs}`))}`
 *
 * The purpose is part of the MAC, so a key for one route can't be used on
 * another. Keys are rejected once expired, and also when their expiry is more
 * than MAX_ADMIN_KEY_TTL_MS in the future, so nobody can mint a key that
 * effectively never expires. Mint one with `scripts/mint-admin-key.ts`.
 */
export const MAX_ADMIN_KEY_TTL_MS = 24 * 60 * 60 * 1000;

function sign(secret: string, purpose: string, expMs: number): string {
  return createHmac("sha256", secret).update(`${purpose}.${expMs}`).digest("base64url");
}

export function mintAdminKey(
  purpose: string,
  ttlMs: number,
  secret = process.env.AUTH_SECRET,
  now = Date.now(),
): string {
  if (!secret) throw new Error("AUTH_SECRET not set");
  if (!(ttlMs > 0) || ttlMs > MAX_ADMIN_KEY_TTL_MS) {
    throw new Error(`ttl must be between 1ms and ${MAX_ADMIN_KEY_TTL_MS}ms`);
  }
  const exp = now + Math.floor(ttlMs);
  return `${exp}.${sign(secret, purpose, exp)}`;
}

export function adminKeyValid(
  key: string | null | undefined,
  purpose: string,
  secret = process.env.AUTH_SECRET,
  now = Date.now(),
): boolean {
  if (!key || !secret) return false;
  const dot = key.indexOf(".");
  if (dot <= 0) return false;
  const expStr = key.slice(0, dot);
  if (!/^\d+$/.test(expStr)) return false;
  const exp = Number(expStr);
  if (!Number.isSafeInteger(exp) || exp < now || exp > now + MAX_ADMIN_KEY_TTL_MS) return false;
  const a = Buffer.from(key.slice(dot + 1));
  const b = Buffer.from(sign(secret, purpose, exp));
  return a.length === b.length && timingSafeEqual(a, b);
}
