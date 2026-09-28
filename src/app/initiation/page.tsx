import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { WorkbookSignup } from "@/components/marketing/workbook-signup";

export const metadata = buildMetadata({
  title: "The 30-Day Initiation — free workbook",
  description:
    "A free 44-page printable workbook hosted by Madame Sulphur: thirty ten-minute rites across five gates, an archetype field guide and a seal at the end.",
  path: "/initiation",
  image: "/initiation/cover.jpg",
});

const GATES: { glyph: string; name: string; days: string; body: string }[] = [
  { glyph: "✦", name: "The Threshold", days: "Days 1–7", body: "You watch. Attention before anything else." },
  { glyph: "◐", name: "The Mirror", days: "Days 8–14", body: "The patterns you keep repeating, and the questions you avoid." },
  { glyph: "⌬", name: "The Crucible", days: "Days 15–21", body: "Turn what you found into something. Break one small habit." },
  { glyph: "☉", name: "The Signal", days: "Days 22–28", body: "Predictions, an unsent letter, words for things with no name." },
  { glyph: "◉", name: "The Seal", days: "Days 29–30", body: "Back to Day 1, then a promise you sign." },
];

const PREVIEWS: { src: string; alt: string }[] = [
  { src: "/initiation/cover.jpg", alt: "Workbook cover: the eight archetype glyphs in a ring above the title" },
  { src: "/initiation/day.jpg", alt: "A daily page: Day 10, The Oracle's Question, with ten numbered lines" },
  { src: "/initiation/tracker.jpg", alt: "The 30-day tracker grid, grouped by gate" },
];

export default function InitiationPage() {
  return (
    <div className="min-h-screen bg-void">
      <PageHero
        title="THE 30-DAY INITIATION"
        subtitle="One rite a day. Eight archetypes. Five gates. One seal."
        backgroundImage="/lore-header.jpg"
        label="free workbook"
      />

      <main id="main-content" className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
        <div className="grid items-start gap-6 md:grid-cols-[1fr_1.1fr]">
          {/* First on phones, where most visitors arrive from a persona's bio link; right column on desktop. */}
          <WorkbookSignup className="md:order-last" />
          <div className="space-y-4">
            <p className="font-serif text-lg italic leading-relaxed text-text-primary">
              &ldquo;Sit down, darling. You picked this up because some part of you wants to know which
              one you are. For thirty days I&rsquo;ll give you one rite a day. Ten minutes each.&rdquo;
            </p>
            <p className="font-mono text-xs text-text-muted">
              — Madame Sulphur, reader of the eight archetypes (an AI character)
            </p>
            <ul className="space-y-2 font-mono text-xs leading-relaxed text-text-muted">
              <li><span className="text-accent-gold-text">—</span> 30 daily pages: a rule, a rite and room to write</li>
              <li><span className="text-accent-gold-text">—</span> A fridge tracker and a Seal of Initiation to sign</li>
              <li><span className="text-accent-gold-text">—</span> A field guide to all eight archetypes: gift, shadow, practice</li>
              <li><span className="text-accent-gold-text">—</span> Optional tasks that take you into the archive</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PREVIEWS.map((p) => (
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              width={816}
              height={1056}
              sizes="(max-width: 768px) 33vw, 280px"
              className="h-auto w-full rounded border border-border"
            />
          ))}
        </div>

        <SectionCard title="Five gates" accent="gold">
          <ol className="space-y-3">
            {GATES.map((g) => (
              <li key={g.name} className="flex gap-3">
                <span className="w-6 shrink-0 text-center text-lg text-accent-gold-text" aria-hidden>
                  {g.glyph}
                </span>
                <span className="font-mono text-xs leading-relaxed text-text-muted">
                  <span className="text-text-primary">{g.name}</span> · {g.days}. {g.body}
                </span>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title="What this is not" accent="cyan">
          <p className="font-mono text-xs leading-relaxed text-text-muted">
            It&rsquo;s a journaling workbook for reflection and fun. It isn&rsquo;t therapy, medical advice
            or a prediction of your future. CultCodex is an independent fan archive, not an official Cult
            of Psyche publication.
          </p>
        </SectionCard>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/archetype-quiz"
            className="rounded border border-border px-5 py-2.5 font-mono text-sm text-text-muted transition hover:border-accent-gold/60 hover:text-accent-gold-text"
          >
            Take the archetype quiz first →
          </Link>
        </div>
      </main>
    </div>
  );
}
