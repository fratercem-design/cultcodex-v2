import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Topic signal preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      _count: { select: { episodes: true, people: true } },
    },
  });

  if (!topic) {
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
          Signal Not Found
        </div>
      ),
      { ...size }
    );
  }

  const episodeCount = topic._count.episodes;
  const titleTrunc = topic.title.length > 60 ? topic.title.slice(0, 57) + "..." : topic.title;
  // Use first paragraph of description if available
  const descRaw = topic.description ? topic.description.split("\n\n")[0] : null;
  const descTrunc = descRaw
    ? descRaw.length > 110 ? descRaw.slice(0, 107) + "..." : descRaw
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
        {/* Cyan accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #00d9ff 0%, #80efff 50%, #00d9ff 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "52px 56px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div
              style={{
                color: "#00d9ff",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.2em",
                backgroundColor: "rgba(0,217,255,0.07)",
                border: "1px solid rgba(0,217,255,0.2)",
                borderRadius: 3,
                padding: "3px 10px",
                alignSelf: "flex-start",
              }}
            >
              SIGNAL
            </div>

            <div style={{ color: "#f5f0e8", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
              {titleTrunc}
            </div>

            {descTrunc && (
              <div style={{ color: "#666", fontSize: 21, lineHeight: 1.45 }}>
                {descTrunc}
              </div>
            )}

            {episodeCount > 0 && (
              <div style={{ color: "#444", fontSize: 19, marginTop: 4 }}>
                {`${episodeCount} episode${episodeCount !== 1 ? "s" : ""} archived${topic._count.people > 0 ? ` · ${topic._count.people} voice${topic._count.people !== 1 ? "s" : ""}` : ""}`}
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
      </div>
    ),
    { ...size }
  );
}
