import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ThresholdHero } from "../threshold-hero";

// The threshold is a full-viewport "you have arrived" moment. It is worth one
// screen of someone's attention exactly once; on every later visit it is a
// scroll tax in front of the archive they came back for. These tests pin that
// a returning visitor gets the compact band and a first-time one does not.

// jsdom has no IntersectionObserver. The component uses one to gate its
// keyboard handler; without a stub that effect throws during commit and takes
// the rest of the mount effects down with it.
class IOStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", IOStub);

const props = {
  txId: "TX-20260912",
  dateLabel: "2026.09.12",
  episodeCount: 3028,
  transcribedPct: 56,
};

describe("ThresholdHero", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the full threshold for a first-time visitor", async () => {
    const { container } = render(<ThresholdHero {...props} />);
    const section = container.querySelector(".threshold")!;
    // Give the mount effect a chance to run before asserting the negative.
    await waitFor(() => expect(section).toBeTruthy());
    expect(section.classList.contains("threshold--compact")).toBe(false);
  });

  it("collapses to a band once the visitor has crossed it before", async () => {
    localStorage.setItem("ccx.threshold.seen", "1");
    const { container } = render(<ThresholdHero {...props} />);
    const section = container.querySelector(".threshold")!;
    await waitFor(() =>
      expect(section.classList.contains("threshold--compact")).toBe(true)
    );
  });

  it("records the crossing so the next visit is compact", async () => {
    render(<ThresholdHero {...props} />);
    const enter = screen.getByRole("button", { name: /enter/i });
    enter.click();
    await waitFor(() =>
      expect(localStorage.getItem("ccx.threshold.seen")).toBe("1")
    );
  });

  it("survives storage being unavailable", async () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { container } = render(<ThresholdHero {...props} />);
    // Private mode must fall back to the full threshold, not crash the page.
    expect(container.querySelector(".threshold")).toBeTruthy();
    spy.mockRestore();
  });
});
