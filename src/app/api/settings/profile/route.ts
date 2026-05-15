import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSubscribed } from "@/lib/subscription";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribed = await isSubscribed(user.id);
  if (!subscribed) {
    return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { memberTitle, isPublicMember } = body as {
    memberTitle?: string | null;
    isPublicMember?: boolean;
  };

  if (memberTitle !== undefined && memberTitle !== null) {
    if (typeof memberTitle !== "string" || memberTitle.length > 40) {
      return NextResponse.json(
        { error: "Title must be a string under 40 characters" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.codexUser.update({
    where: { id: user.id },
    data: {
      ...(memberTitle !== undefined ? { memberTitle: memberTitle || null } : {}),
      ...(typeof isPublicMember === "boolean" ? { isPublicMember } : {}),
    },
    select: { memberTitle: true, isPublicMember: true },
  });

  return NextResponse.json(updated);
}
