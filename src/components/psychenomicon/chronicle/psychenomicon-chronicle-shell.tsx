/**
 * Server-renderable heading for /psychenomicon. The chronicle itself is
 * client-only (ssr: false) and fetches its data after mount, so without this
 * the server HTML had no H1 and no text at all. Shown as the dynamic-import
 * fallback and while the chronicle loads, then replaced by the chronicle's
 * own heading, so the page never carries two H1s.
 */
export function PsychenomiconChronicleShell() {
  return (
    <main className="min-h-screen bg-void">
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-24 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-oracle">{"///"} The Psychenomicon · AI myth engine</p>
        <h1 className="font-display text-3xl font-bold text-ink">The Psychenomicon</h1>
        <p className="mx-auto max-w-[60ch] font-display text-[17px] leading-relaxed text-ink-2">
          A living book written from the archive: every episode becomes an illustrated chapter that
          tracks the people, conflicts and patterns running through the show.
        </p>
      </div>
    </main>
  );
}
