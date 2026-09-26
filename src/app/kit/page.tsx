import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { SampleKitTabs } from "@/components/kit/sample-kit-tabs";
import { KitPricing } from "@/components/kit/kit-pricing";
import { PilotForm } from "@/components/kit/pilot-form";
import { KIT_FAQ } from "@/lib/kit/sample-kit";
import { KIT_FOUNDER_CODE } from "@/lib/kit/checkout";
import { getCountsOrNull } from "@/lib/queries/stats";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Transmission Kit: chapters, clips and show notes for your live",
  description:
    "Send your tarot or astrology live replay. Within 48 hours you get YouTube chapters, your 10 best clip moments, a searchable description and 5 Shorts hooks.",
  path: "/kit",
});

const PAINS = [
  {
    title: "Replays nobody rewatches",
    body: "Your best 60 seconds is buried at 1:48:05 of a 3-hour stream. New viewers never find it.",
  },
  {
    title: "No chapters, no search",
    body: "YouTube can't tell what you covered, so it doesn't show your live to people searching for it.",
  },
  {
    title: "No time to cut Shorts",
    body: "Scrubbing a whole replay for clips takes longer than the stream did. So it doesn't happen.",
  },
];

const STEPS = [
  { n: "1", title: "Send the replay", body: "Paste your stream link and pick a plan." },
  { n: "2", title: "We go through it", body: "Transcript, chat spikes, and a human pass over every timestamp." },
  { n: "3", title: "Paste and post", body: "Your kit lands in your inbox within 48 hours." },
];

export default async function KitPage() {
  const stats = await getCountsOrNull();
  const episodes = stats?.episodes ?? 0;

  return (
    <>
      <PageHero
        title="TRANSMISSION KIT"
        subtitle="Your live ends. Your clips don't."
        backgroundImage="/hero-bg.jpg"
        label="for tarot + astrology streamers"
      />

      <main id="main-content" className="mx-auto max-w-3xl space-y-14 px-4 py-10">
        {/* Hero pitch */}
        <section className="space-y-5">
          <p className="text-lg leading-relaxed text-text-primary">
            Send us your tarot or astrology live replay. Within 48 hours you get{" "}
            <strong>YouTube chapters</strong>, your <strong>10 best clip moments</strong> with timestamps, a{" "}
            <strong>searchable description</strong>, and <strong>5 Shorts hooks</strong>. Paste them in and your stream
            keeps finding viewers after you log off.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#pricing"
              className="rounded-md bg-accent-gold px-5 py-3 text-center font-display font-bold text-white transition-opacity hover:opacity-90"
            >
              Get a kit for $29
            </a>
            <a
              href="#pilot"
              className="rounded-md border border-border px-5 py-3 text-center font-display font-bold text-text-primary transition-colors hover:border-accent-gold"
            >
              Request a free pilot
            </a>
          </div>
        </section>

        {/* Problem */}
        <section className="space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// the_problem"}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAINS.map((p) => (
              <div key={p.title} className="rounded-lg border border-border bg-surface/50 p-4">
                <p className="font-display font-bold text-text-primary">{p.title}</p>
                <p className="mt-1 text-sm text-text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample */}
        <section className="space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// what_you_get"}
          </p>
          <h2 className="font-serif text-2xl font-black text-text-primary">A sample kit</h2>
          <p className="text-sm text-text-muted">
            This is what lands in your inbox for one Sunday collective reading. Tap through the tabs.
          </p>
          <SampleKitTabs />
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// how_it_works"}
          </p>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-lg border border-border bg-surface/50 p-4">
                <span className="font-mono text-sm text-accent-cyan">{s.n}</span>
                <p className="mt-1 font-display font-bold text-text-primary">{s.title}</p>
                <p className="mt-1 text-sm text-text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// pricing"}
          </p>
          <h2 className="font-serif text-2xl font-black text-text-primary">Pick a plan</h2>
          <p className="text-sm text-accent-cyan">
            Founding price: the first 10 Single Kits are $19 with code{" "}
            <span className="font-mono font-bold">{KIT_FOUNDER_CODE}</span> at checkout.
          </p>
          <KitPricing />
        </section>

        {/* Who's behind it */}
        <section className="space-y-3 rounded-lg border border-border bg-surface/50 p-5">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// who_makes_it"}
          </p>
          <p className="text-text-primary">
            Built by the host of <strong>Cult of Psyche</strong>, a live tarot and occult panel show.
            {episodes > 0 && (
              <>
                {" "}We&rsquo;ve indexed {episodes.toLocaleString("en-US")}+ of our own episodes into{" "}
                <Link href="/" className="text-accent-cyan underline underline-offset-2">
                  CultCodex
                </Link>
                , and the kit uses the same tooling.
              </>
            )}{" "}
            We know what a good tarot clip looks like because we cut them every week.
          </p>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// faq"}
          </p>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface/50">
            {KIT_FAQ.map((item) => (
              <details key={item.q} className="group px-4 py-3">
                <summary className="cursor-pointer list-none font-display font-bold text-text-primary">
                  <span className="mr-2 inline-block text-accent-cyan transition-transform group-open:rotate-90">›</span>
                  {item.q}
                </summary>
                <p className="mt-2 pl-5 text-sm text-text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Pilot */}
        <section id="pilot" className="scroll-mt-20 space-y-3 rounded-lg border border-accent-gold/60 p-5">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text">
            {"/// free_pilot"}
          </p>
          <h2 className="font-serif text-2xl font-black text-text-primary">Try one free</h2>
          <p className="text-text-primary">
            We&rsquo;re doing 5 free kits for streamers who&rsquo;ll tell us honestly what they think. Tell us about
            your channel and we&rsquo;ll reply by email.
          </p>
          <PilotForm />
        </section>
      </main>
    </>
  );
}
