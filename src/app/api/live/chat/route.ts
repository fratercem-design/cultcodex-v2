import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eventBus } from "@/lib/sse/event-bus";
import { NextResponse } from "next/server";

const RATE_LIMIT_MS = 3000;
const lastMessageTime = new Map<string, number>();

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check rate limit
  const now = Date.now();
  const lastTime = lastMessageTime.get(user.id) ?? 0;
  if (now - lastTime < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: "Too fast — wait a moment" },
      { status: 429 }
    );
  }

  // Check if stream is live
  const live = await prisma.liveStatus.findUnique({ where: { id: "singleton" } });
  if (!live?.isLive) {
    return NextResponse.json(
      { error: "Chat is only available during live streams" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const content = String(body.content ?? "").trim();
  if (!content || content.length > 500) {
    return NextResponse.json(
      { error: "Message must be 1-500 characters" },
      { status: 400 }
    );
  }

  const message = await prisma.chatMessage.create({
    data: {
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      content,
    },
  });

  lastMessageTime.set(user.id, now);

  eventBus.publish("live:chat", {
    type: "new-chat-message",
    data: {
      id: message.id,
      displayName: message.displayName,
      avatarUrl: message.avatarUrl,
      content: message.content,
      createdAt: message.createdAt,
    },
  });

  return NextResponse.json({ id: message.id }, { status: 201 });
}
