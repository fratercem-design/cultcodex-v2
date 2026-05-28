import { describe, it, expect } from "vitest";
import { renderWithTimestamps } from "../render-timestamps";

// renderWithTimestamps returns ReactNode[] — for pure logic tests we inspect
// what kind of nodes come back (strings vs objects) without rendering to DOM.

describe("renderWithTimestamps", () => {
  it("returns the original string unchanged when no timestamps present", () => {
    const result = renderWithTimestamps("No timestamps here.", null);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("No timestamps here.");
  });

  it("splits text around a single [MM:SS] marker", () => {
    const result = renderWithTimestamps("Event at [12:34] happened.", "abc123");
    // ["Event at ", <a>, " happened."]
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("Event at ");
    expect(result[2]).toBe(" happened.");
  });

  it("splits text around a single [H:MM:SS] marker", () => {
    const result = renderWithTimestamps("See [1:23:45] for details.", "abc123");
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("See ");
    expect(result[2]).toBe(" for details.");
  });

  it("handles multiple timestamps", () => {
    const result = renderWithTimestamps(
      "First [01:00], then [02:00], then [03:00].",
      "abc123"
    );
    // "First ", link, ", then ", link, ", then ", link, "."
    expect(result).toHaveLength(7);
    expect(result[0]).toBe("First ");
    expect(result[2]).toBe(", then ");
    expect(result[4]).toBe(", then ");
    expect(result[6]).toBe(".");
  });

  it("emits a plain-text node for trailing text after last marker", () => {
    const result = renderWithTimestamps("[00:30] intro.", "vid");
    expect(result).toHaveLength(2);
    expect(result[0]).not.toBe("[00:30] intro."); // first node is the link
    expect(result[1]).toBe(" intro.");
  });

  it("returns the text unchanged when it is an empty string", () => {
    const result = renderWithTimestamps("", null);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("");
  });

  it("does not match partial timestamp-like strings (e.g. no brackets)", () => {
    const result = renderWithTimestamps("timestamp 12:34 without brackets", null);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("timestamp 12:34 without brackets");
  });
});

// ── toSeconds parity tests via rendered href ──────────────────────────────────
// We can't import the private function, but we can inspect the React element's
// props via the returned node object.

describe("renderWithTimestamps — YouTube link seconds", () => {
  function hrefOf(node: unknown): string {
    return (node as { props: { href: string } }).props.href;
  }

  it("converts [MM:SS] to correct seconds in href", () => {
    const nodes = renderWithTimestamps("A [02:30] moment.", "VID");
    // 2*60+30 = 150
    expect(hrefOf(nodes[1])).toBe("https://www.youtube.com/watch?v=VID&t=150s");
  });

  it("converts [H:MM:SS] to correct seconds in href", () => {
    const nodes = renderWithTimestamps("A [1:02:03] moment.", "VID");
    // 1*3600+2*60+3 = 3723
    expect(hrefOf(nodes[1])).toBe("https://www.youtube.com/watch?v=VID&t=3723s");
  });

  it("converts [HH:MM:SS] to correct seconds in href", () => {
    const nodes = renderWithTimestamps("[01:00:00] start.", "VID");
    expect(hrefOf(nodes[0])).toBe("https://www.youtube.com/watch?v=VID&t=3600s");
  });
});
