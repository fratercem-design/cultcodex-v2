import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await prisma.liveStatus.findUnique({
      where: { id: "singleton" },
      select: { isLive: true, videoId: true, title: true, startedAt: true },
    });

    return NextResponse.json(
      status ?? { isLive: false, videoId: null, title: null, startedAt: null }
    );
  } catch {
    return NextResponse.json({
      isLive: false,
      videoId: null,
      title: null,
      startedAt: null,
    });
  }
}
