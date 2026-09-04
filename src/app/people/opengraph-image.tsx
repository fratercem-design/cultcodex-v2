import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const alt = "Voices — Every recurring figure in the Cult of Psyche archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #22d3ee 0%, #67e8f9 50%, #22d3ee 100%)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, transparent 70%)" }} />

        <div style={{ display: "flex", flex: 1, padding: "52px 64px", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ color: "#22d3ee", fontSize: 17, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              CULTCODEX.ME / VOICES
            </div>
            <div style={{ color: "#f5f0e8", fontSize: 74, fontWeight: 700, lineHeight: 1.05 }}>
              Every Voice, Profiled.
            </div>
            <div style={{ color: "#888", fontSize: 26, lineHeight: 1.5, maxWidth: 700 }}>
              Every recurring figure in the Cult of Psyche universe — their arc, relationships, behavioral patterns, and every episode they appeared in.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ color: "#C8392E", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em" }}>CULTCODEX.ME</div>
            <div style={{ color: "rgba(34,211,238,0.2)", fontSize: 180, lineHeight: 1, fontWeight: 300 }}>◐</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
