import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "The Psychenomicon — AI myth engine of the Cult of Psyche";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
        {/* Gold accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #C8392E 0%, #DE8882 50%, #C8392E 100%)",
          }}
        />

        {/* Faint warm glow */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            right: "10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(200, 57, 46,0.1) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", flex: 1, padding: "52px 64px", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
          {/* Top */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                color: "#C8392E",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              CULTCODEX.ME / PSYCHENOMICON
            </div>

            <div
              style={{
                color: "#f5f0e8",
                fontSize: 68,
                fontWeight: 700,
                lineHeight: 1.05,
              }}
            >
              The Psychenomicon.
            </div>

            <div
              style={{
                color: "#888",
                fontSize: 26,
                lineHeight: 1.5,
                maxWidth: 680,
              }}
            >
              A living record of evolving patterns. The myth-engine built from real transcripts — archetypal analysis, symbolic themes, and emergent signals.
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div
              style={{
                color: "#C8392E",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.18em",
              }}
            >
              CULTCODEX.ME
            </div>

            {/* Decorative symbol */}
            <div
              style={{
                color: "rgba(200, 57, 46,0.18)",
                fontSize: 160,
                lineHeight: 1,
              }}
            >
              ✦
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
