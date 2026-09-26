import { describe, it, expect } from "vitest";
import { subscriberToken, subscriberTokenValid } from "../subscriber-links";

const secret = "test-secret";

describe("subscriber links", () => {
  it("accepts its own token, case-insensitively on the email", () => {
    const t = subscriberToken("confirm", "Reader@Example.com", secret);
    expect(subscriberTokenValid("confirm", "reader@example.com", t, secret)).toBe(true);
  });

  it("rejects a token for a different email, purpose or secret", () => {
    const t = subscriberToken("confirm", "reader@example.com", secret);
    expect(subscriberTokenValid("confirm", "other@example.com", t, secret)).toBe(false);
    expect(subscriberTokenValid("unsubscribe", "reader@example.com", t, secret)).toBe(false);
    expect(subscriberTokenValid("confirm", "reader@example.com", t, "other-secret")).toBe(false);
  });

  it("rejects missing or malformed input", () => {
    expect(subscriberTokenValid("confirm", null, "x", secret)).toBe(false);
    expect(subscriberTokenValid("confirm", "a@b.co", null, secret)).toBe(false);
    expect(subscriberTokenValid("confirm", "a@b.co", "short", secret)).toBe(false);
  });
});
