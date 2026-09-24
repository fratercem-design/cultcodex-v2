import { describe, it, expect } from "vitest";
import { readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Structural guard for the sitewide soft-404.
 *
 * Verified against a local production server: a `loading.tsx` at or above a
 * route segment wraps that segment in a Suspense boundary, so Next flushes the
 * shell — with a 200 — before the page body can call `notFound()`. HTTP does
 * not allow the status to change after the response has begun, so the route
 * answers 200 for every nonexistent slug and Google records a soft 404.
 *
 * Measured before the fix, every content type returned 200 for a slug that does
 * not exist. Removing the shadowing `loading.tsx` (or scoping it into an
 * `(index)` route group beside its dynamic sibling) returned a real 404.
 *
 * The trade-off is genuine and deliberate: a route can have an instant skeleton
 * OR a correct 404 status, never both. Listing routes keep their skeleton —
 * their URLs are fixed and always exist, so they can never 404. Detail routes
 * give it up, because their URL space is unbounded.
 *
 * `/admin` is exempt: it is auth-gated and already `noindex, nofollow`, so its
 * status code carries no SEO weight and the skeleton is worth more there.
 */

const APP = join(process.cwd(), "src", "app");
const DYNAMIC_SEGMENT = /^\[.+\]$/;
const ROUTE_GROUP = /^\(.+\)$/;

/** Every directory under src/app that is a dynamic segment holding a page. */
function findDynamicPageDirs(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry === "api" || entry === "_components") continue;
    if (DYNAMIC_SEGMENT.test(entry) && existsSync(join(full, "page.tsx"))) acc.push(full);
    findDynamicPageDirs(full, acc);
  }
  return acc;
}

/**
 * Walk from a dynamic page directory up to src/app, collecting any loading.tsx
 * that would wrap it. A loading.tsx inside a route group `(x)` beside the
 * dynamic segment does NOT wrap it — that is exactly the escape hatch used to
 * keep listing skeletons without breaking detail-route status codes.
 */
function shadowingLoadingFiles(dynamicDir: string): string[] {
  const found: string[] = [];
  let cur = dynamicDir;
  while (cur.startsWith(APP)) {
    const candidate = join(cur, "loading.tsx");
    if (existsSync(candidate)) found.push(relative(APP, candidate));
    if (cur === APP) break;
    cur = join(cur, "..");
  }
  return found;
}

describe("no loading.tsx shadows a dynamic route (soft-404 guard)", () => {
  const dynamicDirs = findDynamicPageDirs(APP);

  it("finds the dynamic routes it is meant to protect", () => {
    // sanity: if this ever hits zero the test has stopped testing anything
    expect(dynamicDirs.length).toBeGreaterThan(5);
  });

  it("leaves every public dynamic route free of a shadowing loading.tsx", () => {
    const offenders: string[] = [];

    for (const dir of dynamicDirs) {
      const rel = relative(APP, dir).split(sep).join("/");
      if (rel.startsWith("admin/")) continue; // auth-gated + noindex, exempt

      const shadows = shadowingLoadingFiles(dir);
      if (shadows.length > 0) {
        offenders.push(`${rel}  <-  ${shadows.join(", ")}`);
      }
    }

    expect(
      offenders,
      "A loading.tsx at or above these dynamic routes flushes a 200 shell before " +
        "notFound() can set the status, producing a soft 404. Move the loading.tsx " +
        "into an (index) route group beside the dynamic segment, or delete it.\n" +
        offenders.join("\n")
    ).toEqual([]);
  });

  it("still allows listing routes to keep a skeleton via an (index) group", () => {
    // /topics keeps its skeleton at topics/(index)/loading.tsx while
    // /topics/[slug] stays unshadowed — proves the escape hatch works.
    const topicsIndex = join(APP, "topics", "(index)", "loading.tsx");
    const topicsSlug = join(APP, "topics", "[slug]");
    if (!existsSync(topicsSlug)) return; // route removed; nothing to assert
    expect(existsSync(topicsIndex)).toBe(true);
    expect(shadowingLoadingFiles(topicsSlug)).toEqual([]);
  });

  it("route groups are not mistaken for real path segments", () => {
    const groups = readdirSync(APP).filter(
      (e) => ROUTE_GROUP.test(e) && statSync(join(APP, e)).isDirectory()
    );
    // (home) scopes the root skeleton to "/" only
    expect(groups).toContain("(home)");
  });
});
