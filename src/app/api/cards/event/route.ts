import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveEvent, getEventProgress } from "@/lib/cards/events";

// Active seasonal event + the caller's progress toward it.
export async function GET() {
  const event = await getActiveEvent();
  if (!event) return NextResponse.json({ event: null });

  const user = await getCurrentUser().catch(() => null);
  const progress = user ? await getEventProgress(user.id, event).catch(() => null) : null;

  return NextResponse.json({
    event: {
      id: event.id, slug: event.slug, name: event.name, description: event.description,
      badge: event.badge, startsAt: event.startsAt.toISOString(), endsAt: event.endsAt.toISOString(),
    },
    progress,
  });
}
