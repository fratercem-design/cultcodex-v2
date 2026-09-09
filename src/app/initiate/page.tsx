import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { InitiateSignup } from "@/components/marketing/initiate-signup";

export const revalidate = 600;

export const metadata = buildMetadata({
  title: "Become an Initiate — CULT CODEX",
  description:
    "Take The Gospel of Psyche's Nightmares and get a Codex account made in your name at the same time. Free, no password, and the archive stays open either way.",
  path: "/initiate",
});

const WHAT_YOU_GET: { glyph: string; title: string; body: string }[] = [
  {
    glyph: "✦",
    title: "The Gospel, as a PDF",
    body: "The Gospel of Psyche's Nightmares, sent to your inbox the moment you submit. Yours to keep whether or not you ever come back.",
  },
  {
    glyph: "◉",
    title: "An account, already made",
    body: "A Codex account keyed to your email, created immediately. Sign in with Google later and you land on that exact account — handle, cards, and progress intact.",
  },
  {
    glyph: "▲",
    title: "The weekly transmission",
    body: "One email a week: the pattern that surfaced most across the archive, and what the Oracle flagged. One click unsubscribes you for good.",
  },
];

export default function InitiatePage() {
  return (
    <div className="min-h-screen bg-void">
      <PageHero
        title="BECOME AN INITIATE"
        subtitle="Two fields. The gate is not locked — it never was."
        backgroundImage="/lore-header.jpg"
        label="first gate"
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
        <InitiateSignup source="page:initiate" />

        <div className="grid gap-4 sm:grid-cols-3">
          {WHAT_YOU_GET.map((item) => (
            <SectionCard key={item.title} accent="gold">
              <p className="font-mono text-lg text-accent-gold-text">{item.glyph}</p>
              <p className="mt-1 font-serif text-base font-bold text-text-primary">{item.title}</p>
              <p className="mt-2 font-mono text-xs leading-relaxed text-text-muted">{item.body}</p>
            </SectionCard>
          ))}
        </div>

        <SectionCard title="What this is not" accent="cyan">
          <ul className="space-y-2 font-mono text-xs leading-relaxed text-text-muted">
            <li>
              <span className="text-accent-cyan">—</span> Not a paywall. Every episode, person, and
              lore entry in the archive is readable right now without giving us anything.
            </li>
            <li>
              <span className="text-accent-cyan">—</span> Not a commitment. The account we make can
              sit unclaimed forever, and nothing chases you if it does.
            </li>
            <li>
              <span className="text-accent-cyan">—</span> Not a list we sell. It is used for the
              weekly transmission and nothing else.
            </li>
          </ul>
          <p className="mt-4 font-mono text-xs leading-relaxed text-text-muted">
            The procedure we follow from here is written down and public — read{" "}
            <Link
              href="/onboarding/procedure"
              className="text-accent-cyan underline underline-offset-2"
            >
              The First Gate Procedure
            </Link>{" "}
            if you want to know exactly what happens to a person who walks in, before you decide to
            be one.
          </p>
        </SectionCard>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/start-here"
            className="rounded border border-border px-5 py-2.5 font-mono text-sm text-text-muted transition hover:border-accent-gold/60 hover:text-accent-gold-text"
          >
            Skip this and start reading →
          </Link>
          <Link
            href="/join"
            className="rounded border border-border px-5 py-2.5 font-mono text-sm text-text-muted transition hover:border-accent-violet/60 hover:text-accent-violet-text"
          >
            See the paid tiers
          </Link>
        </div>
      </div>
    </div>
  );
}
