import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CodexCard, CodexCardBack, type CodexCardData } from "../codex-card";

// jsdom has no matchMedia; the card reads prefers-reduced-motion through it.
function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  }));
}
afterEach(() => vi.unstubAllGlobals());

const NYX: CodexCardData = {
  slug: "se-01-nyx-high-priestess", title: "Nyx", cardType: "ORACLE", rarity: "FORBIDDEN",
  statA: 1, statB: 1, statC: 1, artUrl: "/cards/art/se-01-nyx-high-priestess.webp", season: 0,
};

describe("CodexCard special editions", () => {
  it("shows the gold art for a regular copy and the foil art for a foil copy", () => {
    mockReducedMotion(false);
    const { container, rerender } = render(<CodexCard card={NYX} />);
    expect(container.querySelector("img.cx-art-img")?.getAttribute("src")).toBe("/cards/art/se-01-nyx-high-priestess.webp");
    rerender(<CodexCard card={NYX} isFoil />);
    expect(container.querySelector("img.cx-art-img")?.getAttribute("src")).toBe("/cards/art/se-01-nyx-high-priestess-foil.webp");
  });

  it("plays the loop when animated, with the matching still as poster", () => {
    mockReducedMotion(false);
    const { container } = render(<CodexCard card={NYX} isFoil animated />);
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBe("/cards/anim/se-01-nyx-high-priestess.mp4");
    expect(video?.getAttribute("poster")).toBe("/cards/art/se-01-nyx-high-priestess-foil.webp");
  });

  it("keeps the still image when the viewer prefers reduced motion", () => {
    mockReducedMotion(true);
    const { container } = render(<CodexCard card={NYX} animated />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img.cx-art-img")).not.toBeNull();
  });

  it("does not swap art for cards that are not special editions", () => {
    mockReducedMotion(false);
    const other = { ...NYX, slug: "cop-00-the-fool", artUrl: "/cards/art/cop-00-the-fool.webp" };
    const { container } = render(<CodexCard card={other} isFoil animated />);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img.cx-art-img")?.getAttribute("src")).toBe("/cards/art/cop-00-the-fool.webp");
  });
});

describe("CodexCardBack", () => {
  it("uses the tarot back by default and the special-edition back when asked", () => {
    const { container, rerender } = render(<CodexCardBack />);
    expect(container.querySelector("img.cx-back-art")?.getAttribute("src")).toBe("/cards/backs/tarot.webp");
    rerender(<CodexCardBack special />);
    expect(container.querySelector("img.cx-back-art")?.getAttribute("src")).toBe("/cards/backs/special-edition.webp");
  });
});
