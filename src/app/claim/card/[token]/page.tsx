import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ClaimButton } from "./claim-button";
import type { Metadata } from "next";

// Private gift links — never indexed.
export const metadata: Metadata = {
  title: "A Card Has Chosen You — CultCodex",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ClaimCardPage({ params }: PageProps) {
  const { token } = await params;

  const gift = await prisma.cardGift.findUnique({
    where: { token },
    include: { card: { select: { title: true, subtitle: true, artUrl: true, slug: true, rarity: true } } },
  });
  if (!gift) notFound();

  const editionLabel = gift.edition === "founders" ? "Founder's Edition" : gift.edition;

  if (gift.claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080810" }}>
        <div className="text-center space-y-5 max-w-md">
          <div className="font-mono text-[12px] uppercase tracking-[0.7em] text-accent-gold-text/80">
            Living Oracle Deck
          </div>
          <div className="text-accent-gold/20 text-2xl">🃏</div>
          <p className="font-mono text-xs text-white/30 uppercase tracking-[0.12em]">
            This card has already been claimed.
          </p>
          <p className="font-serif text-sm text-white/20 italic">
            {gift.card.title} · {editionLabel} №{gift.serial} has found its keeper.
          </p>
          <Link
            href="/cards"
            className="inline-block font-mono text-[12px] text-accent-gold-text/80 hover:text-accent-gold-text/80 transition-colors uppercase tracking-[0.12em] mt-4"
          >
            Enter the archive →
          </Link>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  const callbackUrl = `/claim/card/${token}`;

  return (
    <div className="min-h-screen" style={{ background: "#080810" }}>
      <div className="max-w-lg mx-auto px-6 py-16 text-center space-y-10">
        <div className="space-y-4">
          <div className="font-mono text-[12px] uppercase tracking-[0.7em] text-accent-gold-text/80">
            Living Oracle Deck &nbsp;·&nbsp; {editionLabel} &nbsp;·&nbsp; №{gift.serial}
          </div>
          <h1 className="font-serif text-white text-3xl" style={{ textShadow: "0 0 60px rgba(200,169,107,0.25)" }}>
            A card has chosen you.
          </h1>
        </div>

        {gift.card.artUrl && (
          <div
            className="mx-auto overflow-hidden rounded-xl max-w-xs"
            style={{
              border: "1px solid rgba(200,169,107,0.2)",
              boxShadow: "0 0 80px rgba(200,169,107,0.1), 0 0 120px rgba(120,60,200,0.08)",
            }}
          >
            <Image
              src={gift.card.artUrl}
              alt={gift.card.title}
              width={320}
              height={448}
              className="w-full object-cover"
              priority
            />
          </div>
        )}

        <div className="space-y-2">
          <h2 className="font-serif text-accent-gold-text text-xl">{gift.card.title}</h2>
          {gift.card.subtitle && (
            <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/30">{gift.card.subtitle}</p>
          )}
        </div>

        <div className="font-serif text-sm text-white/40 leading-[2] space-y-4">
          <p>
            This card cannot be bought. Ever. Cards from the Living Oracle Deck are
            given — and this one was set aside for you before the deck went live.
          </p>
          {gift.note && <p className="italic text-white/55">&ldquo;{gift.note}&rdquo;</p>}
          <p className="font-mono text-[12px] not-italic uppercase tracking-[0.12em] text-accent-gold-text/80">
            First provenance · marked before the awakening
          </p>
        </div>

        {!user ? (
          <div className="space-y-6">
            <p className="font-mono text-[12px] text-white/20 uppercase tracking-[0.12em]">
              Sign in to claim it into your vault.
            </p>
            <Link
              href={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="block w-full py-5 font-mono text-xs uppercase tracking-[0.12em] transition-all text-center text-accent-gold-text/80 hover:text-accent-gold-text"
              style={{
                border: "1px solid rgba(200,169,107,0.3)",
                background: "rgba(200,169,107,0.05)",
                borderRadius: 4,
              }}
            >
              Enter to Claim
            </Link>
            <p className="font-mono text-[12px] text-white/15">
              This card is addressed to whoever holds this link. It will wait.
            </p>
          </div>
        ) : (
          <ClaimButton token={token} />
        )}

        <div className="pt-8 font-mono text-[7px] uppercase tracking-[0.12em] text-white/10">
          CultCodex &nbsp;·&nbsp; The Living Archive &nbsp;·&nbsp; cultcodex.me
        </div>
      </div>
    </div>
  );
}
