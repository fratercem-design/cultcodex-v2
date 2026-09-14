import { afterEach, describe, expect, it } from "vitest";
import { resolveConnectionString } from "../db";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

describe("resolveConnectionString", () => {
  it.each([
    "postgresql://db.example.test/app",
    "postgresql://db.example.test/app?sslmode=prefer",
    "postgresql://db.example.test/app?sslmode=require",
    "postgresql://db.example.test/app?sslmode=verify-ca",
  ])("forces verify-full in production for %s", (url) => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = url;
    expect(new URL(resolveConnectionString()!).searchParams.get("sslmode")).toBe("verify-full");
  });

  it.each(["disable", "allow"])("rejects sslmode=%s in production", (mode) => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = `postgresql://db.example.test/app?sslmode=${mode}`;
    expect(() => resolveConnectionString()).toThrow(/insecure PostgreSQL TLS mode/);
  });

  it("preserves verify-full", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://db.example.test/app?sslmode=verify-full";
    expect(new URL(resolveConnectionString()!).searchParams.get("sslmode")).toBe("verify-full");
  });

  it("rejects malformed and non-PostgreSQL URLs", () => {
    process.env.DATABASE_URL = "https://db.example.test/app";
    expect(resolveConnectionString()).toBeNull();
    process.env.DATABASE_URL = "postgresql://%";
    expect(resolveConnectionString()).toBeNull();
  });
});
