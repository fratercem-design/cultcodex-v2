import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { analyzeLocal } from "@/lib/stream-alchemist/analyze-local";
import { DEMO_TRANSCRIPT } from "@/lib/stream-alchemist/demo-transcript";
import { ClipCard } from "@/components/stream-alchemist/clip-card";
import { DoneForYouBand, PricingCards } from "@/components/stream-alchemist/pricing-cards";
import { TrackOnMount } from "@/components/stream-alchemist/tracking";

export const revalidate = false;

export const metadata: Metadata = buildMetadata({
  title: "Stream Alchemist: Turn Livestreams Into Short-Form Clips",
  description:
    "Paste a livestream or podcast transcript. Get the 10 strongest clip moments with timestamps, titles, hooks, Shorts descriptions, TikTok captions, thumbnail text and hashtags.",
  path: "/stream-alchemist",
});

// The sample card is real output: the built-in engine run on the demo
// transcript at build time.
const sample = analyzeLocal(DEMO_TRANSCRIPT).clips[0];

const OUTPUTS = [
  ["10 clip candidates", "The strongest 20–60 second moments, ranked, never overlapping."],
  ["Start and end times", "Exact in and out points when your transcript has timestamps."],
  ["Honest titles", "Built to get the click without promising what the clip doesn't deliver."],
  ["A 2-second hook", "On-screen text that stops the scroll before the clip starts talking."],
  ["Shorts description", "Ready to paste into YouTube, hashtags included."],
  ["TikTok / Reels caption", "Short, conversational, ends with a question that gets comments."],
  ["Thumbnail text", "Three options per clip, four words or fewer."],
  ["CSV and Markdown", "Drop the plan into a spreadsheet, Notion, or your editor's inbox."],
];

const STEPS = [
  ["Paste the transcript", "From YouTube's transcript panel, a caption file (SRT or VTT), or your recorder's export."],
  ["Get ranked clips", "Each one comes with times, a title, a hook, captions, thumbnail text and hashtags."],
  ["Cut and post", "Export the plan, cut the clips, paste the copy. Or have us do the cutting."],
];

const FAQ = [
  [
    "Where do I get a transcript?",
    "On YouTube, open the video, click “Show transcript” under the description and copy it, or download the captions file from YouTube Studio → Subtitles. Riverside, Descript, Otter and most recorders also export one.",
  ],
  [
    "Do I need timestamps?",
    "No, but they help. With timestamps you get exact start and end times. Without them, every clip shows its opening words so you can search for it in your editor.",
  ],
  [
    "Does it cut the video for me?",
    "Not yet. It gives you the clip plan and all the copy. If you want finished vertical clips, the $99 done-for-you service handles one stream end to end.",
  ],
  [
    "Will the titles be clickbait?",
    "No. Every title, hook and caption has to be something the clip actually delivers. Curiosity, yes. Promises the clip can't keep, no. Those get your Shorts skipped and your channel ignored.",
  ],
  [
    "Do you keep my transcript?",
    "No. Your transcript is analyzed and thrown away. When AI mode is on, it's sent to Anthropic's API to write the copy. Results can be held in server memory for a short time so repeat runs are instant.",
  ],
  [
    "What counts as one analysis?",
    "One transcript, up to about three hours of talk. Longer streams can be split into parts.",
  ],
  [
    "What does Founding Lifetime mean?",
    "One $49 payment instead of $19 a month, for as long as Stream Alchemist runs. It's the early-access price for the first people who try it, and it won't stay at $49.",
  ],
];

export default function StreamAlchemistLanding() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-12 sm:py-16 space-y-24 font-sans">
      <TrackOnMount event="sa_landing_view" />

      {/* Hero */}
      <section className="relative text-center space-y-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-64 max-w-2xl rounded-full bg-oracle/10 blur-3xl"
        />
        <p className="relative font-mono text-[12px] uppercase tracking-[0.18em] text-member">✦ Stream Alchemist ✦</p>
        <h1 className="relative mx-auto max-w-3xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Your three-hour stream has ten clips in it. Find them in a minute.
        </h1>
        <p className="relative mx-auto max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">
          Paste a livestream or podcast transcript. Get the strongest moments with timestamps, titles, hooks,
          captions, thumbnail text and hashtags, ready for Shorts, TikTok and Reels.
        </p>
        <div className="relative flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/stream-alchemist/app"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 font-display text-base font-semibold text-on-brand transition hover:brightness-110"
          >
            Try it free
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center rounded-lg border border-line-strong px-6 py-3 font-display text-base font-semibold text-ink transition hover:bg-elevated"
          >
            See pricing
          </a>
        </div>
        <p className="relative font-mono text-[12px] text-ink-3">No signup. Paste a transcript and go.</p>
      </section>

      {/* Sample output */}
      {sample && (
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">What one clip looks like</h2>
            <p className="text-sm text-ink-3">Real output from the demo transcript. You get ten of these per stream.</p>
          </div>
          <div className="mx-auto max-w-3xl">
            <ClipCard clip={sample} />
          </div>
        </section>
      )}

      {/* Outputs */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Everything you need to post, per clip</h2>
          <p className="mx-auto max-w-xl text-sm text-ink-3">
            The hard part of clipping isn&apos;t the cutting. It&apos;s rewatching three hours to find the good bits,
            then writing copy for every one.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OUTPUTS.map(([title, body]) => (
            <li key={title} className="rounded-xl border border-line bg-surface p-5 space-y-1.5">
              <h3 className="font-display text-base font-semibold text-ink">
                <span className="text-member" aria-hidden>✦ </span>
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-3">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-line bg-surface p-5 space-y-2">
              <span className="font-mono text-[12px] text-oracle">Step {i + 1}</span>
              <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-ink-3">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Pricing</h2>
          <p className="text-sm text-ink-3">Start free. Upgrade when it finds clips you&apos;d actually post.</p>
        </div>
        <PricingCards location="landing" />
        <DoneForYouBand location="landing" />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl space-y-6">
        <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">Questions</h2>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-ink">
                {q}
                <span className="text-ink-3 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl border border-member/30 bg-gradient-to-b from-member/[0.07] to-surface px-6 py-12 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Run your last stream through it</h2>
        <p className="mx-auto max-w-lg text-sm text-ink-2">
          It takes less time than finding the first clip by hand. If it doesn&apos;t find anything worth posting, you
          haven&apos;t spent a cent.
        </p>
        <Link
          href="/stream-alchemist/app"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 font-display text-base font-semibold text-on-brand transition hover:brightness-110"
        >
          Find my clips
        </Link>
      </section>
    </main>
  );
}
