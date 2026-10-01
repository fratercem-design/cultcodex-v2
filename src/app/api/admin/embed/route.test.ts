import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  queryRawUnsafe: vi.fn(),
  executeRawUnsafe: vi.fn(),
  findMany: vi.fn(),
  embedBatch: vi.fn(),
}));

vi.mock("@/lib/admin-guard", () => ({ requireEnrichSecret: () => null }));
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRawUnsafe: mocks.queryRawUnsafe,
    $executeRawUnsafe: mocks.executeRawUnsafe,
    transcriptSegment: { findMany: mocks.findMany },
  },
}));
vi.mock("@/lib/embeddings", () => ({
  embedBatch: mocks.embedBatch,
  segmentToEmbedText: (speaker: string | null, text: string) => (speaker ? `${speaker}: ${text}` : text),
  vectorLiteral: (v: number[]) => `[${v.join(",")}]`,
}));

import { POST } from "./route";

const call = (batch: number) =>
  POST(new NextRequest("http://x/api/admin/embed", { method: "POST", body: JSON.stringify({ batch }) }));

beforeEach(() => vi.clearAllMocks());

describe("POST /api/admin/embed", () => {
  it("skips blank segments and caps each input's length", async () => {
    mocks.queryRawUnsafe.mockResolvedValue([{ id: "a" }]);
    mocks.findMany.mockResolvedValue([{ id: "a", speakerLabel: null, text: "x".repeat(5000) }]);
    mocks.embedBatch.mockResolvedValue([[0.1, 0.2]]);
    mocks.executeRawUnsafe.mockResolvedValue(1);

    const res = await call(2);

    expect(mocks.queryRawUnsafe.mock.calls[0][0]).toContain("btrim(text) <> ''");
    expect(mocks.embedBatch.mock.calls[0][0][0]).toHaveLength(2000);
    expect(await res.json()).toEqual({ processed: 1, done: true });
  });

  it("returns the error message as JSON instead of an empty 500", async () => {
    mocks.queryRawUnsafe.mockResolvedValue([{ id: "a" }]);
    mocks.findMany.mockResolvedValue([{ id: "a", speakerLabel: null, text: "hi" }]);
    mocks.embedBatch.mockRejectedValue(new Error("429 Rate limit reached"));

    const res = await call(1);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "429 Rate limit reached" });
  });
});
