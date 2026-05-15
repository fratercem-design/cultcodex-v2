import { describe, it, expect } from "vitest";
import { slugify, buildSearchText } from "../lib";

describe("slugify", () => {
  it("converts title to lowercase kebab-case", () => {
    expect(slugify("Welcome to the Cult")).toBe("welcome-to-the-cult");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Episode #5: The Veil's Edge!")).toBe(
      "episode-5-the-veils-edge"
    );
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("foo  --  bar")).toBe("foo-bar");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });
});

describe("buildSearchText", () => {
  it("joins non-empty parts with spaces", () => {
    expect(buildSearchText("Hello World", "tag one", "tag two")).toBe(
      "hello world tag one tag two"
    );
  });

  it("filters out null and undefined", () => {
    expect(buildSearchText("title", null, undefined, "extra")).toBe(
      "title extra"
    );
  });

  it("lowercases everything", () => {
    expect(buildSearchText("SHOUT", "Loud")).toBe("shout loud");
  });
});
