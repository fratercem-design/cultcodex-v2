import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { ogFonts } from "@/lib/og-fonts";
import { isRemovedLore } from "@/lib/lore/removed-lore";

export const runtime = "nodejs";
export const alt = "Lore entry preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CANON_LABELS: Record<string, string> = {
  canonical:       "CANONICAL LORE",
  speculative:     "SPECULATIVE",
  community_myth:  "COMMUNITY MYTH",
  disputed:        "DISPUTED",
  humorous:        "HUMOROUS",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const entry = isRemovedLore(slug) ? null : await prisma.loreEntry.findUnique({
    where: { slug },
    select: {
      title: true,
      category: true,
      summary: true,
      canonStatus: true,
      _count: { select: { episodes: true } },
    },
  });

  if (!entry) {
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
          Lore Not Found
        </div>
      ),
      { ...size, fonts: await ogFonts() }
    );
  }

  const canonLabel = CANON_LABELS[entry.canonStatus] ?? entry.canonStatus.replace("_", " ").toUpperCase();
  const categoryLabel = entry.category ? entry.category.toUpperCase() : "LORE";
  const titleTrunc = entry.title.length > 60 ? entry.title.slice(0, 57) + "..." : entry.title;
  const summaryTrunc = entry.summary
    ? entry.summary.length > 110 ? entry.summary.slice(0, 107) + "..." : entry.summary
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
        {/* Violet accent bar — lore uses violet */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #7c3aed 100%)",
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
            {/* Category + canon status */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  color: "#a78bfa",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  backgroundColor: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  borderRadius: 3,
                  padding: "3px 10px",
                }}
              >
                {categoryLabel}
              </div>
              <div style={{ color: "#444", fontSize: 16, letterSpacing: "0.1em" }}>
                {canonLabel}
              </div>
            </div>

            <div style={{ color: "#f5f0e8", fontSize: 62, fontWeight: 700, lineHeight: 1.1 }}>
              {titleTrunc}
            </div>

            {summaryTrunc && (
              <div style={{ color: "#666", fontSize: 21, lineHeight: 1.45 }}>
                {summaryTrunc}
              </div>
            )}

            {entry._count.episodes > 0 && (
              <div style={{ color: "#444", fontSize: 19, marginTop: 4 }}>
                {`Referenced in ${entry._count.episodes} episode${entry._count.episodes !== 1 ? "s" : ""}`}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ color: "#C8392E", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em" }}>
              CULTCODEX.ME
            </div>
            <div style={{ color: "#333", fontSize: 15, letterSpacing: "0.05em" }}>
              CULT OF PSYCHE ARCHIVE
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
