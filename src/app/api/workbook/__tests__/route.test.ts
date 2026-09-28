import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({
  findFirst: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  sendWorkbook: vi.fn(),
  perAddressOk: true,
  readPdf: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  clientKey: () => "ip:test",
  rateLimit: () => ({ ok: true, retryAfterSec: 0 }),
  sharedRateLimit: async (ns: string) => ({ ok: ns === "workbook-email" ? m.perAddressOk : true, retryAfterSec: 0 }),
}));
vi.mock("@/lib/db", () => ({
  prisma: { subscriber: { findFirst: m.findFirst, create: m.create, updateMany: m.updateMany } },
}));
vi.mock("@/lib/notifications", () => ({ sendWorkbookEmail: m.sendWorkbook }));
vi.mock("node:fs/promises", () => ({ default: { readFile: m.readPdf }, readFile: m.readPdf }));

import { POST } from "../route";
import { GET } from "../download/route";
import { subscriberToken } from "@/lib/subscriber-links";

const post = (body: unknown) =>
  POST(new NextRequest("https://cultcodex.me/api/workbook", { method: "POST", body: JSON.stringify(body) }));
const download = (e: string, t: string) =>
  GET(new NextRequest(`https://cultcodex.me/api/workbook/download?${new URLSearchParams({ e, t })}`));

describe("POST /api/workbook", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    for (const f of [m.findFirst, m.create, m.updateMany, m.sendWorkbook, m.readPdf]) f.mockReset();
    m.sendWorkbook.mockResolvedValue(undefined);
    m.perAddressOk = true;
  });

  it("saves a new address unconfirmed and emails it a signed link, never the file", async () => {
    m.findFirst.mockResolvedValue(null);
    const res = await post({ email: "new@example.com", source: "persona_sulphur" });
    expect(await res.json()).toEqual({ ok: true });
    expect(m.create).toHaveBeenCalledWith({
      data: { email: "new@example.com", source: "gift:initiation30:persona_sulphur", verified: false },
    });
    const [to, link, unsub] = m.sendWorkbook.mock.calls[0];
    expect(to).toBe("new@example.com");
    expect(link).toContain("/initiation/download?e=new%40example.com&t=");
    expect(unsub).toContain("/api/subscribe/unsubscribe?");
  });

  it("reuses an existing row, spelled as stored, without touching it", async () => {
    m.findFirst.mockResolvedValue({ email: "Known@Example.com" });
    await post({ email: "known@example.com" });
    expect(m.create).not.toHaveBeenCalled();
    expect(m.sendWorkbook.mock.calls[0][0]).toBe("Known@Example.com");
  });

  it("stops mailing an address after the hourly limit but answers the same way", async () => {
    m.perAddressOk = false;
    const res = await post({ email: "flooded@example.com" });
    expect(await res.json()).toEqual({ ok: true });
    expect(m.sendWorkbook).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid address", async () => {
    const res = await post({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(m.sendWorkbook).not.toHaveBeenCalled();
  });

  it("reports a failed send so the reader can retry", async () => {
    m.findFirst.mockResolvedValue(null);
    m.sendWorkbook.mockRejectedValue(new Error("resend down"));
    const res = await post({ email: "new@example.com" });
    expect(res.status).toBe(500);
  });
});

describe("GET /api/workbook/download", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    m.updateMany.mockReset();
    m.readPdf.mockReset();
    m.readPdf.mockResolvedValue(Buffer.from("%PDF-1.7"));
  });

  it("serves the PDF to a valid link and confirms the address", async () => {
    const res = await download("reader@example.com", subscriberToken("workbook", "reader@example.com"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("the-30-day-initiation.pdf");
    expect(m.updateMany).toHaveBeenCalledWith({
      where: { email: { equals: "reader@example.com", mode: "insensitive" }, verified: false },
      data: { verified: true },
    });
  });

  it("refuses a confirm or unsubscribe token and sends the reader back to the form", async () => {
    const res = await download("reader@example.com", subscriberToken("confirm", "reader@example.com"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://cultcodex.me/initiation/download");
    expect(m.readPdf).not.toHaveBeenCalled();
    expect(m.updateMany).not.toHaveBeenCalled();
  });
});
