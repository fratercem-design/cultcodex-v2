import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveConnectionString } from "../db";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveConnectionString", () => {
  it.each([
    "postgresql://db.example.test/app",
    "postgresql://db.example.test/app?sslmode=prefer",
    "postgresql://db.example.test/app?sslmode=require",
    "postgresql://db.example.test/app?sslmode=verify-ca",
  ])("forces verify-full in production for %s", (url) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", url);
    expect(new URL(resolveConnectionString()!).searchParams.get("sslmode")).toBe("verify-full");
  });

  it.each(["disable", "allow"])("rejects sslmode=%s in production", (mode) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", `postgresql://db.example.test/app?sslmode=${mode}`);
    expect(() => resolveConnectionString()).toThrow(/insecure PostgreSQL TLS mode/);
  });

  it("preserves verify-full", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://db.example.test/app?sslmode=verify-full");
    expect(new URL(resolveConnectionString()!).searchParams.get("sslmode")).toBe("verify-full");
  });

  it("rejects malformed and non-PostgreSQL URLs", () => {
    vi.stubEnv("DATABASE_URL", "https://db.example.test/app");
    expect(resolveConnectionString()).toBeNull();
    vi.stubEnv("DATABASE_URL", "postgresql://[invalid");
    expect(resolveConnectionString()).toBeNull();
  });
});
