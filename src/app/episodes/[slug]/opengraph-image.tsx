import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { ogFonts } from "@/lib/og-fonts";

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
      summaryShort: true,
      thumbnailUrl: true,
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
            backgroundColor: "#080810",
            color: "#ffffff",
            fontSize: 48,
            fontFamily: "monospace",
          }}
        >
          Episode Not Found
        </div>
      ),
      { ...size, fonts: await ogFonts() }
    );
  }

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  const airDate = episode.airDate
    ? new Date(episode.airDate).toLocaleDateString("en-US", { timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const hasThumbnail = !!episode.thumbnailUrl;
  const titleMaxLen = hasThumbnail ? 55 : 75;
  const displayTitle =
    episode.title.length > titleMaxLen
      ? episode.title.slice(0, titleMaxLen - 3) + "..."
      : episode.title;

  const shortDesc = episode.summaryShort
    ? episode.summaryShort.length > 100
      ? episode.summaryShort.slice(0, 97) + "..."
      : episode.summaryShort
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
            background: "linear-gradient(90deg, #C8392E 0%, #DE8882 50%, #C8392E 100%)",
          }}
        />

        <div style={{ display: "flex", flex: 1, padding: "52px 56px 52px 56px" }}>
          {/* Left column — text content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              paddingRight: hasThumbnail ? "48px" : "0",
            }}
          >
            {/* Top: episode number + title + date */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {epNum && (
                  <div
                    style={{
                      color: "#00d9ff",
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      backgroundColor: "rgba(0,217,255,0.08)",
                      border: "1px solid rgba(0,217,255,0.25)",
                      borderRadius: 4,
                      padding: "4px 10px",
                    }}
                  >
                    {epNum}
                  </div>
                )}
                {airDate && (
                  <div style={{ color: "#555", fontSize: 18 }}>{airDate}</div>
                )}
              </div>

              <div
                style={{
                  color: "#f5f0e8",
                  fontSize: hasThumbnail ? 46 : 52,
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                {displayTitle}
              </div>

              {shortDesc && (
                <div
                  style={{
                    color: "#666",
                    fontSize: 20,
                    lineHeight: 1.45,
                    marginTop: 4,
                  }}
                >
                  {shortDesc}
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
                  color: "#C8392E",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                }}
              >
                CULTCODEX.ME
              </div>
              <div style={{ color: "#333", fontSize: 15, letterSpacing: "0.05em" }}>
                CULT OF PSYCHE ARCHIVE
              </div>
            </div>
          </div>

          {/* Right column — thumbnail */}
          {hasThumbnail && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={episode.thumbnailUrl!}
                alt=""
                width={380}
                height={214}
                style={{
                  borderRadius: 8,
                  objectFit: "cover",
                  border: "1px solid rgba(200, 57, 46,0.2)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
