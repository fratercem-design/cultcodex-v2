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
            backgroundColor: "#0A0A0F",
            color: "#F3EEDF",
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
          justifyContent: "space-between",
          backgroundColor: "#0A0A0F",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Quote mark */}
        <div style={{ color: "#C8A96B", fontSize: 80, lineHeight: 1, opacity: 0.3 }}>
          {"\u201C"}
        </div>

        {/* Quote text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "#F3EEDF",
              fontSize,
              fontStyle: "italic",
              lineHeight: 1.5,
              maxHeight: "320px",
              overflow: "hidden",
            }}
          >
            {"\u201C"}{quote.text.slice(0, 500)}{quote.text.length > 500 ? "..." : ""}{"\u201D"}
          </div>

          {/* Attribution */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {quote.speaker && (
              <div style={{ color: "#C8A96B", fontSize: 22, fontWeight: 600 }}>
                — {quote.speaker.displayName}
              </div>
            )}
            {quote.episode && (
              <div style={{ color: "#B6AE9B", fontSize: 18 }}>
                {epLabel ? `${epLabel}: ` : ""}
                {quote.episode.title.slice(0, 80)}
              </div>
            )}
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            color: "#C8A96B",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.1em",
            opacity: 0.6,
          }}
        >
          CULTCODEX
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
