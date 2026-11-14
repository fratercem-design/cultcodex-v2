/**
 * Skips the top bar and sidebar, landing focus on the single
 * `<main id="main-content">` the root layout renders around every page.
 * Pages no longer render their own `<main>` (2026-11 audit), so the id is
 * present on every route and unique.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-accent-gold focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:font-bold focus:text-void focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
