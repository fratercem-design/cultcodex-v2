import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { getUserRank } from "@/lib/rankings/get-user-rank";
import { BANNER_THEMES } from "@/lib/codex-page";

export const runtime = "nodejs";
export const alt = "Member profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TIER_LABEL: Record<string, string> = {
  admin: "Admin",
  oracle: "✦ Oracle",
  access: "Initiate+",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const member = await prisma.codexUser
    .findUnique({
      where: { codexSlug: slug },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        memberTitle: true,
        codexBanner: true,
        subscriptionTier: true,
        isLifetimeMember: true,
        role: true,
        codexPagePublic: true,
        _count: {
          select: {
            favorites: true,
            savedTopics: true,
            savedQuotes: true,
          },
        },
      },
    })
    .catch(() => null);

  const fallback = (
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
      CultCodex Member
    </div>
  );

  if (!member || !member.codexPagePublic) {
    return new ImageResponse(fallback, { ...size });
  }

  const rankData = await getUserRank(member.id, true).catch(() => null);
  const bannerKey = member.codexBanner ?? "void";
  const theme = BANNER_THEMES[bannerKey] ?? BANNER_THEMES.void;
  const accent = theme.accent;

  const isAdmin = member.role === "admin";
  const isOracle =
    isAdmin || member.isLifetimeMember || member.subscriptionTier === "system";
  const tierLabel = isAdmin
    ? TIER_LABEL.admin
    : isOracle
    ? TIER_LABEL.oracle
    : member.subscriptionTier === "access"
    ? TIER_LABEL.access
    : null;

  const rankGlyph = rankData?.progress.current.glyph ?? "◈";
  const rankTitle = rankData?.progress.current.title ?? "Initiate";
  const rankHex = rankData?.progress.current.hex ?? "#5DB7D8";
  const score = rankData?.score ?? 0;

  // Derive background gradient from banner theme (strip CSS vars, use dark fallback)
  const bgStyle = "linear-gradient(135deg, #120028 0%, #0d001a 50%, #060010 100%)";

  const stats = [
    { n: member._count.favorites, label: "transmissions" },
    { n: member._count.savedTopics, label: "signals" },
    { n: member._count.savedQuotes, label: "moments" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: bgStyle,
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Accent top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: accent,
          }}
        />

        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "52px 60px",
            gap: "48px",
          }}
        >
          {/* Left: avatar + rank */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              flexShrink: 0,
              paddingTop: "8px",
            }}
          >
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatarUrl}
                alt=""
                width={140}
                height={140}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${accent}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  border: `3px solid ${accent}`,
                  backgroundColor: `${accent}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 60,
                  color: accent,
                  fontWeight: 700,
                }}
              >
                {member.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Rank badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: `1px solid ${rankHex}40`,
                borderRadius: 24,
                padding: "6px 16px",
                backgroundColor: `${rankHex}12`,
              }}
            >
              <span style={{ fontSize: 18, color: rankHex }}>{rankGlyph}</span>
              <span
                style={{
                  fontSize: 14,
                  color: rankHex,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                }}
              >
                {rankTitle.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right: name + details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Tier badge */}
              {tierLabel && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: accent,
                      fontWeight: 700,
                      letterSpacing: "0.28em",
                      border: `1px solid ${accent}50`,
                      borderRadius: 20,
                      padding: "3px 12px",
                      backgroundColor: `${accent}10`,
                    }}
                  >
                    {tierLabel.toUpperCase()}
                  </div>
                </div>
              )}

              {/* Display name */}
              <div
                style={{
                  fontSize: member.displayName.length > 20 ? 52 : 64,
                  fontWeight: 700,
                  color: "#EBE3D2",
                  lineHeight: 1.1,
                }}
              >
                {member.displayName}
              </div>

              {/* Member title */}
              {member.memberTitle && (
                <div
                  style={{
                    fontSize: 22,
                    color: `${accent}CC`,
                    fontStyle: "italic",
                  }}
                >
                  {member.memberTitle}
                </div>
              )}

              {/* Codex score */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: accent,
                  }}
                >
                  {score.toLocaleString()}
                </span>
                <span style={{ fontSize: 16, color: "#666", letterSpacing: "0.1em" }}>
                  CODEX SCORE
                </span>
              </div>
            </div>

            {/* Bottom: stats + branding */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              {/* Stats row */}
              <div style={{ display: "flex", gap: "28px" }}>
                {stats.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#EBE3D2",
                      }}
                    >
                      {s.n}
                    </span>
                    <span style={{ fontSize: 12, color: "#555", letterSpacing: "0.08em" }}>
                      {s.label.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Branding */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    color: "#C8A96B",
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                  }}
                >
                  CULTCODEX.ME
                </div>
                <div style={{ color: "#333", fontSize: 13, letterSpacing: "0.08em" }}>
                  CULT OF PSYCHE ARCHIVE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
