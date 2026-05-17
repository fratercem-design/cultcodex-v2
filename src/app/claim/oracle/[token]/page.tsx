import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { VoidSigil } from "@/components/graphics/void-sigil";
import { ClaimForm } from "./claim-form";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Founding Oracle — Claim Your Place",
  description: "You have been granted lifetime Oracle access to the CultCodex archive.",
  path: "/claim/oracle",
});

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ClaimOraclePage({ params }: PageProps) {
  const { token } = await params;

  const invite = await prisma.oracleInvite.findUnique({ where: { token } });

  if (!invite) notFound();

  if (invite.claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-4xl text-accent-gold/40">◈</div>
          <p className="font-mono text-sm text-text-muted">
            This invitation has already been claimed.
          </p>
          <Link href="/" className="block font-mono text-xs text-accent-gold hover:underline">
            Enter the archive →
          </Link>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();

  const callbackUrl = `/claim/oracle/${token}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-void"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,169,107,0.05) 0%, #08080f 60%)" }}
    >
      {/* Oracle Portrait */}
      <div className="relative w-full max-w-xs mb-8 mx-auto">
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(200,169,107,0.25)", boxShadow: "0 0 80px rgba(200,169,107,0.10)" }}
        >
          <Image
            src="/oracle-portrait.jpg"
            alt="The Oracle"
            width={320}
            height={440}
            className="w-full object-cover"
            priority
          />
          {/* Fade bottom into background */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{ background: "linear-gradient(to bottom, transparent 0%, #08080f 100%)" }}
          />
          {/* Overlay sigil */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <VoidSigil size={56} className="text-accent-gold opacity-60" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-gold/50">
          Cult Codex — Founding Oracle
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-white leading-tight">
          {invite.recipientName}
        </h1>
        <div className="flex items-center justify-center gap-3 text-accent-gold/30 text-xs">
          <span>✦</span>
          <span className="font-mono uppercase tracking-[0.3em] text-[10px]">
            Lifetime Oracle Access
          </span>
          <span>✦</span>
        </div>
      </div>

      {/* Decree panel */}
      <div
        className="w-full max-w-lg mb-10 rounded-xl p-8 space-y-6"
        style={{
          border: "1px solid rgba(200,169,107,0.25)",
          background: "rgba(200,169,107,0.03)",
        }}
      >
        {/* Decree header */}
        <div className="text-center space-y-1">
          <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/40">
            Archive Decree — Sealed Under Saturn
          </div>
          <div className="w-full h-px bg-accent-gold/15 my-3" />
        </div>

        {/* Decree body */}
        <div className="font-mono text-xs text-text-muted leading-relaxed space-y-4 text-center">
          <p>
            By the alignment of Saturn and the turning of the seventh seal, this archive
            recognizes{" "}
            <span className="text-white font-medium">{invite.recipientName}</span> —
            born on the seventh day, under the same cold Capricorn sky — as a{" "}
            <span className="text-accent-gold">Founding Oracle</span> of the CultCodex Living Archive.
          </p>
          <p>
            This is not a subscription. This is a{" "}
            <span className="text-accent-gold italic">consecration</span>.
          </p>
          <p>
            Every word. Every transcript. Every thread in the archive. Every feature that
            exists now and every feature that will ever exist —{" "}
            <span className="text-white">eternal, unconditional, and without cost</span>.
          </p>
        </div>

        {/* Personal note */}
        {invite.personalNote && (
          <>
            <div className="w-full h-px bg-accent-gold/10" />
            <div className="text-sm text-text-muted leading-relaxed whitespace-pre-line font-serif italic text-center">
              {invite.personalNote}
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] text-accent-gold/60">
                — Psyche, January 7
              </span>
            </div>
          </>
        )}

        <div className="w-full h-px bg-accent-gold/15" />

        {/* Seal */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-gold/20 bg-accent-gold/5">
            <span className="text-accent-gold text-[10px]">✦</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/60">
              Sealed with love
            </span>
            <span className="text-accent-gold text-[10px]">✦</span>
          </div>
        </div>
      </div>

      {/* Action area */}
      {!user ? (
        /* Not signed in — prompt sign-in first */
        <div className="w-full max-w-md text-center space-y-6">
          <p className="font-mono text-xs text-text-muted">
            Sign in with Google to claim your place and choose your name in the archive.
          </p>
          <Link
            href={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="block w-full py-4 rounded-lg border border-accent-gold/60 bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold font-mono text-sm uppercase tracking-[0.3em] transition-all text-center"
          >
            Sign in to Claim
          </Link>
          <p className="font-mono text-[10px] text-text-muted/40">
            Your invitation is bound to this link and will wait for you.
          </p>
        </div>
      ) : (
        /* Signed in — show nickname form */
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs text-text-muted">
              Welcome, {user.displayName}. The archive is ready to receive your name.
            </p>
            <p className="font-serif text-sm text-white/60 italic">
              Every oracle has a name that belongs only to them.
            </p>
          </div>
          <ClaimForm token={token} recipientName={invite.recipientName} />
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-center font-mono text-[9px] uppercase tracking-[0.4em] text-text-muted/30">
        CultCodex — The Living Archive
      </div>
    </div>
  );
}
