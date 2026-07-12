import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Network Map — Relationship graph of every Cult of Psyche figure";
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #818cf8 0%, #a78bfa 50%, #818cf8 100%)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(129,140,248,0.1) 0%, transparent 70%)" }} />

        <div style={{ display: "flex", flex: 1, padding: "52px 64px", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ color: "#818cf8", fontSize: 17, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              CULTCODEX.ME / NETWORK MAP
            </div>
            <div style={{ color: "#f5f0e8", fontSize: 74, fontWeight: 700, lineHeight: 1.05 }}>
              The Power Structure.
            </div>
            <div style={{ color: "#888", fontSize: 26, lineHeight: 1.5, maxWidth: 700 }}>
              Who appeared with whom, how often, and what orbits formed. Every connection in the Cult of Psyche universe — mapped.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ color: "#C8392E", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em" }}>CULTCODEX.ME</div>
            <div style={{ color: "rgba(129,140,248,0.2)", fontSize: 180, lineHeight: 1, fontWeight: 300 }}>✦</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
