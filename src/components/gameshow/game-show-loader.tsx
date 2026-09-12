"use client";

import dynamic from "next/dynamic";

// Load the board CLIENT-ONLY (ssr:false). The board is a self-contained
// interactive tool with no SEO value in its markup, and rendering it only on
// the client keeps it out of the server streaming/Suspense path that was
// leaving it stuck in a never-revealed boundary.
const GameShow = dynamic(() => import("./game-show").then((m) => m.GameShow), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-accent-violet-text/70 animate-pulse">
        {"/// summoning_the_show…"}
      </p>
    </div>
  ),
});

export function GameShowLoader() {
  return <GameShow />;
}
