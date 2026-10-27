import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ReadingApp } from "./reading-app";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("ReadingApp spread", () => {
  it("lays out one tarot back per card in the chosen spread", () => {
    const { container } = render(<ReadingApp signedIn={false} />);
    const backs = () => [...container.querySelectorAll("img.rd-back")];
    expect(backs()).toHaveLength(1);
    expect(backs()[0].getAttribute("src")).toBe("/cards/backs/tarot.webp");

    fireEvent.click(screen.getByText("TRANSMISSION"));
    expect(backs()).toHaveLength(3);
  });

  it("turns each drawn card face up, reversed cards upside down", async () => {
    const card = (i: number, orientation: string, face: object | null) => ({
      id: `rc${i}`, position: i, positionName: null, orientation, titleSnapshot: `Card ${i}`,
      uprightMeaning: "up", reversedMeaning: "down", advice: null, oraclePrompt: null,
      element: null, archetype: null, keywords: [], face,
    });
    const painted = { slug: "cop-maj-00", title: "The Fool", cardType: "ORACLE", rarity: "SIGNAL", statA: 1, statB: 1, statC: 1, artUrl: "/cards/art/cop-maj-00.webp" };
    const codex = { slug: "s1-test", title: "Test Card", cardType: "LORE", rarity: "STATIC", statA: 1, statB: 1, statC: 1, artUrl: null, season: 1 };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.includes("/reading")
        ? { reading: { id: "r1", question: null, seed: "seed-12345678", cards: [card(0, "upright", painted), card(1, "reversed", codex)] }, signalRemaining: 5 }
        : { signal: 9, grant: 10, level: 1, xpInto: 0, xpNeed: 10 },
    })));

    // jsdom has no matchMedia; CodexCard reads prefers-reduced-motion through it.
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.useFakeTimers();
    const { container } = render(<ReadingApp signedIn />);
    await act(async () => { await vi.runOnlyPendingTimersAsync(); });
    await act(async () => { fireEvent.click(screen.getByText(/DRAW · 1 SIGNAL/)); });
    await act(async () => { await vi.runAllTimersAsync(); });

    const flips = [...container.querySelectorAll(".rd-flip")];
    expect(flips).toHaveLength(2);
    expect(flips.every((f) => f.classList.contains("is-turned"))).toBe(true);
    expect(flips[0].querySelector("img.rd-art")?.getAttribute("src")).toBe("/cards/art/cop-maj-00.webp");
    expect(flips[0].hasAttribute("data-reversed")).toBe(false);
    expect(flips[1].querySelector(".rd-codex .cx-card")).not.toBeNull();
    expect(flips[1].getAttribute("data-reversed")).toBe("true");
    expect(screen.getByRole("img", { name: "Test Card, reversed" })).toBeTruthy();
  });
});
