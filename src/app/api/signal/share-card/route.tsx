import { ImageResponse } from "next/og";
import { getDailyTransmission } from "@/lib/queries/daily";
import { cleanTranscriptText } from "@/lib/format/text";

export const runtime = "nodejs";

// The dossier's "one-click share this sigil" artifact (Ch. IV): a
// 1080x1350 IG-ready ember card citing the day's quote + episode. Distinct
// from opengraph-image.tsx (1200x630, used for link-preview meta tags) —
// this is the actual downloadable/shareable image asset, portrait-ratio
// to match Instagram feed/story dimensions.
export async function GET() {
  const data = await getDailyTransmission().catch(() => null);
  const quote = data?.quote ?? null;
  const episode = quote?.episode ?? data?.spotlightEpisode ?? null;

  const quoteText = quote ? cleanTranscriptText(quote.text) : null;
  const displayQuote =
    quoteText && quoteText.length > 240 ? quoteText.slice(0, 237) + "…" : quoteText;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#080810",
          backgroundImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(200,169,107,0.14), transparent 65%)",
          fontFamily: "monospace",
          padding: "80px 72px",
          position: "relative",
        }}
      >
        {/* Corner brackets — echoes the terminal-shell chrome */}
        <div style={{ position: "absolute", top: 32, left: 32, width: 28, height: 28, borderTop: "2px solid #C8A96B", borderLeft: "2px solid #C8A96B", opacity: 0.6 }} />
        <div style={{ position: "absolute", top: 32, right: 32, width: 28, height: 28, borderTop: "2px solid #C8A96B", borderRight: "2px solid #C8A96B", opacity: 0.6 }} />
        <div style={{ position: "absolute", bottom: 32, left: 32, width: 28, height: 28, borderBottom: "2px solid #C8A96B", borderLeft: "2px solid #C8A96B", opacity: 0.6 }} />
        <div style={{ position: "absolute", bottom: 32, right: 32, width: 28, height: 28, borderBottom: "2px solid #C8A96B", borderRight: "2px solid #C8A96B", opacity: 0.6 }} />

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ color: "#00d9ff", fontSize: 22, letterSpacing: "0.5em", fontWeight: 700 }}>
            ✦ TODAY&apos;S SIGNAL ✦
          </div>
          {data && (
            <div style={{ color: "#555", fontSize: 18, letterSpacing: "0.1em" }}>
              TX-{data.date.replace(/-/g, "")}
            </div>
          )}
        </div>

        {/* Quote body */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px", padding: "0 20px" }}>
          {displayQuote ? (
            <div
              style={{
                color: "#f5f0e8",
                fontSize: 52,
                fontStyle: "italic",
                lineHeight: 1.4,
                textAlign: "center",
              }}
            >
              &ldquo;{displayQuote}&rdquo;
            </div>
          ) : (
            <div style={{ color: "#f5f0e8", fontSize: 52, textAlign: "center" }}>
              The vault is quiet today.
            </div>
          )}

          {(quote?.speaker || episode) && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              {quote?.speaker && (
                <div style={{ color: "#C8A96B", fontSize: 26, fontWeight: 700 }}>
                  {quote.speaker.displayName}
                </div>
              )}
              {episode && (
                <div style={{ color: "#888", fontSize: 22, textAlign: "center" }}>
                  {episode.episodeNumber != null ? `EP.${String(episode.episodeNumber).padStart(3, "0")} · ` : ""}
                  {episode.title.length > 70 ? episode.title.slice(0, 67) + "…" : episode.title}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer branding */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ color: "#C8A96B", fontSize: 28, fontWeight: 700, letterSpacing: "0.22em" }}>
            CULTCODEX.ME
          </div>
          <div style={{ color: "#444", fontSize: 16, letterSpacing: "0.08em" }}>
            THE CULT OF PSYCHE ARCHIVE
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 }
  );

  // The image is deterministic for the whole UTC day and safe to cache at
  // the edge; a short client max-age keeps a stale card from lingering past
  // the UTC-midnight rotation while still avoiding a re-render per request.
  image.headers.set("Cache-Control", "public, max-age=300, s-maxage=3600");
  return image;
}
