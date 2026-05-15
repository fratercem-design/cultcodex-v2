import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Series preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const series = await prisma.series.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      _count: { select: { episodes: true } },
    },
  });

  const fallback = (
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
      Series Not Found
    </div>
  );

  if (!series) return new ImageResponse(fallback, { ...size });

  const epCount = series._count.episodes;

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
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#C8A96B",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            SERIES
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: "980px",
            }}
          >
            {series.title.length > 65
              ? series.title.slice(0, 62) + "..."
              : series.title}
          </div>
          {epCount > 0 && (
            <div style={{ color: "#444444", fontSize: 22 }}>
              {epCount} episode{epCount !== 1 ? "s" : ""} in this series
            </div>
          )}
        </div>

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
          <div style={{ color: "#333333", fontSize: 16 }}>
            CULT OF PSYCHE ARCHIVE
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
