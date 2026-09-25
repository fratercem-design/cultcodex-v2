import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getFeud, feudSlug, parseFeudSlug } from "@/lib/queries/feuds";
import { RELATION_LABELS } from "@/lib/relationships";
import { formatDate } from "@/lib/format/date";
import { formatSeconds } from "@/lib/format/duration";
import { momentPath } from "@/lib/format/moment";
import { PersonSigil } from "@/components/ui/person-sigil";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ pair: string }>;
}

async function load(pair: string) {
  const slugs = parseFeudSlug(pair);
  if (!slugs) return null;
  return getFeud(slugs[0], slugs[1]).catch(() => null);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const feud = await load(pair);
  if (!feud) return { title: "Feud not found — CULT CODEX" };
  const [a, b] = feud.people;
  return {
    alternates: { canonical: `/drama/feuds/${feud.slug}` },
    title: `${a.displayName} vs ${b.displayName} — Feuds — CULT CODEX`,
    description: `The ${a.displayName} and ${b.displayName} feud as a dated timeline: ${feud.counts.events} recorded turns and ${feud.counts.quotes} on-stream quotes, each linked to its moment.`,
  };
}

export default async function FeudPage({ params }: PageProps) {
  const { pair } = await params;
  const feud = await load(pair);
  if (!feud) notFound();
  if (pair !== feud.slug) permanentRedirect(`/drama/feuds/${feud.slug}`);
  const [a, b] = feud.people;
  const side = (slug: string) => (slug === a.slug ? "left" : "right");

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10">
      <header className="space-y-4 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/70">
          {"/// feud_file"} · {RELATION_LABELS[feud.state]}
        </p>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {[a, b].map((p, i) => (
            <div key={p.slug} className="contents">
              {i === 1 && <span className="font-display text-2xl font-bold text-red-400/80">vs</span>}
              <Link href={`/people/${p.slug}`} className="group flex flex-col items-center gap-2">
                <PersonSigil slug={p.slug} name={p.displayName} personType="recurring" size={56} decorative />
                <span className="font-display text-lg sm:text-xl font-bold text-text-primary group-hover:text-red-300 transition-colors">
                  {p.displayName}
                </span>
              </Link>
            </div>
          ))}
        </div>
        <p className="font-mono text-[12px] text-text-muted">
          {feud.counts.events} recorded turn{feud.counts.events === 1 ? "" : "s"} · {feud.counts.quotes} on-stream quote
          {feud.counts.quotes === 1 ? "" : "s"}
        </p>
      </header>

      {feud.items.length === 0 ? (
        <p className="mt-12 rounded border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          Nothing on file between these two yet.
        </p>
      ) : (
        <ol className="relative mt-10 space-y-4 border-l border-red-500/20 pl-6">
          {feud.items.map((item) =>
            item.kind === "event" ? (
              <li key={item.id} className="relative">
                <span
                  className={`absolute -left-[29px] top-2 h-2.5 w-2.5 rounded-full ${item.isTurn ? "bg-red-400" : "bg-red-400/30"}`}
                  aria-hidden="true"
                />
                <div className={`rounded border p-4 ${item.isTurn ? "border-red-400/40 bg-red-500/5" : "border-border bg-surface"}`}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-red-400/70">
                    {item.at ? formatDate(item.at) : "Undated"} · {item.isTurn ? "Turn" : "Beat"} → {RELATION_LABELS[item.relationType]}
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-text-primary">{item.headline}</p>
                  {item.details && <p className="mt-1 text-sm text-text-muted">{item.details}</p>}
                  {item.episode && (
                    <Link href={`/episodes/${item.episode.slug}`} className="mt-2 block font-mono text-[12px] text-text-muted hover:text-accent-gold-text">
                      {item.episode.title} →
                    </Link>
                  )}
                </div>
              </li>
            ) : (
              <li key={item.id} className="relative">
                <span className="absolute -left-[27px] top-3 h-1.5 w-1.5 rounded-full bg-text-muted/40" aria-hidden="true" />
                <figure className={`max-w-[92%] ${side(item.speaker.slug) === "right" ? "ml-auto text-right" : ""}`}>
                  <blockquote className="text-sm leading-relaxed text-text-primary">“{item.text}”</blockquote>
                  <figcaption className="mt-1 font-mono text-[12px] text-text-muted">
                    <Link href={`/people/${item.speaker.slug}`} className="hover:text-red-300">{item.speaker.displayName}</Link>
                    {" · "}
                    <Link href={momentPath(item.episode.slug, item.timestampSeconds)} className="hover:text-accent-gold-text">
                      {item.at ? `${formatDate(item.at)} · ` : ""}
                      {item.timestampSeconds != null ? `▶ ${formatSeconds(item.timestampSeconds)}` : item.episode.title}
                    </Link>
                  </figcaption>
                </figure>
              </li>
            ),
          )}
        </ol>
      )}

      <p className="pt-10 text-center font-mono text-[12px]">
        <Link href="/drama/feuds" className="text-text-muted hover:text-red-300 transition-colors">← All feuds</Link>
        <span className="mx-3 text-text-muted/50">·</span>
        <Link href={`/drama/feuds/${feudSlug(a.slug, b.slug)}`} className="text-text-muted hover:text-red-300 transition-colors">
          Permalink
        </Link>
      </p>
    </main>
  );
}
