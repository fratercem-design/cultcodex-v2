import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: {
      text: true,
      speaker: { select: { displayName: true } },
      episode: { select: { title: true, episodeNumber: true } },
    },
  });

  if (!quote) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#07060A",
            color: "#EBE3D2",
            fontSize: 36,
            fontFamily: "sans-serif",
          }}
        >
          Quote not found
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const epLabel = quote.episode?.episodeNumber
    ? `EP.${String(quote.episode.episodeNumber).padStart(3, "0")}`
    : null;

  const fontSize = quote.text.length > 300 ? 24 : quote.text.length > 150 ? 30 : 36;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background: "linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #0d001a 100%)",
          fontFamily: "serif",
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            right: "16px",
            bottom: "16px",
            border: "1px solid rgba(255, 215, 0, 0.2)",
            borderRadius: "12px",
            display: "flex",
          }}
        />

        {/* Quote mark */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "40px",
            fontSize: "120px",
            color: "rgba(255, 215, 0, 0.15)",
            lineHeight: "1",
            display: "flex",
          }}
        >
          {"\u201C"}
        </div>

        {/* Quote text */}
        <div
          style={{
            fontSize,
            color: "#f0e6ff",
            lineHeight: 1.5,
            fontStyle: "italic",
            display: "flex",
            marginBottom: "30px",
          }}
        >
          {"\u201C"}{quote.text.slice(0, 400)}{quote.text.length > 400 ? "..." : ""}{"\u201D"}
        </div>

        {/* Attribution */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "2px",
              background: "linear-gradient(90deg, #ffd700, transparent)",
              display: "flex",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {quote.speaker && (
              <div style={{ fontSize: "22px", color: "#ffd700", fontWeight: "bold", display: "flex" }}>
                {quote.speaker.displayName}
              </div>
            )}
            <div style={{ fontSize: "14px", color: "#8b7aa8", display: "flex" }}>
              {epLabel ? `${epLabel} — ` : ""}{quote.episode?.title ? quote.episode.title.slice(0, 60) : ""}  —  cultcodex.me
            </div>
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            right: "40px",
            fontSize: "12px",
            color: "rgba(0, 217, 255, 0.5)",
            letterSpacing: "4px",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          CULT CODEX
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
