import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/seo";

/**
 * Signed links for the email list: double opt-in confirmation and one-click
 * unsubscribe. The purpose is part of the MAC and carries its own prefix, so
 * these tokens can't be replayed as admin keys or book gift links (which use
 * `${purpose}.${exp}`), nor a confirm token as an unsubscribe token.
 */
type Purpose = "confirm" | "unsubscribe";

function mac(purpose: Purpose, email: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`subscriber-link:v1:${purpose}:${email.trim().toLowerCase()}`)
    .digest("base64url");
}

export function subscriberToken(purpose: Purpose, email: string, secret = process.env.AUTH_SECRET): string {
  if (!secret) throw new Error("AUTH_SECRET not set");
  return mac(purpose, email, secret);
}

export function subscriberTokenValid(
  purpose: Purpose,
  email: string | null,
  token: string | null,
  secret = process.env.AUTH_SECRET,
): boolean {
  if (!email || !token || !secret) return false;
  const expected = Buffer.from(mac(purpose, email, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function subscriberLink(purpose: Purpose, email: string): string {
  const url = new URL(`/api/subscribe/${purpose}`, SITE_URL);
  url.searchParams.set("e", email);
  url.searchParams.set("t", subscriberToken(purpose, email));
  return url.toString();
}
