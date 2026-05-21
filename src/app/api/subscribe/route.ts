import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

const subscribeSchema = z.object({
  email: z.email().optional(),
  pushSubscription: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = subscribeSchema.parse(body);

    if (!data.email && !data.pushSubscription) {
      return NextResponse.json(
        { error: "Email or push subscription required" },
        { status: 400 }
      );
    }

    if (data.email) {
      // Upsert by email — add push subscription if provided
      await prisma.subscriber.upsert({
        where: { email: data.email },
        create: {
          email: data.email,
          pushSubscription: (data.pushSubscription as Prisma.InputJsonValue) ?? undefined,
          verified: true,
        },
        update: {
          pushSubscription: data.pushSubscription
            ? (data.pushSubscription as Prisma.InputJsonValue)
            : undefined,
        },
      });
    } else if (data.pushSubscription) {
      // Push-only subscriber
      await prisma.subscriber.create({
        data: {
          pushSubscription: data.pushSubscription as Prisma.InputJsonValue,
          verified: true,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
