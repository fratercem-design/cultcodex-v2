import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { earnCreditsForActivity } from "@/lib/queries/cards";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ granted: 0 });

  const body = await req.json().catch(() => ({}));
  const reason = body.reason as string;
  if (reason !== "episode_read" && reason !== "lore_read") {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  // Validate metadata shape — only allow the known contentId field.
  // Arbitrary client-controlled JSON must not reach the transactions table.
  const rawMeta = body.metadata;
  const metadata =
    rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
      ? { contentId: typeof rawMeta.contentId === "string" ? rawMeta.contentId.slice(0, 100) : undefined }
      : {};

  const result = await earnCreditsForActivity(user.id, reason, metadata);
  return NextResponse.json(result);
}
