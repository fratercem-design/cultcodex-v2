"use client";

// Client-only shell for interactive overlays that must not run on the server.
// Imported by the root layout, which is a Server Component; placing dynamic()
// with { ssr: false } here is the correct Next.js 16 pattern.

import dynamic from "next/dynamic";

const AmbientVisualSystem = dynamic(
  () =>
    import("@/components/ambient/AmbientVisualSystem").then(
      (m) => m.AmbientVisualSystem
    ),
  { ssr: false }
);


const KonamiEasterEgg = dynamic(
  () => import("@/components/ui/konami-easter-egg").then((m) => m.KonamiEasterEgg),
  { ssr: false }
);

const CommandPalette = dynamic(
  () => import("@/components/search/command-palette").then((m) => m.CommandPalette),
  { ssr: false }
);

const AppearanceControls = dynamic(
  () => import("@/components/layout/appearance-controls").then((m) => m.AppearanceControls),
  { ssr: false }
);

export function ClientOverlays() {
  return (
    <>
      <AmbientVisualSystem />
      <KonamiEasterEgg />
      <CommandPalette />
      <AppearanceControls />
    </>
  );
}
