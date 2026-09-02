import { ImageResponse } from "next/og";
import { SYMBOLS } from "@/lib/symbols/data";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return SYMBOLS.map((s) => ({ slug: s.slug }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const symbol = SYMBOLS.find((s) => s.slug === slug) ?? SYMBOLS[0];

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
        {/* Gold accent bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, #C8392E 0%, #DE8882 50%, #C8392E 100%)",
          }}
        />

        {/* Glow behind glyph */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(200, 57, 46,0.12) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "52px 64px",
            flexDirection: "row",
            gap: 60,
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Left: Glyph */}
          <div
            style={{
              color: "#C8392E",
              fontSize: 200,
              lineHeight: 1,
              flexShrink: 0,
              filter: "drop-shadow(0 0 30px rgba(200, 57, 46,0.6))",
            }}
          >
            {symbol.glyph}
          </div>

          {/* Right: Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#C8392E",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              CULTCODEX.ME / SYMBOLS
            </div>

            <div
              style={{
                color: "#f5f0e8",
                fontSize: 60,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {symbol.name}
            </div>

            <div
              style={{
                color: "#888",
                fontSize: 22,
                lineHeight: 1.5,
                maxWidth: 520,
              }}
            >
              {symbol.tagline}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 8,
              }}
            >
              <div
                style={{
                  color: "#C8392E",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(200, 57, 46,0.4)",
                  padding: "4px 12px",
                  borderRadius: 4,
                }}
              >
                {symbol.category.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, #C8392E 50%, transparent 100%)",
          }}
        />
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
