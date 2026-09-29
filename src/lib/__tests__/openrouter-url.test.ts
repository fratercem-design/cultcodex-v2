import { describe, expect, it } from "vitest";
import { OPENROUTER_DEFAULT_BASE_URL, openRouterBaseURL } from "@/lib/openrouter-url";

describe("openRouterBaseURL", () => {
  it("defaults to OpenRouter when no override is set", () => {
    expect(openRouterBaseURL(undefined)).toBe(OPENROUTER_DEFAULT_BASE_URL);
    expect(openRouterBaseURL("")).toBe(OPENROUTER_DEFAULT_BASE_URL);
  });

  it("keeps an https override", () => {
    expect(openRouterBaseURL("https://proxy.example/v1")).toBe("https://proxy.example/v1");
  });

  it("refuses a cleartext override so the key is never sent over http", () => {
    expect(() => openRouterBaseURL("http://proxy.example/v1")).toThrow(/https/);
  });
});
