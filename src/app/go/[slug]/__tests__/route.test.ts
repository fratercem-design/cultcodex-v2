import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/recommendations", () => ({
  getRecommendation: (slug: string) =>
    slug === "deck" ? { slug: "deck", url: "https://example.com/?ref=cultofpsyche" } : undefined,
}));

import { GET } from "../route";

const call = (slug: string) =>
  GET(new Request(`https://cultcodex.me/go/${slug}`), { params: Promise.resolve({ slug }) });

describe("/go/[slug]", () => {
  it("redirects a known slug to its affiliate URL, uncached", async () => {
    const res = await call("deck");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/?ref=cultofpsyche");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("sends an unknown slug to /recommends instead of a 404", async () => {
    const res = await call("nope");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://cultcodex.me/recommends");
  });
});
