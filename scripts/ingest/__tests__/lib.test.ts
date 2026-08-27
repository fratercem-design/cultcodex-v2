import { describe, it, expect } from "vitest";
import { slugify, buildSearchText, assertUsableDatabaseUrl } from "../lib";

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

describe("assertUsableDatabaseUrl", () => {
  it("accepts a real connection string", () => {
    expect(() =>
      assertUsableDatabaseUrl("postgresql://user:pw@host.example.com:5432/db")
    ).not.toThrow();
  });

  it("rejects an unset value with a pointer to .env.local", () => {
    expect(() => assertUsableDatabaseUrl(undefined)).toThrow(/\.env\.local/);
    expect(() => assertUsableDatabaseUrl("")).toThrow(/not set/);
  });

  it("rejects the [SENSITIVE] placeholder vercel env pull writes", () => {
    expect(() =>
      assertUsableDatabaseUrl("postgresql://user:[SENSITIVE]@base:5432/db")
    ).toThrow(/SENSITIVE/);
  });
});
