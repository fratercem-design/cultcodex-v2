import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const post = (body: string, ip = "203.0.113.7") =>
  POST(new Request("https://cultcodex.me/api/csp-report", { method: "POST", body, headers: { "fly-client-ip": ip } }));

describe("POST /api/csp-report", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("logs a report-uri violation with query strings stripped", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await post(
      JSON.stringify({
        "csp-report": {
          "effective-directive": "script-src-elem",
          "blocked-uri": "inline",
          "document-uri": "https://cultcodex.me/episodes/x?token=secret#frag",
        },
      }),
      "203.0.113.1",
    );
    expect(res.status).toBe(204);
    const line = String(warn.mock.calls[0][1]);
    expect(line).toContain("script-src-elem");
    expect(line).toContain("https://cultcodex.me/episodes/x");
    expect(line).not.toContain("secret");
  });

  it("accepts Reporting API arrays and ignores junk and oversized bodies", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await post(JSON.stringify([{ type: "csp-violation", body: { effectiveDirective: "script-src", blockedURL: "inline" } }]), "203.0.113.2")).status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    expect((await post("not json", "203.0.113.3")).status).toBe(204);
    expect((await post("x".repeat(9000), "203.0.113.4")).status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("rate-limits a single client", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let last = 204;
    for (let i = 0; i < 31; i++) last = (await post("{}", "203.0.113.9")).status;
    expect(last).toBe(429);
  });
});
