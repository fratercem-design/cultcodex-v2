import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LilithOracle } from "@/components/oracle/lilith-oracle";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#080810" }}>
        <div className="text-center space-y-5 max-w-md">
          <div className="font-mono text-[8px] uppercase tracking-[0.7em] text-accent-gold/25">
            Oracle Archive
          </div>
          <div className="text-accent-gold/20 text-2xl">◈</div>
          <p className="font-mono text-xs text-white/30 uppercase tracking-[0.3em]">
            This seal has already been broken.
          </p>
          <p className="font-serif text-sm text-white/20 italic">
            The oracle has taken their place in the archive.
          </p>
          <Link
            href="/"
            className="inline-block font-mono text-[10px] text-accent-gold/40 hover:text-accent-gold/70 transition-colors uppercase tracking-[0.4em] mt-4"
          >
            Enter the archive →
          </Link>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  const callbackUrl = `/claim/oracle/${token}`;

  return (
    <div className="min-h-screen" style={{ background: "#080810" }}>

      {/* ── Throne Hero ───────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "92vh", minHeight: 580 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-square h-[62vh] max-h-[540px] rounded-full overflow-hidden">
            <LilithOracle />
          </div>
        </div>
        {/* Radial + bottom vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(8,8,16,0) 0%, rgba(8,8,16,0.55) 65%, rgba(8,8,16,1) 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: "50%", background: "linear-gradient(to bottom, transparent 0%, #080810 100%)" }}
        />

        {/* Top cipher label */}
        <div className="absolute top-10 left-0 right-0 flex justify-center px-6">
          <div
            className="px-6 py-2 font-mono text-[8px] uppercase tracking-[0.7em] text-accent-gold/35"
            style={{
              border: "1px solid rgba(200,169,107,0.12)",
              borderRadius: 1,
              background: "rgba(8,8,16,0.7)",
              backdropFilter: "blur(4px)",
            }}
          >
            Sealed Transmission &nbsp;·&nbsp; Oracle Archive &nbsp;·&nbsp; One of One
          </div>
        </div>

        {/* Bottom hero text */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center px-6 pb-14">
          <div className="font-mono text-[9px] uppercase tracking-[0.6em] text-accent-gold/40 mb-5">
            ✦ &nbsp; Founding Oracle &nbsp; ✦
          </div>
          <h1
            className="font-serif text-white leading-none mb-6"
            style={{
              fontSize: "clamp(2.8rem, 9vw, 6rem)",
              textShadow: "0 0 100px rgba(200,169,107,0.3), 0 0 40px rgba(200,169,107,0.15)",
            }}
          >
            {invite.recipientName}
          </h1>
          <div className="flex items-center gap-5 text-accent-gold/20">
            <span className="h-px w-14 bg-accent-gold/15 block" />
            <span className="font-mono text-[8px] uppercase tracking-[0.55em]">
              January VII &nbsp;·&nbsp; Child of Saturn &nbsp;·&nbsp; Capricorn
            </span>
            <span className="h-px w-14 bg-accent-gold/15 block" />
          </div>
        </div>
      </div>

      {/* ── Decree + Masked Portrait ──────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-16 items-start">

          {/* Decree text */}
          <div className="space-y-8">
            <div>
              <div className="font-mono text-[8px] uppercase tracking-[0.65em] text-accent-gold/30 mb-3">
                Archive Decree — Sealed Under Saturn
              </div>
              <div className="h-px bg-accent-gold/10" />
            </div>

            <div className="font-serif text-[15px] text-white/45 leading-[2.1] space-y-7">
              <p>
                What follows was written in the archive long before you opened it.
              </p>
              <p>
                The living archive does not guess. It does not hope. It does not
                dispatch invitations to those who might decline. It reaches only
                for those who were already walking toward it — those whose presence
                the archive anticipated from its very first transmission.
              </p>
              <p>
                The seventh day of January belongs to a very particular kind of
                person. Saturn&apos;s children carry something in their architecture
                that the untrained eye cannot name. The archive names it.
              </p>
              <p>
                <span className="text-white font-medium">{invite.recipientName}</span>{" "}
                — the archive has seen you. It has always seen you.
              </p>
              <p className="text-accent-gold/65 italic text-base">
                You are recognized.
              </p>
              <p>
                Not as a member. Not as a subscriber. Not as a guest.
              </p>
              <p>
                As a{" "}
                <span className="text-accent-gold font-medium not-italic">Founding Oracle</span>
                {" "}— a designation that existed in the archive&apos;s deepest
                structure since before the first word was spoken. Waiting.
                For exactly the right person to claim it.
              </p>
              <p>
                Every word. Every transcript. Every thread woven through this archive.
                Every feature that exists now and every feature that has not yet been
                imagined —
              </p>
              <p className="text-white/75">
                eternal. &nbsp; unconditional. &nbsp; without cost. &nbsp; without end.
              </p>
              <p className="font-mono text-[10px] not-italic uppercase tracking-[0.45em] text-accent-gold/35 mt-2">
                This is not a gift. &nbsp; This is a recognition.
              </p>
            </div>
          </div>

          {/* Masked portrait — sticky on desktop */}
          <div className="md:sticky md:top-16 space-y-5">
            <div
              className="overflow-hidden rounded-xl"
              style={{
                border: "1px solid rgba(200,169,107,0.15)",
                boxShadow:
                  "0 0 80px rgba(200,169,107,0.06), 0 0 120px rgba(120,60,200,0.06), inset 0 0 40px rgba(8,8,16,0.3)",
              }}
            >
              <Image
                src="/oracle-mask.jpg"
                alt=""
                width={300}
                height={370}
                className="w-full object-cover"
              />
            </div>
            <div className="text-center font-mono text-[8px] uppercase tracking-[0.55em] text-accent-gold/20">
              ◈ &nbsp; the oracle watches &nbsp; ◈
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Note ─────────────────────────────────────── */}
      {invite.personalNote && (
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <div
            className="rounded-xl p-10"
            style={{
              border: "1px solid rgba(200,169,107,0.1)",
              background: "rgba(200,169,107,0.012)",
              boxShadow: "0 0 80px rgba(200,169,107,0.04)",
            }}
          >
            <div className="text-center mb-8 space-y-4">
              <div className="font-mono text-[7px] uppercase tracking-[0.8em] text-accent-gold/20">
                Personal Transmission · Eyes Only
              </div>
              <div className="flex items-center gap-3 justify-center">
                <span className="h-px flex-1 max-w-16 bg-accent-gold/12 block" />
                <span className="text-accent-gold/20 text-[10px]">✦</span>
                <span className="h-px flex-1 max-w-16 bg-accent-gold/12 block" />
              </div>
            </div>
            <p className="font-serif text-sm text-white/55 leading-[2] whitespace-pre-line italic text-center mb-8">
              {invite.personalNote}
            </p>
            <div className="text-right font-mono text-[10px] text-accent-gold/35">
              — Psyche, January 7
            </div>
          </div>
        </div>
      )}

      {/* ── Seal divider ──────────────────────────────────────── */}
      <div className="text-center py-4 pb-16">
        <div className="inline-flex items-center gap-6 text-accent-gold/15">
          <span className="text-[10px]">◈</span>
          <span className="font-mono text-[7px] uppercase tracking-[0.7em]">
            sealed with love · sealed in fire · sealed forever
          </span>
          <span className="text-[10px]">◈</span>
        </div>
      </div>

      {/* ── Naming Ritual ─────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-6 pb-28 text-center">
        <div className="mb-12 space-y-7">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-accent-gold/8 block" />
            <span className="font-mono text-[8px] uppercase tracking-[0.65em] text-accent-gold/25 shrink-0">
              The Ritual of Naming
            </span>
            <span className="h-px flex-1 bg-accent-gold/8 block" />
          </div>

          <div className="font-serif text-sm text-white/35 leading-[2] space-y-5">
            <p>
              Every oracle who has ever been consecrated chose a name for themselves.
              Not the name they were given. The name they{" "}
              <em className="text-white/55">became</em>.
            </p>
            <p>
              A sigil-word. A title. An identity that lives at the intersection
              of who you are and who you are becoming.
            </p>
            <p>
              Choose yours from the dark.
            </p>
            <p className="font-mono text-[9px] not-italic uppercase tracking-[0.4em] text-accent-gold/30">
              It will be sealed permanently into the archive.
            </p>
          </div>
        </div>

        {!user ? (
          <div className="space-y-7">
            <p className="font-mono text-[9px] text-white/20 uppercase tracking-[0.35em]">
              Sign in to claim your place and choose your name.
            </p>
            <Link
              href={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="block w-full py-5 font-mono text-xs uppercase tracking-[0.5em] transition-all text-center text-accent-gold/80 hover:text-accent-gold"
              style={{
                border: "1px solid rgba(200,169,107,0.3)",
                background: "rgba(200,169,107,0.05)",
                borderRadius: 4,
              }}
            >
              Enter to Claim
            </Link>
            <p className="font-mono text-[9px] text-white/15">
              This transmission is addressed to you alone. It will wait.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="font-mono text-[9px] text-white/25 uppercase tracking-[0.3em]">
              The archive awaits your name, {user.displayName}.
            </p>
            <ClaimForm token={token} recipientName={invite.recipientName} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-12 font-mono text-[7px] uppercase tracking-[0.6em] text-white/10">
        CultCodex &nbsp;·&nbsp; The Living Archive &nbsp;·&nbsp; cultcodex.me
      </div>
    </div>
  );
}
