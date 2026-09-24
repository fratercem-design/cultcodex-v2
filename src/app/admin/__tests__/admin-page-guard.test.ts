// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// The admin layout redirects non-admins, but the App Router renders a layout
// and its page in parallel: a page that queries data still streams it in the
// body of the layout's 307. Every server-rendered admin page must therefore
// gate itself with requireAdminPage() before it touches the database.

const ADMIN_DIR = path.resolve(import.meta.dirname, "..");

function findPages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : findPages(full);
    return name === "page.tsx" ? [full] : [];
  });
}

const serverPages = findPages(ADMIN_DIR).filter(
  (file) => !/^\s*["']use client["']/.test(readFileSync(file, "utf-8")),
);

describe("admin pages", () => {
  it("finds the admin pages", () => {
    expect(serverPages.length).toBeGreaterThan(20);
  });

  it.each(serverPages.map((f) => [path.relative(ADMIN_DIR, f), f]))(
    "%s calls requireAdminPage() first",
    (_rel, file) => {
      const src = readFileSync(file, "utf-8");
      const body = src.match(/export default async function \w+\([^\n]*\)[^\n]*\{\s*([^\n]*)/);
      expect(body, "default export must be an async function").not.toBeNull();
      expect(body![1].trim()).toBe("await requireAdminPage();");
    },
  );
});
