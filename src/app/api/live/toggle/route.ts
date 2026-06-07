import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifySubscribers } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-live-secret");

  if (key !== process.env.LIVE_TOGGLE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const current = await prisma.liveStatus.findUnique({
    where: { id: "singleton" },
  });

  const goingLive = !current?.isLive;
  let body: { videoId?: string; title?: string } = {};

  try {
    body = await req.json();
  } catch {
    // No body is fine for toggling off
  }

  const updated = await prisma.liveStatus.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      isLive: goingLive,
      videoId: body.videoId ?? null,
      title: body.title ?? "Cult of Psyche Live Stream",
      startedAt: goingLive ? new Date() : null,
      endedAt: goingLive ? null : new Date(),
    },
    update: {
      isLive: goingLive,
      videoId: goingLive
        ? (body.videoId ?? current?.videoId)
        : current?.videoId,
      title: goingLive
        ? (body.title ?? "Cult of Psyche Live Stream")
        : current?.title,
      startedAt: goingLive ? new Date() : current?.startedAt,
      endedAt: goingLive ? null : new Date(),
    },
  });

  let notified = { emailCount: 0, pushCount: 0 };
  if (goingLive && updated.videoId) {
    notified = await notifySubscribers(
      updated.title ?? "Cult of Psyche Live Stream",
      updated.videoId
    );
  }

  return NextResponse.json({
    isLive: updated.isLive,
    videoId: updated.videoId,
    title: updated.title,
    notified: goingLive ? notified : undefined,
  });
}

