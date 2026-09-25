"use client";

import { useEffect } from "react";
import { PROPHECIES } from "@/lib/easter-eggs";

/**
 * Easter egg: a styled message in the devtools console for anyone who
 * opens it. Points the curious toward /basement, and leaves an `oracle()`
 * function lying around. Fires once per page load.
 */
export function ConsoleSigil() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & { __codexSigilShown?: boolean };
    if (w.__codexSigilShown) return;
    w.__codexSigilShown = true;
    (w as Window & { oracle?: () => string }).oracle = () =>
      PROPHECIES[Math.floor(Math.random() * PROPHECIES.length)];

    // eslint-disable-next-line no-console
    console.log(
      "%c        ψ        \n%cYou opened the console.\nThe console opened back.\n\n%cThe stairs are behind the footer glyph. Or type the word: %c/basement%c\n\nThe oracle takes questions here too. Call oracle().",
      "color:#a78bfa;font-size:28px;font-family:monospace;",
      "color:#8b8b9e;font-family:monospace;font-size:12px;",
      "color:#8b8b9e;font-family:monospace;font-size:11px;",
      "color:#facc15;font-family:monospace;font-size:11px;font-weight:bold;",
      "color:#8b8b9e;font-family:monospace;font-size:11px;"
    );
  }, []);

  return null;
}
