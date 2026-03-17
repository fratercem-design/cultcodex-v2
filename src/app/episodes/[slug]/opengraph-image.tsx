import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "CultCodex Episode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: {
      title: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      series: { select: { title: true } },
    },
  });

  if (!episode) {
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
            fontFamily: "sans-serif",
            fontSize: 48,
          }}
        >
          Episode Not Found
        </div>
      ),
      { ...size },
    );
  }

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  const airDate = episode.airDate
    ? new Date(episode.airDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

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
        {/* Top: Badge area */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {epNum && (
            <div
              style={{
                backgroundColor: "rgba(200, 169, 107, 0.15)",
                border: "1px solid rgba(200, 169, 107, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#C8A96B",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {epNum}
            </div>
          )}
          {episode.series && (
            <div
              style={{
                backgroundColor: "rgba(110, 75, 174, 0.15)",
                border: "1px solid rgba(110, 75, 174, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#6E4BAE",
                fontSize: 20,
              }}
            >
              {episode.series.title}
            </div>
          )}
        </div>

        {/* Middle: Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              color: "#F3EEDF",
              fontSize: episode.title.length > 60 ? 36 : 48,
              fontWeight: 700,
              lineHeight: 1.2,
              maxHeight: "200px",
              overflow: "hidden",
            }}
          >
            {episode.title}
          </div>
          {episode.summaryShort && (
            <div
              style={{
                color: "#B6AE9B",
                fontSize: 20,
                lineHeight: 1.4,
                maxHeight: "60px",
                overflow: "hidden",
              }}
            >
              {episode.summaryShort.slice(0, 150)}
              {episode.summaryShort.length > 150 ? "..." : ""}
            </div>
          )}
        </div>

        {/* Bottom: Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              color: "#C8A96B",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            CULTCODEX
          </div>
          {airDate && (
            <div style={{ color: "#B6AE9B", fontSize: 18 }}>{airDate}</div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
