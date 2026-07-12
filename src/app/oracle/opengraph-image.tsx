import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Ask the Oracle — AI search across the Cult of Psyche archive";
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
        {/* Violet accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #7c3aed 0%, #4A2D6E 50%, #7c3aed 100%)",
          }}
        />

        {/* Faint radial glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", flex: 1, padding: "52px 64px", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
          {/* Top: badge + headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                color: "#4A2D6E",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              CULTCODEX.ME / ORACLE
            </div>

            <div
              style={{
                color: "#f5f0e8",
                fontSize: 74,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              Ask the Oracle.
            </div>

            <div
              style={{
                color: "#888",
                fontSize: 26,
                lineHeight: 1.5,
                maxWidth: 700,
              }}
            >
              AI trained on 2,500+ transmissions. Real answers drawn from transcripts, lore, and behavioral profiles — with citations.
            </div>
          </div>

          {/* Bottom: glyph + branding */}
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

            {/* Large decorative glyph */}
            <div
              style={{
                color: "rgba(74, 45, 110,0.25)",
                fontSize: 180,
                lineHeight: 1,
                fontWeight: 300,
              }}
            >
              ◉
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
