import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";

const VIOLET = "#6E4BAE";
const CYAN = "#62E4C8";
const BONE = "#EBE3D2";
const VOID = "#07060A";
const MUTED = "#9A907D";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = truncate(searchParams.get("q") ?? "", 120);
  const a = truncate(searchParams.get("a") ?? "", 240);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: VOID,
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Outer border */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: `1px solid ${VIOLET}33`,
            borderRadius: 12,
            display: "flex",
          }}
        />

        {/* Gradient overlay — violet to cyan sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 20% 50%, ${VIOLET}18 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, ${CYAN}10 0%, transparent 60%)`,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 72px",
            gap: 0,
          }}
        >
          {/* Top label row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <span style={{ fontSize: 36, color: VIOLET, lineHeight: 1 }}>◉</span>
            <div
              style={{
                fontSize: 11,
                color: VIOLET,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                fontFamily: "monospace",
                opacity: 0.8,
                display: "flex",
              }}
            >
              CULT CODEX · THE ORACLE SPEAKS
            </div>
          </div>

          {/* Question */}
          {q && (
            <div
              style={{
                fontSize: 15,
                color: MUTED,
                letterSpacing: "0.08em",
                fontFamily: "monospace",
                marginBottom: 20,
                display: "flex",
              }}
            >
              Q: {q}
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 1,
              backgroundColor: VIOLET,
              opacity: 0.4,
              marginBottom: 28,
              display: "flex",
            }}
          />

          {/* Answer */}
          <div
            style={{
              fontSize: a.length > 160 ? 22 : 26,
              color: BONE,
              lineHeight: 1.55,
              fontStyle: "italic",
              maxWidth: 900,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {a || "The archive holds many answers."}
          </div>
        </div>

        {/* Bottom label */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 52,
            fontSize: 11,
            color: CYAN,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            opacity: 0.6,
            display: "flex",
          }}
        >
          cultcodex.me/oracle
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts() },
  );
}
