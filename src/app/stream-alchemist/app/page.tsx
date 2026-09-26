import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Analyzer } from "@/components/stream-alchemist/analyzer";
import { DoneForYouBand, PricingCards } from "@/components/stream-alchemist/pricing-cards";

export const revalidate = false;

export const metadata: Metadata = buildMetadata({
  title: "Stream Alchemist: Find Clips in Your Transcript",
  description:
    "Paste a livestream or podcast transcript and get ranked short-form clip ideas with timestamps, titles, hooks, captions and hashtags.",
  path: "/stream-alchemist/app",
});

export default function StreamAlchemistApp() {
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 sm:py-14 space-y-8 font-sans">
      <header className="space-y-2">
        <Link
          href="/stream-alchemist"
          className="font-mono text-[12px] uppercase tracking-[0.18em] text-member hover:underline"
        >
          ✦ Stream Alchemist
        </Link>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Find the clips in your stream</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-2">
          Paste a transcript, with or without timestamps. You&apos;ll get ranked clip ideas with a title, a hook,
          captions, thumbnail text and hashtags for each. Free shows the top 3.
        </p>
      </header>

      <Analyzer
        upsell={
          <div className="space-y-6">
            <PricingCards location="results" includeFree={false} />
            <DoneForYouBand location="results" />
          </div>
        }
      />
    </main>
  );
}
