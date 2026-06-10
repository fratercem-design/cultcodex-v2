import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true, title: true, transcriptRaw: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  if (episode.transcriptRaw) {
    return NextResponse.json({ error: "Transcript already available" }, { status: 409 });
  }

  await prisma.transcriptRequest.upsert({
    where: { episodeId_email: { episodeId: episode.id, email } },
    create: { episodeId: episode.id, email },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
