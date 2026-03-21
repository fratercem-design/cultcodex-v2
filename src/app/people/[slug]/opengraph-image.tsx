import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Person profile preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
            backgroundColor: "#0a0a0a",
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

  const typeLabel = person.personType
    .replace("_", " ")
    .toUpperCase();

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
        {/* Top section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              color: "#00d9ff",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            {typeLabel}
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {person.displayName}
          </div>
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ color: "#C8A96B", fontSize: 36, fontWeight: 700 }}>
                {person._count.guestAppearances}
              </div>
              <div style={{ color: "#666666", fontSize: 16 }}>APPEARANCES</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ color: "#C8A96B", fontSize: 36, fontWeight: 700 }}>
                {person._count.quotes}
              </div>
              <div style={{ color: "#666666", fontSize: 16 }}>QUOTES</div>
            </div>
          </div>
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
              color: "#C8A96B",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            CULTCODEX.ME
          </div>
          <div
            style={{
              color: "#333333",
              fontSize: 16,
            }}
          >
            CULT OF PSYCHE ARCHIVE
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
