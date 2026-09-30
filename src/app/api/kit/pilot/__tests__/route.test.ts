import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@/lib/rate-limit", () => ({
  clientKey: () => "ip:test",
  rateLimit: () => ({ ok: true, retryAfterSec: 0 }),
  sharedRateLimit: async () => ({ ok: true, retryAfterSec: 0 }),
}));
vi.mock("@/lib/notifications", () => ({ sendKitPilotRequestEmail: m.send }));

import { POST } from "../route";

const post = (body: unknown) =>
  POST(new Request("https://cultcodex.me/api/kit/pilot", { method: "POST", body: JSON.stringify(body) }));

const valid = {
  name: " Moon Reader ",
  email: "Moon@Example.com",
  channelUrl: "https://youtube.com/@moonreader",
  replayUrl: "",
  note: "",
  website: "",
};

describe("POST /api/kit/pilot", () => {
  beforeEach(() => {
    m.send.mockReset();
    m.send.mockResolvedValue(undefined);
    delete process.env.KIT_ADMIN_EMAIL;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emails the owner a cleaned-up request, dropping blank optional fields", async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    expect(m.send).toHaveBeenCalledWith(
      { name: "Moon Reader", email: "moon@example.com", channelUrl: "https://youtube.com/@moonreader" },
      "psychetarotchannel@gmail.com",
    );
  });

  it("passes the replay link and note through when given", async () => {
    await post({ ...valid, replayUrl: "https://youtube.com/live/x", note: "Sunday lives" });
    expect(m.send).toHaveBeenCalledWith(
      expect.objectContaining({ replayUrl: "https://youtube.com/live/x", note: "Sunday lives" }),
      "psychetarotchannel@gmail.com",
    );
  });

  it.each([
    [{ ...valid, name: "" }, "Tell us your name or channel name."],
    [{ ...valid, email: "nope" }, "Enter a valid email so we can reply."],
    [{ ...valid, channelUrl: "youtube.com/@x" }, "Paste the full link to your channel (starting with https://)."],
    [{ ...valid, replayUrl: "javascript:alert(1)" }, "Paste the full link to your replay, or leave it blank."],
    [{ ...valid, note: "x".repeat(1001) }, "Keep the note under 1,000 characters."],
  ])("rejects %j", async (body, error) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
    expect(m.send).not.toHaveBeenCalled();
  });

  it("silently drops honeypot submissions", async () => {
    const res = await post({ ...valid, website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(m.send).not.toHaveBeenCalled();
  });

  it("returns a fallback message when the email can't be sent", async () => {
    m.send.mockRejectedValue(new Error("resend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain("psychetarotchannel@gmail.com");
  });
});
