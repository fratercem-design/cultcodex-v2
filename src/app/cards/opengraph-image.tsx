import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Codex Cards — Cult of Psyche trading card collection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Card preview data — kept static to avoid DB hit in OG context
const CARD_PREVIEWS = [
  { name: "The Oracle", type: "MAJOR ARCANA", glyph: "◉" },
  { name: "The Cipher", type: "MAJOR ARCANA", glyph: "✦" },
  { name: "Dark Night", type: "THRESHOLD", glyph: "▲" },
  { name: "Transmission I", type: "SIGNAL", glyph: "◈" },
];

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
        {/* Cyan accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #00d9ff 0%, #7fffd4 50%, #00d9ff 100%)",
          }}
        />

        <div style={{ display: "flex", flex: 1, padding: "52px 56px" }}>
          {/* Left — text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              paddingRight: "48px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  color: "#00d9ff",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                }}
              >
                CULTCODEX.ME / CARDS
              </div>

              <div
                style={{
                  color: "#f5f0e8",
                  fontSize: 68,
                  fontWeight: 700,
                  lineHeight: 1.05,
                }}
              >
                Codex Cards.
              </div>

              <div
                style={{
                  color: "#888",
                  fontSize: 23,
                  lineHeight: 1.5,
                  maxWidth: 520,
                }}
              >
                Collect signal credits. Unlock rare cards. Build your deck from the archetypes, voices, and lore of the Cult of Psyche.
              </div>
            </div>

            <div
              style={{
                color: "#C8A96B",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.18em",
              }}
            >
              CULTCODEX.ME
            </div>
          </div>

          {/* Right — card stack preview */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              justifyContent: "center",
              flexShrink: 0,
              width: 340,
            }}
          >
            {CARD_PREVIEWS.map((card) => (
              <div
                key={card.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  backgroundColor: "rgba(0,217,255,0.05)",
                  border: "1px solid rgba(0,217,255,0.15)",
                  borderRadius: 8,
                  padding: "10px 16px",
                }}
              >
                <div style={{ color: "#00d9ff", fontSize: 22, lineHeight: 1 }}>{card.glyph}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ color: "#f5f0e8", fontSize: 15, fontWeight: 700 }}>{card.name}</div>
                  <div style={{ color: "#555", fontSize: 12, letterSpacing: "0.1em" }}>{card.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
