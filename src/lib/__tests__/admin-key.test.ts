import { describe, expect, it } from "vitest";
import { adminKeyValid, mintAdminKey, MAX_ADMIN_KEY_TTL_MS } from "@/lib/admin-key";

const SECRET = "test-secret";
const NOW = 1_800_000_000_000;

describe("admin keys", () => {
  it("accepts a fresh key for its own purpose", () => {
    const key = mintAdminKey("build-book", 60_000, SECRET, NOW);
    expect(adminKeyValid(key, "build-book", SECRET, NOW)).toBe(true);
  });

  it("rejects the key on another route", () => {
    const key = mintAdminKey("build-book", 60_000, SECRET, NOW);
    expect(adminKeyValid(key, "migrate-art-r2", SECRET, NOW)).toBe(false);
  });

  it("rejects an expired key", () => {
    const key = mintAdminKey("build-book", 60_000, SECRET, NOW);
    expect(adminKeyValid(key, "build-book", SECRET, NOW + 60_001)).toBe(false);
  });

  it("rejects a key whose expiry is beyond the maximum lifetime", () => {
    // Correctly signed, but minted by hand with a far-future expiry.
    const key = mintAdminKey("build-book", 60_000, SECRET, NOW + MAX_ADMIN_KEY_TTL_MS);
    expect(adminKeyValid(key, "build-book", SECRET, NOW)).toBe(false);
  });

  it("rejects the old fixed-string key format and tampered keys", () => {
    const key = mintAdminKey("build-book", 60_000, SECRET, NOW);
    const [exp, mac] = key.split(".");
    expect(adminKeyValid(mac, "build-book", SECRET, NOW)).toBe(false);
    expect(adminKeyValid(`${Number(exp) + 1}.${mac}`, "build-book", SECRET, NOW)).toBe(false);
    expect(adminKeyValid(key, "build-book", "other-secret", NOW)).toBe(false);
    expect(adminKeyValid(key, "build-book", undefined, NOW)).toBe(false);
  });

  it("refuses to mint a key that outlives the maximum", () => {
    expect(() => mintAdminKey("x", MAX_ADMIN_KEY_TTL_MS + 1, SECRET, NOW)).toThrow();
  });
});
