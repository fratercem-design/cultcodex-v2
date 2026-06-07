import { ImageResponse } from "next/og";
import { getPillarBySlug } from "@/lib/pillars/pillars";

export const runtime = "nodejs";
export const alt = "CultCodex pillar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT_COLORS: Record<string, string> = {
  violet: "#9B6ED0",
  cyan: "#5DB7D8",
  gold: "#C8A96B",
  crimson: "#A94A4A",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;
  const p = getPillarBySlug(pillar);

  if (!p) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#080810",
            color: "#ffffff",
            fontSize: 48,
            fontFamily: "monospace",
          }}
        >
          CultCodex
        </div>
      ),
      { ...size }
    );
  }

  const accent = ACCENT_COLORS[p.accent] ?? "#C8A96B";

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
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: 400,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}26 0%, transparent 70%)`,
          }}
        />
        {/* Accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: accent }} />

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
            <div style={{ color: accent, fontSize: 20, fontWeight: 700, letterSpacing: "0.25em" }}>
              EXPLORE THE ARCHIVE
            </div>
            <div style={{ color: "#ffffff", fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
              {p.title}
            </div>
            <div style={{ color: "#9a9488", fontSize: 26, maxWidth: 880, lineHeight: 1.4 }}>
              {p.tagline.length > 100 ? p.tagline.slice(0, 97) + "..." : p.tagline}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ color: "#C8A96B", fontSize: 24, fontWeight: 700, letterSpacing: "0.15em" }}>
              CULTCODEX.ME
            </div>
            <div style={{ color: "#444444", fontSize: 16, letterSpacing: "0.1em" }}>
              CULT OF PSYCHE ARCHIVE
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
