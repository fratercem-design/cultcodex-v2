import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Appear on the Show",
  description:
    "Want to join a Cult of Psyche panel as a guest? Here's how the open panel works, what makes a great appearance, and how to get on.",
  path: "/appear",
});

const STEPS = [
  {
    n: "I",
    title: "Show up live",
    body: "The fastest way onto the panel is to be present when the show is live. Open panels pull participants straight from the audience — members and supporters get priority into the frame.",
  },
  {
    n: "II",
    title: "Become a member",
    body: "Channel membership and Initiate+ grant panel access and visibility in chat. It signals you're invested, not just passing through — and it's how most regulars first got on.",
  },
  {
    n: "III",
    title: "Bring something real",
    body: "The best appearances bring a genuine perspective — a question, an experience, a craft (tarot, music, a wild story). The show rewards authenticity and punishes performance.",
  },
  {
    n: "IV",
    title: "Respect the room",
    body: "Open doesn't mean lawless. Don't talk over people, don't bring hate, don't porn-bomb. The panel remembers. Good energy gets invited back.",
  },
];

const GREAT = [
  "You have a craft to share — tarot, freestyle, art, deep knowledge of a subject",
  "You've lived something worth talking about and can be honest about it",
  "You can hold a conversation without dominating or disappearing",
  "You're 21+ (weekend panels run adult)",
  "You can roll with chaos — the open panel is unscripted by design",
];

const AVOID = [
  "Showing up only to start drama or chase clout",
  "Doxxing, harassment, or bringing real-world beef on stream",
  "Treating the panel as a stage to monologue at",
  "Disrespecting the host, the cats, or other guests",
];

export default function AppearPage() {
  return (
    <>
      <PageHero
        title="APPEAR ON THE SHOW"
        subtitle="The panel is open. The door has rules."
        backgroundImage="/hero-bg.jpg"
        label="guests"
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-14">

        <section className="space-y-4 text-center">
          <p className="text-sm text-text-muted leading-relaxed">
            Cult of Psyche runs an <span className="text-text-primary font-semibold">open panel</span>:
            an unscripted livestream where guests rotate in and out in real time. There&apos;s no
            booking form and no gatekept guest list — but there is a way in, and a way to make it count.
          </p>
        </section>

        {/* How it works */}
        <section className="space-y-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/80">
            {"/// how_to_get_on"}
          </p>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-xl border border-border bg-surface p-5">
                <span className="font-display text-lg font-bold text-accent-gold-text/80 shrink-0 w-8">{s.n}</span>
                <div className="space-y-1">
                  <h2 className="font-display text-base font-bold text-text-primary">{s.title}</h2>
                  <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <MysticalDivider />

        {/* Fit */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-accent-cyan/25 bg-accent-cyan/5 p-5 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/70">
              {"/// great_guests"}
            </p>
            <ul className="space-y-2">
              {GREAT.map((g) => (
                <li key={g} className="flex items-start gap-2 font-mono text-[11px] text-text-muted leading-relaxed">
                  <span className="text-accent-cyan mt-0.5 shrink-0">✦</span>{g}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-400/25 bg-red-950/10 p-5 space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-400/70">
              {"/// gets_you_gonged"}
            </p>
            <ul className="space-y-2">
              {AVOID.map((a) => (
                <li key={a} className="flex items-start gap-2 font-mono text-[11px] text-text-muted leading-relaxed">
                  <span className="text-red-400 mt-0.5 shrink-0">✕</span>{a}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <MysticalDivider />

        {/* CTA */}
        <section className="rounded-2xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-7 text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-text-primary">Ready to step into the frame?</h2>
          <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto leading-relaxed">
            Catch the next live stream, or become a member to get panel access and priority into the
            conversation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/cult-live" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25">
              Watch live →
            </Link>
            <Link href="/premium" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-mono text-xs text-text-muted transition-all hover:border-accent-gold/30 hover:text-text-primary">
              Get panel access
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
