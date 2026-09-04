import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const alt = "Join CultCodex — Choose Your Role in the Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TIERS = [
  { name: "OBSERVER", price: "Free", color: "#555555", desc: "Public transmissions" },
  { name: "INITIATE+", price: "$10/mo", color: "#4A2D6E", desc: "Oracle + Psychenomicon" },
  { name: "ORACLE", price: "$25/mo", color: "#C8392E", desc: "Full system access" },
];

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

        <div style={{ display: "flex", flex: 1, padding: "52px 64px" }}>
          {/* Left */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              paddingRight: "52px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  color: "#C8392E",
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                }}
              >
                CULTCODEX.ME / JOIN
              </div>

              <div
                style={{
                  color: "#f5f0e8",
                  fontSize: 60,
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                Choose Your Role.
              </div>

              <div
                style={{
                  color: "#888",
                  fontSize: 23,
                  lineHeight: 1.5,
                }}
              >
                Most people sense there&apos;s more here than they&apos;re seeing.
                There is.
              </div>
            </div>

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
          </div>

          {/* Right — tier cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              justifyContent: "center",
              flexShrink: 0,
              width: 360,
            }}
          >
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: `1px solid ${tier.color}33`,
                  borderLeft: `3px solid ${tier.color}`,
                  borderRadius: 6,
                  padding: "14px 18px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ color: tier.color, fontSize: 15, fontWeight: 700, letterSpacing: "0.1em" }}>
                    {tier.name}
                  </div>
                  <div style={{ color: "#555", fontSize: 12 }}>{tier.desc}</div>
                </div>
                <div style={{ color: "#f5f0e8", fontSize: 18, fontWeight: 700 }}>
                  {tier.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
