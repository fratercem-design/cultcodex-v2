import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [cop, am] = await Promise.all([
      prisma.liveStatus.findUnique({
        where: { id: "singleton" },
        select: { isLive: true, videoId: true, title: true },
      }),
      prisma.liveStatus.findUnique({
        where: { id: "alexandra-mayers" },
        select: { isLive: true, videoId: true, title: true },
      }),
    ]);

    return NextResponse.json({
      cultOfPsyche: {
        isLive: cop?.isLive ?? false,
        videoId: cop?.videoId ?? null,
        title: cop?.title ?? null,
      },
      alexandraMayers: {
        isLive: am?.isLive ?? false,
        videoId: am?.videoId ?? null,
        title: am?.title ?? null,
      },
    });
  } catch {
    return NextResponse.json({
      cultOfPsyche: { isLive: false, videoId: null, title: null },
      alexandraMayers: { isLive: false, videoId: null, title: null },
    });
  }
}
