import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [cop, pn, nf] = await Promise.all([
      prisma.liveStatus.findUnique({
        where: { id: "singleton" },
        select: { isLive: true, videoId: true, title: true },
      }),
      prisma.liveStatus.findUnique({
        where: { id: "psyches-nightmares" },
        select: { isLive: true, videoId: true, title: true },
      }),
      prisma.liveStatus.findUnique({
        where: { id: "nightmare-frequencies" },
        select: { isLive: true, videoId: true, title: true },
      }),
    ]);

    return NextResponse.json({
      cultOfPsyche: {
        isLive: cop?.isLive ?? false,
        videoId: cop?.videoId ?? null,
        title: cop?.title ?? null,
      },
      psychesNightmares: {
        isLive: pn?.isLive ?? false,
        videoId: pn?.videoId ?? null,
        title: pn?.title ?? null,
      },
      nightmareFrequencies: {
        isLive: nf?.isLive ?? false,
        videoId: nf?.videoId ?? null,
        title: nf?.title ?? null,
      },
    });
  } catch {
    return NextResponse.json({
      cultOfPsyche: { isLive: false, videoId: null, title: null },
      psychesNightmares: { isLive: false, videoId: null, title: null },
      nightmareFrequencies: { isLive: false, videoId: null, title: null },
    });
  }
}
