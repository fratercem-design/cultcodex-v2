import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BookCta } from "@/components/book/book-cta";

export const SKU = "cult-masters-handbook";

/**
 * DRAFT — price deliberately unset.
 *
 * Set this to the agreed figure in whole dollars. While it is 0 the page
 * renders the description but no buy button, so a placeholder price can never
 * reach a customer by accident. Drafted options were $19 / $39 / $39 with a
 * $69 annotated edition; the decision is John's.
 */
const PRICE_USD = 0;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Cult Master's Handbook — CultCodex",
  description:
    "Ten volumes on leading a community without coercion. How belief is built, how it is exploited, and how to hold a circle open.",
  alternates: { canonical: "/handbook" },
};

// Shared content → static + ISR. The only per-user piece (own vs. buy) is
// <BookCta>, which resolves ownership client-side, matching /psychenomicon/book.
export default async function HandbookPage() {
  const edition = await prisma.bookEdition
    .findUnique({
      where: { sku: SKU },
      select: { title: true, pageCount: true },
    })
    .catch(() => null);

  const volumes = [
    ["I", "The First Gate", "Why we gather, and what a gateway actually is."],
    ["II", "The Cult Master", "The servant with the lantern — authority as service, not status."],
    ["III", "The Seven Pillars", "Curiosity, compassion, integrity, humility, wonder, discernment, transformation — each against its counterfeit."],
    ["IV", "The Hall of Mirrors", "Self-deception and manipulation: bias, the crowd, engineered belief, the capture of a mind."],
    ["V", "The Open Panel", "Running a real conversation — listening, interruption, good and bad faith, when to end."],
    ["VI", "The Shadow", "Disruptors, predators of belief, the weaponised crowd — protecting the circle without becoming the Shadow."],
    ["VII", "The Library", "What a community keeps, and how it remembers."],
    ["VIII", "The Rituals", "Practice, repetition, and meaning that does not calcify into dogma."],
    ["IX", "The Moderators", "The people who hold the line, and how not to burn them out."],
    ["X", "The Living Codex", "Why the book must stay unfinished. Closes with the Cult Master's Oath."],
  ];

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
        {"/// the_codex_of_gatekeepers"}
      </p>
      <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-text-primary">
        The Cult Master&apos;s Handbook
      </h1>
      <p className="mt-2 font-mono text-sm text-text-muted">
        Ten volumes on leading without coercion
      </p>

      <div className="mt-8 space-y-4 font-mono text-sm leading-relaxed text-text-muted">
        <p>
          Every community that gathers around belief has the same two problems: how to
          keep the question open, and how to stop the circle being turned into a cage.
          This is a working manual for both.
        </p>
        <p>
          It takes the machinery of influence seriously — how belief is engineered, how
          crowds are pointed, how a mind is captured — and treats that knowledge as
          something to defend people with, never something to use on them. Its spine is
          a single commitment:{" "}
          <span className="text-accent-violet-text">no followers, only fellow travelers.</span>
        </p>
        <p>
          {edition?.pageCount
            ? `Digital edition · ${edition.pageCount} pages · yours to keep.`
            : "Digital edition · yours to keep."}{" "}
          No membership required, and nothing in it is held back for a higher tier.
        </p>
      </div>

      <p className="mt-6 font-mono text-[12px] text-text-muted">
        New to the circle?{" "}
        <a href="/onboarding.html" className="text-accent-violet-text hover:underline">
          Start with the welcome deck
        </a>{" "}
        — a short walk through what the Cult of Psyche is and how we gather.
      </p>

      <ol className="mt-10 space-y-3">
        {volumes.map(([roman, title, blurb]) => (
          <li key={roman} className="border-l-2 border-accent-violet/25 pl-4">
            <p className="font-mono text-xs text-accent-violet-text/70">Volume {roman}</p>
            <p className="font-display text-lg text-text-primary">{title}</p>
            <p className="font-mono text-xs leading-relaxed text-text-muted">{blurb}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-xl border border-accent-violet/25 bg-gradient-to-b from-accent-violet/5 to-surface p-6">
        {PRICE_USD > 0 ? (
          <BookCta sku={SKU} price={PRICE_USD} />
        ) : (
          <p className="text-center font-mono text-sm text-text-muted">
            Coming soon.
          </p>
        )}
        {!edition && PRICE_USD > 0 && (
          <p className="mt-3 text-center font-mono text-[12px] text-text-muted">
            (Edition is being compiled.)
          </p>
        )}
      </div>

      <p className="mt-6 font-mono text-[12px] text-text-muted">
        The Handbook is the outer codex. Its counterpart, the inner one, is the{" "}
        <Link href="/psychenomicon" className="text-accent-violet-text hover:underline">
          Psychenomicon
        </Link>
        .
      </p>
    </main>
  );
}
