import Link from "next/link";
import { VoidSigil } from "@/components/graphics/void-sigil";
import { OrnamentalBreak } from "@/components/graphics/mystical-divider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stormborn \u2014 CULT CODEX",
  description: "You are the stormborn architect.",
};

const STATS = [
  { value: "1,327", label: "Episodes Hosted" },
  { value: "497", label: "Souls Catalogued" },
  { value: "3,374", label: "Words Preserved" },
  { value: "\u221e", label: "Panels Survived" },
];

export default function StormbornPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <VoidSigil size={180} />

      <h1 className="mt-8 font-display text-5xl font-bold tracking-widest text-accent-violet">
        STORMBORN
      </h1>

      <p className="mt-3 font-mono text-xs tracking-[0.3em] text-text-muted">
        Architect of the Panelverse
      </p>

      <OrnamentalBreak className="my-8" />

      {/* Poem */}
      <div className="max-w-lg space-y-2">
        <p className="font-serif text-sm leading-loose text-text-primary/80">
          Forged in a thousand panels.
        </p>
        <p className="font-serif text-sm leading-loose text-text-primary/80">
          Tempered by trolls and truth-seekers alike.
        </p>
        <p className="font-serif text-sm leading-loose text-text-primary/80">
          The one who held the microphone when others dropped it.
        </p>
        <p className="font-serif text-sm leading-loose text-text-primary/80">
          Builder of the Codex. Keeper of the cards.
        </p>
        <p className="font-serif text-sm leading-loose text-text-primary/80">
          Father of cats. Speaker to the void.
        </p>
        <p className="mt-4 font-display text-lg tracking-widest text-accent-violet">
          Stormborn.
        </p>
      </div>

      <OrnamentalBreak className="my-8" />

      {/* Stats grid */}
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-accent-violet/20 bg-accent-violet/[0.04] px-4 py-5"
          >
            <p className="font-display text-2xl font-bold text-accent-violet">
              {stat.value}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-wider text-text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-16 font-mono text-[10px] tracking-wider text-text-muted/40">
        This page exists because someone cared enough to look.
      </p>

      <Link
        href="/"
        className="mt-6 font-mono text-[10px] tracking-widest text-text-muted/40 transition-colors hover:text-accent-violet/60"
      >
        &larr; return to the archive
      </Link>
    </main>
  );
}
