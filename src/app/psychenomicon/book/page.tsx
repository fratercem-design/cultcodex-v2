import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BookBuyButton } from "@/components/book/book-buy-button";

const SKU = "psychenomicon-vol-1";
const PRICE = 19;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Psychenomicon — Volume I — CultCodex",
  description: "An illustrated mythography compiling the first chapters of the Psychenomicon.",
  alternates: { canonical: "/psychenomicon/book" },
};

export default async function BookPage() {
  const user = await getCurrentUser().catch(() => null);

  const [edition, owned, samples] = await Promise.all([
    prisma.bookEdition.findUnique({
      where: { sku: SKU },
      select: { title: true, pageCount: true, chapterFrom: true, chapterTo: true },
    }).catch(() => null),
    user
      ? prisma.bookPurchase.findUnique({ where: { userId_sku: { userId: user.id, sku: SKU } }, select: { id: true } }).catch(() => null)
      : Promise.resolve(null),
    prisma.psychenomiconChapter.findMany({
      where: { artGeneratedAt: { not: null } },
      orderBy: { chapterNumber: "asc" },
      take: 3,
      select: { slug: true },
    }).catch(() => []),
  ]);

  const isOwner = !!owned || user?.role === "admin";
  const chapterCount =
    edition && edition.chapterTo >= edition.chapterFrom
      ? edition.chapterTo - edition.chapterFrom + 1
      : 24;

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">
        {"/// psychenomicon · the_book"}
      </p>
      <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-text-primary">
        The Psychenomicon — Volume I
      </h1>
      <p className="mt-2 font-mono text-sm text-text-muted">The Early Transmissions</p>

      <div className="mt-8 flex gap-3">
        {samples.map((s) => (
          <img
            key={s.slug}
            src={"/api/psychenomicon-art/" + s.slug + "/cover"}
            alt=""
            loading="lazy"
            className="h-48 w-32 flex-shrink-0 rounded border border-accent-violet/20 object-cover sm:h-64 sm:w-44"
          />
        ))}
      </div>

      <div className="mt-8 space-y-4 font-mono text-sm leading-relaxed text-text-muted">
        <p>{chapterCount} illustrated chapters, compiled into a single volume.</p>
        <p>{edition ? "Digital PDF · " + edition.pageCount + " pages ·yours to keep." : "Digital PDF ·yours to keep."}</p>
      </div>

      <div className="mt-8 rounded-xl border border-accent-violet/25 bg-gradient-to-b from-accent-violet/5 to-surface p-6">
        {isOwner ? (
          <div className="space-y-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">{"/// psychenomicon · the_book"}</p>
            <Link href={"/api/psychenomicon/book/" + SKU} className="inline-block w-full rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-sm font-bold text-accent-violet transition-all hover:bg-accent-violet/25">Download the PDF →</Link>
          </div>
        ) : (
          <BookBuyButton sku={SKU} signedIn={!!user} price={PRICE} />
        )}
        {!edition && (
          <p className="mt-3 font-mono text-[10px] text-text-muted text-center">(Edition is being compiled.)</p>
        )}
      </div>

      <p className="mt-6 font-mono text-[11px] text-text-muted">
        Prefer to read online? The full archive lives in the <Link href="/psychenomicon" className="text-accent-violet hover:underline">Psychenomicon</Link>.
      </p>
    </main>
  );
}
