"use client";

import { useEffect } from "react";

/**
 * Easter egg: a styled message in the devtools console for anyone who
 * opens it. Points the curious toward /basement. Fires once per page load.
 */
export function ConsoleSigil() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & { __codexSigilShown?: boolean };
    if (w.__codexSigilShown) return;
    w.__codexSigilShown = true;

    // eslint-disable-next-line no-console
    console.log(
      "%c        ψ        \n%cYou opened the console.\nThe console opened back.\n\n%cThe stairs are behind the footer glyph. Or type the word: %c/basement",
      "color:#a78bfa;font-size:28px;font-family:monospace;",
      "color:#8b8b9e;font-family:monospace;font-size:12px;",
      "color:#8b8b9e;font-family:monospace;font-size:11px;",
      "color:#facc15;font-family:monospace;font-size:11px;font-weight:bold;"
    );
  }, []);

  return null;
}
