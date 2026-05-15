import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Episode preview";
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
            backgroundColor: "#0a0a0a",
            color: "#ffffff",
            fontSize: 48,
            fontFamily: "monospace",
          }}
        >
          Episode Not Found
        </div>
      ),
      { ...size }
    );
  }

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  const airDate = episode.airDate
    ? new Date(episode.airDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
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
          backgroundColor: "#0a0a0a",
          padding: "60px",
          fontFamily: "monospace",
        }}
      >
        {/* Top section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {epNum && (
            <div
              style={{
                color: "#00d9ff",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              {epNum}
            </div>
          )}
          <div
            style={{
              color: "#ffffff",
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "900px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {episode.title.length > 80
              ? episode.title.slice(0, 77) + "..."
              : episode.title}
          </div>
          {airDate && (
            <div
              style={{
                color: "#666666",
                fontSize: 22,
              }}
            >
              {airDate}
            </div>
          )}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              color: "#C8A96B",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            CULTCODEX.ME
          </div>
          <div
            style={{
              color: "#333333",
              fontSize: 16,
            }}
          >
            CULT OF PSYCHE ARCHIVE
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
