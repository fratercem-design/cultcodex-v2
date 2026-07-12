import { ImageResponse } from "next/og";
import { getDailyTransmission } from "@/lib/queries/daily";
import { cleanTranscriptText } from "@/lib/format/text";

export const runtime = "nodejs";
// The quote/episode rotate daily — without this the image would be baked in
// at build time and never reflect a later day's actual signal.
export const dynamic = "force-dynamic";
export const alt = "Today's Signal — CultCodex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const data = await getDailyTransmission().catch(() => null);
  const quote = data?.quote ?? null;
  const episode = quote?.episode ?? data?.spotlightEpisode ?? null;

  const quoteText = quote ? cleanTranscriptText(quote.text) : null;
  const displayQuote =
    quoteText && quoteText.length > 200 ? quoteText.slice(0, 197) + "…" : quoteText;

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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  color: "#00d9ff",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  backgroundColor: "rgba(0,217,255,0.08)",
                  border: "1px solid rgba(0,217,255,0.25)",
                  borderRadius: 4,
                  padding: "6px 14px",
                }}
              >
                TODAY&apos;S SIGNAL
              </div>
              {data && (
                <div style={{ color: "#555", fontSize: 18 }}>
                  #{data.date.replace(/-/g, "")}
                </div>
              )}
            </div>

            {displayQuote ? (
              <div
                style={{
                  color: "#f5f0e8",
                  fontSize: 44,
                  fontStyle: "italic",
                  lineHeight: 1.35,
                }}
              >
                &ldquo;{displayQuote}&rdquo;
              </div>
            ) : (
              <div style={{ color: "#f5f0e8", fontSize: 44 }}>
                The vault is quiet today.
              </div>
            )}

            {(quote?.speaker || episode) && (
              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "#999", fontSize: 22 }}>
                {quote?.speaker && <div style={{ color: "#C8392E" }}>{quote.speaker.displayName}</div>}
                {quote?.speaker && episode && <div style={{ color: "#555" }}>·</div>}
                {episode && (
                  <div>
                    {episode.episodeNumber != null ? `EP.${String(episode.episodeNumber).padStart(3, "0")} · ` : ""}
                    {episode.title.length > 60 ? episode.title.slice(0, 57) + "…" : episode.title}
                  </div>
                )}
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
    { ...size }
  );
}
