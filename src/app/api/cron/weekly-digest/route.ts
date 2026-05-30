import { NextRequest, NextResponse } from "next/server";
import { getWeeklyDigestData } from "@/lib/queries/digest";
import { sendWeeklyDigest } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getWeeklyDigestData();
    const { emailCount } = await sendWeeklyDigest(data);
    return NextResponse.json({
      ok: true,
      emailCount,
      weekLabel: data.weekLabel,
      stats: {
        newEpisodes: data.newEpisodes.length,
        newQuotes: data.newQuotes.length,
        newLoreEntries: data.newLoreEntries.length,
        memberCount: data.memberCount,
        topQuote: data.topQuote ? data.topQuote.id : null,
      },
    });
  } catch (err) {
    console.error("[weekly-digest]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
