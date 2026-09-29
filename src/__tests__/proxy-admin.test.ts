import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function req(path: string, cookie?: string): NextRequest {
  return new NextRequest(`https://cultcodex.me${path}`, cookie ? { headers: { cookie } } : undefined);
}

describe("proxy /admin gate", () => {
  it("redirects /admin to sign-in without a session cookie", () => {
    const res = proxy(req("/admin/users"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://cultcodex.me/auth/signin?callbackUrl=%2Fadmin%2Fusers");
  });

  it("passes through when a session cookie is present (page gate decides)", () => {
    expect(proxy(req("/admin", "__Secure-authjs.session-token=x")).headers.get("location")).toBeNull();
    expect(proxy(req("/admin", "authjs.session-token.0=x")).headers.get("location")).toBeNull();
  });

  it("leaves non-admin paths alone", () => {
    expect(proxy(req("/administrivia")).headers.get("location")).toBeNull();
    expect(proxy(req("/episodes")).headers.get("location")).toBeNull();
  });
});
