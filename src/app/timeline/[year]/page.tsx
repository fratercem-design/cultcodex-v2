import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TimelineView } from "../timeline-view";

export const revalidate = 300;
export const maxDuration = 30;

/**
 * One archived year per URL, prerendered.
 *
 * /timeline used to render all ~3,000 episodes in a single document. Years are
 * segments rather than a `?year=` query so each one stays statically
 * generated - a searchParams page would be dynamic, which is how the homepage
 * ended up uncacheable.
 */
export async function generateStaticParams() {
  const rows = await prisma.episode
    .findMany({ where: { airDate: { not: null } }, select: { airDate: true } })
    .catch(() => []);
  const years = [
    ...new Set(
      rows
        .map((r) => r.airDate?.getUTCFullYear())
        .filter((y): y is number => typeof y === "number")
    ),
  ].sort((a, b) => b - a);
  // The newest year is served by /timeline itself.
  return years.slice(1).map((year) => ({ year: String(year) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return {
    alternates: { canonical: `/timeline/${year}` },
    title: `Timeline ${year} — CULT CODEX`,
    description: `Every Cult of Psyche episode from ${year}, in order.`,
  };
}

export default async function TimelineYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const parsed = Number(year);
  if (!Number.isInteger(parsed)) notFound();
  return <TimelineView requestedYear={parsed} />;
}
