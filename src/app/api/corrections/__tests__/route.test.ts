import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  clientKey: () => "ip:test",
  rateLimit: () => ({ ok: true, retryAfterSec: 0 }),
}));

import { POST } from "../route";

const valid = {
  pageUrl: "https://cultcodex.me/episodes/some-episode",
  type: "speaker",
  details: "The guest at 12:30 is not who the page says.",
  correct: "It was Jane.",
  context: "12:30",
  email: "reader@example.com",
};

const post = (body: unknown) =>
  POST(new NextRequest("https://cultcodex.me/api/corrections", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/corrections", () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: "e1" }, error: null });
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.CORRECTIONS_TO;
  });

  it("emails the maintainers with a reference and reply-to", async () => {
    const res = await post(valid);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.reference).toMatch(/^C-[0-9A-F]{6}$/);
    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe("psychetarotchannel@gmail.com");
    expect(msg.replyTo).toBe("reader@example.com");
    expect(msg.subject).toContain(body.reference);
    expect(msg.text).toContain("It was Jane.");
  });

  it("omits reply-to when no email is given", async () => {
    await post({ ...valid, email: "" });
    expect(send.mock.calls[0][0]).not.toHaveProperty("replyTo");
  });

  it("rejects a report with no real description", async () => {
    const res = await post({ ...valid, details: "bad" });
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts but drops honeypot submissions", async () => {
    const res = await post({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("says so when email isn't configured instead of pretending", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await post(valid);
    expect(res.status).toBe(503);
  });

  it("reports a failed send", async () => {
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    const res = await post(valid);
    expect(res.status).toBe(502);
  });
});
