import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/render";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Guest Intelligence Report — CultCodex";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = await prisma.person
    .findUnique({
      where: { slug },
      select: { displayName: true, _count: { select: { guestAppearances: true } } },
    })
    .catch(() => null);

  const count = person?._count.guestAppearances ?? 0;

  return await createOgImage({
    eyebrow: "Guest Intelligence Report",
    title: person?.displayName ?? "CultCodex",
    subtitle: person
      ? `${count} appearance${count === 1 ? "" : "s"} · behavioral signature, key quotes, and collaborators.`
      : "Behavioral intelligence from the Cult of Psyche archive.",
    accent: "cyan",
  });
}
