import { describe, expect, it } from "vitest";
import { OPENROUTER_DEFAULT_BASE_URL, openRouterBaseURL, requireHttps } from "@/lib/openrouter-url";

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

describe("requireHttps", () => {
  it("passes an https URL through unchanged", () => {
    expect(requireHttps("https://api.hcnsec.cn/v1", "ART_API_BASE_URL")).toBe("https://api.hcnsec.cn/v1");
  });

  it("names the setting when it refuses a cleartext URL", () => {
    expect(() => requireHttps("http://art.example/v1", "ART_API_BASE_URL")).toThrow("ART_API_BASE_URL must use https");
  });
});
