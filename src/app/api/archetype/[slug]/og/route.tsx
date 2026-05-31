import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getArchetype } from "@/lib/archetypes";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const archetype = getArchetype(slug);

  if (!archetype) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#07060A",
            color: "#EBE3D2",
            fontSize: 28,
            fontFamily: "sans-serif",
          }}
        >
          Archetype not found
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#07060A",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Outer border */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: `1px solid ${archetype.color}33`,
            borderRadius: 12,
            display: "flex",
          }}
        />

        {/* Inner accent border */}
        <div
          style={{
            position: "absolute",
            top: 26,
            left: 26,
            right: 26,
            bottom: 26,
            border: `1px solid ${archetype.color}18`,
            borderRadius: 8,
            display: "flex",
          }}
        />

        {/* Glyph */}
        <div
          style={{
            fontSize: 96,
            color: archetype.color,
            lineHeight: 1,
            marginBottom: 24,
            display: "flex",
            opacity: 0.9,
          }}
        >
          {archetype.glyph}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: 11,
            color: archetype.color,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            marginBottom: 16,
            display: "flex",
            opacity: 0.7,
          }}
        >
          CULT CODEX · ARCHETYPE
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "#EBE3D2",
            letterSpacing: "0.04em",
            fontFamily: "serif",
            fontStyle: "italic",
            marginBottom: 28,
            display: "flex",
          }}
        >
          {archetype.name}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 1,
            backgroundColor: archetype.color,
            opacity: 0.4,
            marginBottom: 28,
            display: "flex",
          }}
        />

        {/* Summary */}
        <div
          style={{
            fontSize: 22,
            color: "#9A907D",
            textAlign: "center",
            maxWidth: 780,
            lineHeight: 1.6,
            fontStyle: "italic",
            display: "flex",
          }}
        >
          {archetype.summary}
        </div>

        {/* Bottom label */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 11,
            color: "#5a5568",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            display: "flex",
          }}
        >
          cultcodex.me/archetypes/{archetype.slug}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
