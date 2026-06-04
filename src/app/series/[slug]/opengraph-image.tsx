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
      coverImageUrl: true,
      type: true,
      _count: { select: { episodes: true } },
    },
  });

  if (!series) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#080810",
            color: "#ffffff",
            fontSize: 48,
            fontFamily: "monospace",
          }}
        >
          Series Not Found
        </div>
      ),
      { ...size }
    );
  }

  const epCount = series._count.episodes;
  const typeLabel = series.type.replace("_", " ").toUpperCase();
  const hasCover = !!series.coverImageUrl;
  const titleTrunc = series.title.length > (hasCover ? 45 : 65)
    ? series.title.slice(0, hasCover ? 42 : 62) + "..."
    : series.title;
  const descTrunc = series.description
    ? series.description.length > 100 ? series.description.slice(0, 97) + "..." : series.description
    : null;

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
            background: "linear-gradient(90deg, #C8A96B 0%, #e8c98b 50%, #C8A96B 100%)",
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
              paddingRight: hasCover ? "48px" : "0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div
                style={{
                  color: "#C8A96B",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  backgroundColor: "rgba(200,169,107,0.08)",
                  border: "1px solid rgba(200,169,107,0.2)",
                  borderRadius: 3,
                  padding: "3px 10px",
                  alignSelf: "flex-start",
                }}
              >
                {typeLabel}
              </div>

              <div style={{ color: "#f5f0e8", fontSize: hasCover ? 52 : 64, fontWeight: 700, lineHeight: 1.1 }}>
                {titleTrunc}
              </div>

              {descTrunc && (
                <div style={{ color: "#666", fontSize: 21, lineHeight: 1.45 }}>
                  {descTrunc}
                </div>
              )}

              {epCount > 0 && (
                <div style={{ color: "#444", fontSize: 19, marginTop: 4 }}>
                  {`${epCount} episode${epCount !== 1 ? "s" : ""} in this series`}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ color: "#C8A96B", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em" }}>
                CULTCODEX.ME
              </div>
              <div style={{ color: "#333", fontSize: 15, letterSpacing: "0.05em" }}>
                CULT OF PSYCHE ARCHIVE
              </div>
            </div>
          </div>

          {/* Right — cover image */}
          {hasCover && (
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={series.coverImageUrl!}
                alt=""
                width={380}
                height={380}
                style={{
                  borderRadius: 8,
                  objectFit: "cover",
                  border: "1px solid rgba(200,169,107,0.2)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
