import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GrimoireApp, type GrimoireCard } from "./grimoire-app";

const card = (position: number, orientation: string, face: GrimoireCard["face"]): GrimoireCard => ({
  position, positionName: null, orientation, titleSnapshot: `Card ${position}`,
  uprightMeaning: "up", reversedMeaning: "down", oraclePrompt: null, element: null, archetype: null, face,
});

describe("GrimoireApp card faces", () => {
  it("shows each saved card's face, reversed ones upside down, and skips cards with no face", () => {
    // jsdom has no matchMedia; CodexCard reads prefers-reduced-motion through it.
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const painted = { slug: "cop-maj-00", title: "The Fool", cardType: "ORACLE", rarity: "SIGNAL", statA: 1, statB: 1, statC: 1, artUrl: "/cards/art/cop-maj-00.webp" } as const;
    const codex = { slug: "s1-test", title: "Test Card", cardType: "LORE", rarity: "STATIC", statA: 1, statB: 1, statC: 1, artUrl: null, season: 1 } as const;
    const { container } = render(
      <GrimoireApp
        signedIn
        affinity={null}
        threshold={5}
        readings={[{
          id: "r1", createdAt: "2026-10-01T00:00:00.000Z", question: null, spreadName: null, reflection: null,
          cards: [card(0, "upright", painted), card(1, "reversed", codex), card(2, "upright", null)],
        }]}
      />,
    );

    const fool = screen.getByRole("img", { name: "The Fool" });
    expect(fool.querySelector("img")?.getAttribute("src")).toBe("/cards/art/cop-maj-00.webp");
    expect(fool.style.transform).toBe("");

    const reversed = screen.getByRole("img", { name: "Test Card, reversed" });
    expect(reversed.querySelector(".cx-card")).not.toBeNull();
    expect(reversed.style.transform).toBe("rotate(180deg)");

    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(container.textContent).toContain("Card 2"); // the faceless entry still lists its text
    vi.unstubAllGlobals();
  });
});

describe("GrimoireApp special editions", () => {
  const nyx = { slug: "se-01-nyx-high-priestess", title: "Nyx", cardType: "ORACLE", rarity: "FORBIDDEN", statA: 1, statB: 1, statC: 1, artUrl: "/cards/art/se-01-nyx-high-priestess.webp" } as const;
  const renderNyx = (reduce: boolean) => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(
      <GrimoireApp
        signedIn affinity={null} threshold={5}
        readings={[{ id: "r1", createdAt: "2026-10-01T00:00:00.000Z", question: null, spreadName: null, reflection: null, cards: [card(0, "reversed", nyx)] }]}
      />,
    );
    return screen.getByRole("img", { name: "Nyx, reversed" });
  };

  it("plays the special edition's loop, with its art as the poster", () => {
    const face = renderNyx(false);
    const video = face.querySelector("video");
    expect(video?.getAttribute("src")).toBe("/cards/anim/se-01-nyx-high-priestess.mp4");
    expect(video?.getAttribute("poster")).toBe("/cards/art/se-01-nyx-high-priestess.webp");
    expect(face.style.transform).toBe("rotate(180deg)");
    vi.unstubAllGlobals();
  });

  it("keeps the still art under reduced motion", () => {
    const face = renderNyx(true);
    expect(face.querySelector("video")).toBeNull();
    expect(face.querySelector("img")?.getAttribute("src")).toBe("/cards/art/se-01-nyx-high-priestess.webp");
    vi.unstubAllGlobals();
  });
});
