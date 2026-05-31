import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasSystemTier } from "@/lib/subscription";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/red-room" },
  title: "Red Room — CultCodex",
  description: "Unfiltered analysis. No softening. Oracle-tier access only.",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

async function getRedRoomEpisodes() {
  return prisma.episode.findMany({
    where: {
      status: "published",
      summaryLong: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      airDate: true,
      summaryShort: true,
      summaryLong: true,
      thumbnailUrl: true,
      episodeNumber: true,
    },
    orderBy: { airDate: "desc" },
    take: 20,
  });
}

export default async function RedRoomPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin?callbackUrl=/red-room");
  }

  const oracle = await hasSystemTier(user.id);

  if (!oracle) {
    return <RedRoomGate />;
  }

  const episodes = await getRedRoomEpisodes();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0000" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden border-b"
        style={{ borderColor: "rgba(180,0,0,0.25)", backgroundColor: "#0d0000" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(ellipse at top, rgba(200,0,0,0.3) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-14">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.4em] mb-3"
            style={{ color: "rgba(220,40,40,0.6)" }}
          >
            ✦ &nbsp; Oracle Access &nbsp; ✦
          </p>
          <h1
            className="font-display text-5xl font-black tracking-tight"
            style={{ color: "#ff2020", textShadow: "0 0 60px rgba(200,0,0,0.6), 0 0 20px rgba(200,0,0,0.4)" }}
          >
            THE RED ROOM
          </h1>
          <p
            className="mt-4 font-mono text-sm leading-relaxed max-w-xl"
            style={{ color: "rgba(220,160,160,0.8)" }}
          >
            No filter. No softening. No performance of balance.
            Raw analysis of the patterns, the power structures, and what
            the transmissions actually reveal when you stop being careful about it.
          </p>
          <div
            className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest"
            style={{
              border: "1px solid rgba(200,0,0,0.3)",
              backgroundColor: "rgba(200,0,0,0.08)",
              color: "rgba(220,100,100,0.9)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "rgba(255,30,30,0.9)" }}
            />
            Oracle Clearance Active
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* What this is */}
        <section
          className="mb-10 rounded-xl p-6"
          style={{
            border: "1px solid rgba(180,0,0,0.2)",
            backgroundColor: "rgba(20,0,0,0.6)",
          }}
        >
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-3"
            style={{ color: "rgba(255,80,80,0.8)" }}
          >
            What You&apos;re Entering
          </h2>
          <div
            className="font-mono text-sm leading-relaxed space-y-3"
            style={{ color: "rgba(220,180,180,0.7)" }}
          >
            <p>
              The archive contains everything that was said. The Red Room contains what it means —
              without hedging, without diplomatic phrasing, without worrying whether the subject
              would approve of the framing.
            </p>
            <p>
              Behavioral profiles. Power dynamics. Recurring deceptions. What the body language
              said when the words didn&apos;t. What the absences mean. Who protects whom and why.
            </p>
            <p style={{ color: "rgba(255,100,100,0.7)" }}>
              This is the unedited version of the analysis. Nothing softened.
            </p>
          </div>
        </section>

        {/* Deep Analysis Episodes */}
        <section className="mb-10">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: "rgba(255,80,80,0.7)" }}
          >
            Full Transmission Analysis
          </h2>
          <div className="space-y-4">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/episodes/${ep.slug}`}
                className="group block rounded-xl p-5 transition-all"
                style={{
                  border: "1px solid rgba(160,0,0,0.2)",
                  backgroundColor: "rgba(15,0,0,0.5)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {ep.episodeNumber && (
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: "rgba(180,60,60,0.7)" }}
                        >
                          #{ep.episodeNumber}
                        </span>
                      )}
                      {ep.airDate && (
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: "rgba(160,80,80,0.5)" }}
                        >
                          {new Date(ep.airDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-mono text-sm font-bold leading-snug transition-colors"
                      style={{ color: "rgba(240,180,180,0.9)" }}
                    >
                      {ep.title}
                    </h3>
                    {ep.summaryShort && (
                      <p
                        className="mt-1.5 font-mono text-xs leading-relaxed line-clamp-2"
                        style={{ color: "rgba(180,120,120,0.65)" }}
                      >
                        {ep.summaryShort}
                      </p>
                    )}
                  </div>
                  <span
                    className="font-mono text-xs mt-1 flex-shrink-0 transition-colors"
                    style={{ color: "rgba(180,60,60,0.6)" }}
                  >
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Signal Proposals CTA */}
        <section
          className="rounded-xl p-6 text-center"
          style={{
            border: "1px solid rgba(180,0,0,0.25)",
            backgroundColor: "rgba(20,0,0,0.4)",
          }}
        >
          <p
            className="font-mono text-xs mb-2"
            style={{ color: "rgba(200,100,100,0.7)" }}
          >
            Your signal shapes what gets analyzed next.
          </p>
          <Link
            href="/signals"
            className="font-mono text-sm font-bold transition-colors"
            style={{ color: "rgba(255,100,100,0.9)" }}
          >
            Propose an Investigation →
          </Link>
        </section>
      </div>
    </div>
  );
}

function RedRoomGate() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div
          className="mb-6 text-6xl font-mono"
          style={{ color: "rgba(180,0,0,0.4)" }}
        >
          ◉
        </div>
        <h1
          className="font-display text-3xl font-bold mb-3"
          style={{ color: "rgba(200,80,80,0.8)" }}
        >
          Oracle Access Required
        </h1>
        <p className="font-mono text-sm text-text-muted mb-6 leading-relaxed">
          The Red Room is restricted to Oracle-tier members. This is where the unfiltered
          analysis lives — no diplomatic phrasing, no softening.
        </p>
        <Link
          href="/premium"
          className="inline-block rounded px-6 py-3 font-mono text-sm font-bold bg-accent-gold text-void hover:bg-accent-gold/80 transition-colors"
        >
          Become an Oracle →
        </Link>
      </div>
    </div>
  );
}
