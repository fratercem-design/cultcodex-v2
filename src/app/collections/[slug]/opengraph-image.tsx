import { ImageResponse } from "next/og";
import { getCollectionBySlug } from "@/lib/collections/themed-collections";

export const runtime = "nodejs";
export const alt = "Collection preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT_COLORS: Record<string, string> = {
  violet: "#9b59b6",
  cyan: "#00d9ff",
  gold: "#C8A96B",
  crimson: "#dc2626",
  mixed: "#C8A96B",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

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
      Collection Not Found
    </div>
  );

  if (!collection) return new ImageResponse(fallback, { ...size });

  const accentColor = ACCENT_COLORS[collection.accent] ?? "#C8A96B";

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
              color: accentColor,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            {collection.eyebrow.toUpperCase()}
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: "980px",
            }}
          >
            {collection.title.length > 65
              ? collection.title.slice(0, 62) + "..."
              : collection.title}
          </div>
          <div
            style={{
              color: "#555555",
              fontSize: 22,
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            {collection.subtitle.length > 90
              ? collection.subtitle.slice(0, 87) + "..."
              : collection.subtitle}
          </div>
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
