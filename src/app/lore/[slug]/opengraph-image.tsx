import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Lore entry preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const entry = await prisma.loreEntry.findUnique({
    where: { slug },
    select: {
      title: true,
      category: true,
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
      Lore Not Found
    </div>
  );

  if (!entry) return new ImageResponse(fallback, { ...size });

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
              color: "#9b59b6",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            {entry.category ? entry.category.toUpperCase() : "LORE"}
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: "980px",
            }}
          >
            {entry.title.length > 60
              ? entry.title.slice(0, 57) + "..."
              : entry.title}
          </div>
          {entry._count.episodes > 0 && (
            <div style={{ color: "#444444", fontSize: 22 }}>
              Referenced in {entry._count.episodes} episode
              {entry._count.episodes !== 1 ? "s" : ""}
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
