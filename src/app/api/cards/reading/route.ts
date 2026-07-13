import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { drawReading, type ReadingMode } from "@/lib/cards/reading";

const MODES: ReadingMode[] = ["arcana", "archive", "hybrid"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: { mode?: string; spread?: string; question?: string; ownedOnly?: boolean } = {};
  try { body = await req.json(); } catch { /* empty body → defaults */ }

  const mode = (MODES.includes(body.mode as ReadingMode) ? body.mode : "hybrid") as ReadingMode;
  const spread = typeof body.spread === "string" ? body.spread : "single";
  const question = typeof body.question === "string" ? body.question.slice(0, 500) : undefined;

  try {
    const { reading, signalRemaining } = await drawReading({
      userId: user.id,
      mode,
      spreadSlug: spread,
      question,
      ownedOnly: body.ownedOnly === true,
    });
    return NextResponse.json({ reading, signalRemaining });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reading failed";
    console.error("[cards/reading] error:", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
