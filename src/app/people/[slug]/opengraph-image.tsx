import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Person profile preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PERSON_TYPE_LABELS: Record<string, string> = {
  guest:         "GUEST",
  host:          "HOST",
  recurring:     "RECURRING VOICE",
  mentioned:     "MENTIONED",
  collaborator:  "COLLABORATOR",
};

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const person = await prisma.person.findUnique({
    where: { slug },
    select: {
      displayName: true,
      personType: true,
      shortBio: true,
      avatarUrl: true,
      _count: {
        select: {
          guestAppearances: true,
          quotes: true,
        },
      },
    },
  });

  if (!person) {
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
          Person Not Found
        </div>
      ),
      { ...size }
    );
  }

  const typeLabel = PERSON_TYPE_LABELS[person.personType] ?? person.personType.replace("_", " ").toUpperCase();
  const hasAvatar = !!person.avatarUrl;
  const nameTrunc = person.displayName.length > 32
    ? person.displayName.slice(0, 29) + "..."
    : person.displayName;
  const bioTrunc = person.shortBio
    ? person.shortBio.length > 110
      ? person.shortBio.slice(0, 107) + "..."
      : person.shortBio
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
        {/* Cyan accent bar — voices use cyan */}
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

        <div style={{ display: "flex", flex: 1, padding: "52px 56px 52px 56px" }}>
          {/* Left — text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              paddingRight: hasAvatar ? "52px" : "0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                {typeLabel}
              </div>

              <div
                style={{
                  color: "#f5f0e8",
                  fontSize: hasAvatar ? 60 : 72,
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                {nameTrunc}
              </div>

              {bioTrunc && (
                <div
                  style={{
                    color: "#666",
                    fontSize: 21,
                    lineHeight: 1.45,
                    marginTop: 4,
                  }}
                >
                  {bioTrunc}
                </div>
              )}

              {/* Stats */}
              <div style={{ display: "flex", gap: "40px", marginTop: "8px" }}>
                {person._count.guestAppearances > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ display: "flex", color: "#C8392E", fontSize: 38, fontWeight: 700 }}>
                      {person._count.guestAppearances}
                    </div>
                    <div style={{ display: "flex", color: "#444", fontSize: 14, letterSpacing: "0.1em" }}>APPEARANCES</div>
                  </div>
                )}
                {person._count.quotes > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <div style={{ display: "flex", color: "#C8392E", fontSize: 38, fontWeight: 700 }}>
                      {person._count.quotes}
                    </div>
                    <div style={{ display: "flex", color: "#444", fontSize: 14, letterSpacing: "0.1em" }}>QUOTES</div>
                  </div>
                )}
              </div>
            </div>

            {/* Branding */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ color: "#C8392E", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em" }}>
                CULTCODEX.ME
              </div>
              <div style={{ color: "#333", fontSize: 15, letterSpacing: "0.05em" }}>
                CULT OF PSYCHE ARCHIVE
              </div>
            </div>
          </div>

          {/* Right — avatar */}
          {hasAvatar && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={person.avatarUrl!}
                alt=""
                width={240}
                height={240}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(0,217,255,0.3)",
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
