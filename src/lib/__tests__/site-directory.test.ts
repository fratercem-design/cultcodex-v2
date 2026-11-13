import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { SITE_DIRECTORY } from "@/lib/site-directory";

const APP_DIR = path.join(__dirname, "..", "..", "app");
const links = SITE_DIRECTORY.flatMap((g) => g.links);

/** True when `dir` (or a route group directly inside it) holds a page file. */
function hasPage(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;
  if (fs.existsSync(path.join(dir, "page.tsx"))) return true;
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .some((e) => e.isDirectory() && e.name.startsWith("(") && fs.existsSync(path.join(dir, e.name, "page.tsx")));
}

describe("site directory", () => {
  it("lists each page once", () => {
    const hrefs = links.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it.each(links.map((l) => l.href))("%s is a real route", (href) => {
    expect(hasPage(path.join(APP_DIR, ...href.split("/").filter(Boolean)))).toBe(true);
  });
});
