"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Reset the terminal scroll container on route change.
 *
 * The app scrolls `#terminal-scroll`, not the document, so Next's built-in
 * scroll restoration (which manages `window`) never touches it. Navigating
 * from a deep scroll position dropped the reader partway down the next page —
 * reproduced at scrollTop 1800 on /episodes landing at 780 on the destination
 * (2026-08 audit).
 *
 * An in-page hash target is left alone so the skip link and anchor links still
 * work, and `scroll-behavior` is bypassed so the reset is instant rather than
 * an animated scroll on every navigation.
 */
export function ScrollReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (window.location.hash) return;
    const container = document.getElementById("terminal-scroll");
    if (!container) return;
    container.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, searchParams]);

  return null;
}
