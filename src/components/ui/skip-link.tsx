/**
 * Skips the top bar and sidebar, landing focus on the scroll container that
 * wraps all page content. Targets `#terminal-scroll` rather than
 * `#main-content` because only ~86 of the app's page routes render a
 * `<main id="main-content">`; the container is present on every route and is
 * unique, which the old shared `main-content` id on the layout was not
 * (2026-08 audit).
 */
export function SkipLink() {
  return (
    <a
      href="#terminal-scroll"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-accent-gold focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:font-bold focus:text-void focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
