import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ACCENT: Record<string, string> = {
  violet: "#4A2D6E",
  cyan: "#62E4C8",
  gold: "#C8392E",
  crimson: "#A94A4A",
};

interface OgOpts {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: keyof typeof ACCENT | string;
}

/**
 * Shared branded OpenGraph card for marketing / feature pages.
 * Each route's opengraph-image.tsx exports size/contentType/runtime and
 * a default that calls this with its copy.
 */
export function createOgImage({ eyebrow, title, subtitle, accent = "gold" }: OgOpts): ImageResponse {
  const hex = ACCENT[accent] ?? ACCENT.gold;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#080810",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -200,
            left: 380,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hex}26 0%, transparent 70%)`,
          }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: hex }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "52px 56px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ color: hex, fontSize: 20, fontWeight: 700, letterSpacing: "0.25em" }}>
              {eyebrow.toUpperCase()}
            </div>
            <div style={{ color: "#ffffff", fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
              {title}
            </div>
            {subtitle ? (
              <div style={{ color: "#9a9488", fontSize: 26, maxWidth: 880, lineHeight: 1.4 }}>
                {subtitle.length > 110 ? subtitle.slice(0, 107) + "..." : subtitle}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ color: "#C8392E", fontSize: 24, fontWeight: 700, letterSpacing: "0.15em" }}>
              CULTCODEX.ME
            </div>
            <div style={{ color: "#444444", fontSize: 16, letterSpacing: "0.1em" }}>
              CULT OF PSYCHE ARCHIVE
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
