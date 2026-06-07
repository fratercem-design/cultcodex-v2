import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/members" },
  title: "Member Roll — CultCodex",
  description:
    "The official roll of initiated CultCodex premium members. These souls have opened the archive.",
};

const MEMBER_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
  memberTitle: true,
  codexSlug: true,
  codexPagePublic: true,
  subscriptionTier: true,
  isLifetimeMember: true,
  createdAt: true,
  role: true,
} as const;

async function getOracleMembers() {
  return prisma.codexUser.findMany({
    where: {
      isPublicMember: true,
      OR: [
        { role: "admin" },
        { isLifetimeMember: true },
        { subscriptionTier: "system", subscriptionStatus: "active" },
      ],
    },
    select: MEMBER_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

async function getPublicMembers() {
  return prisma.codexUser.findMany({
    where: {
      isPublicMember: true,
      subscriptionTier: "access",
      subscriptionStatus: "active",
    },
    select: MEMBER_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

async function getTotalPremiumCount() {
  return prisma.codexUser.count({
    where: {
      OR: [
        { role: "admin" },
        { subscriptionStatus: "active" },
        { isLifetimeMember: true },
      ],
    },
  });
}

export default async function MembersPage() {
  const [oracleMembers, members, totalCount] = await Promise.all([
    getOracleMembers(),
    getPublicMembers(),
    getTotalPremiumCount(),
  ]);

  const allPublic = [...oracleMembers, ...members];
  const privateCount = totalCount - allPublic.length;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-accent-gold/10 bg-gradient-to-b from-[#1a0033] via-[#0d001a] to-void">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-gold/25 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent-cyan/15 via-transparent to-transparent" />
        </div>

        {/* Decorative rune line */}
        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/60">
            ✦ &nbsp; Official Record &nbsp; ✦
          </p>
          <h1
            className="mt-3 font-display text-4xl font-bold tracking-tight text-accent-gold sm:text-5xl"
            style={{ textShadow: "0 0 40px rgba(212,175,55,0.4)" }}
          >
            The Member Roll
          </h1>
          <p className="mx-auto mt-4 max-w-md font-mono text-sm leading-relaxed text-text-muted">
            These are the initiated. The ones who opened the archive and said{" "}
            <span className="italic text-text-primary">yes</span>.
          </p>

          <Link
            href="/leaderboard"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/5 px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-accent-gold transition-colors hover:bg-accent-gold/10"
          >
            ◆ View the rank leaderboard →
          </Link>

          {/* Count bar — only shown once the roster reaches a meaningful size */}
          {totalCount >= 20 && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-accent-gold/20 bg-accent-gold/5 px-5 py-2">
              <span
                className="font-display text-2xl font-bold text-accent-gold"
                style={{ textShadow: "0 0 20px rgba(212,175,55,0.5)" }}
              >
                {totalCount}
              </span>
              <span className="font-mono text-xs text-text-muted">
                souls initiated
                {privateCount > 0 && (
                  <span className="ml-1 text-text-muted/50">
                    · {privateCount} prefer anonymity
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* Oracle Contributors — always shown if any exist */}
        {oracleMembers.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(to right, rgba(212,175,55,0.4), transparent)" }}
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/70">
                ✦ Archive Contributors — Oracle Tier
              </p>
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(to left, rgba(212,175,55,0.4), transparent)" }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {oracleMembers.map((member, i) => (
                <MemberCard key={member.id} member={member} index={i} oracle />
              ))}
            </div>
          </section>
        )}

        {allPublic.length === 0 ? (
          /* Empty state */
          <div className="py-20 text-center">
            <p className="text-4xl">🌑</p>
            <p className="mt-4 font-display text-lg text-accent-gold">
              The roll is empty — for now
            </p>
            <p className="mt-2 font-mono text-xs text-text-muted">
              Premium members can opt in from their{" "}
              <Link href="/settings/profile" className="text-accent-cyan hover:underline">
                profile settings
              </Link>
              .
            </p>
          </div>
        ) : members.length > 0 ? (
          <>
            {oracleMembers.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="h-px flex-1"
                  style={{ background: "linear-gradient(to right, rgba(100,200,255,0.2), transparent)" }}
                />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/50">
                  Initiate+ Members
                </p>
                <div
                  className="h-px flex-1"
                  style={{ background: "linear-gradient(to left, rgba(100,200,255,0.2), transparent)" }}
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member, i) => (
                <MemberCard key={member.id} member={member} index={i} />
              ))}
            </div>

            {/* Opt-in nudge */}
            <div className="mt-12 rounded-xl border border-accent-gold/20 bg-gradient-to-r from-accent-gold/5 via-transparent to-accent-cyan/5 p-6 text-center">
              <p className="font-mono text-xs text-text-muted">
                Premium member?{" "}
                <Link
                  href="/settings/profile"
                  className="font-bold text-accent-gold hover:underline"
                >
                  Add yourself to the roll →
                </Link>
              </p>
            </div>
          </>
        ) : null}

        {/* Not a member CTA */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="font-mono text-xs text-text-muted">
            Not yet initiated?{" "}
            <Link
              href="/premium"
              className="font-bold text-accent-gold hover:underline"
            >
              Join the archive for $10/month →
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

function MemberCard({
  member,
  index,
  oracle = false,
}: {
  member: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    memberTitle: string | null;
    codexSlug: string | null;
    codexPagePublic: boolean;
    subscriptionTier: string | null;
    isLifetimeMember: boolean;
    createdAt: Date;
    role: string;
  };
  index: number;
  oracle?: boolean;
}) {
  const isAdmin = member.role === "admin";
  const isSystem = member.subscriptionTier === "system" || isAdmin || member.isLifetimeMember;
  const hasPage = isSystem && member.codexSlug && member.codexPagePublic;
  const joinYear = new Date(member.createdAt).getFullYear();
  const joinMonth = new Date(member.createdAt).toLocaleDateString("en-US", {
    month: "short",
  });

  // Rotate between gold and cyan accents for visual rhythm
  const accent = index % 3 === 2 ? "cyan" : "gold";

  const cardClassName = `group relative overflow-hidden rounded-xl border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
    accent === "cyan"
      ? "border-accent-cyan/20 hover:border-accent-cyan/40 hover:shadow-accent-cyan/10"
      : "border-accent-gold/20 hover:border-accent-gold/40 hover:shadow-accent-gold/10"
  }`;

  const inner = (
    <>
      {/* Oracle badge */}
      {oracle && (
        <div className="absolute right-3 top-3">
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest"
            style={{
              border: "1px solid rgba(212,175,55,0.5)",
              backgroundColor: "rgba(212,175,55,0.12)",
              color: "rgba(212,175,55,0.9)",
            }}
          >
            ✦ Oracle
          </span>
        </div>
      )}
      {/* Founding member glow for early joiners */}
      {!oracle && index < 10 && (
        <div className="absolute right-3 top-3">
          <span className="rounded-full border border-accent-gold/30 bg-accent-gold/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-accent-gold">
            Founder
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {member.avatarUrl ? (
          <div
            className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 ${
              accent === "cyan" ? "border-accent-cyan/30" : "border-accent-gold/30"
            }`}
          >
            <Image
              src={member.avatarUrl}
              alt={member.displayName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 text-lg ${
              accent === "cyan"
                ? "border-accent-cyan/30 bg-accent-cyan/10"
                : "border-accent-gold/30 bg-accent-gold/10"
            }`}
          >
            {member.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-bold text-text-primary">
            {member.displayName}
          </p>
          {member.memberTitle ? (
            <p
              className={`truncate font-mono text-[11px] italic ${
                accent === "cyan" ? "text-accent-cyan" : "text-accent-gold"
              }`}
            >
              {member.memberTitle}
            </p>
          ) : isAdmin ? (
            <p className="font-mono text-[11px] text-accent-gold">Admin</p>
          ) : null}
          <p className="mt-0.5 font-mono text-[10px] text-text-muted/60">
            Member since {joinMonth} {joinYear}
          </p>
          {hasPage && (
            <p className={`mt-1 font-mono text-[10px] ${accent === "cyan" ? "text-accent-cyan/60" : "text-accent-gold/60"}`}>
              View page →
            </p>
          )}
        </div>
      </div>
    </>
  );

  return hasPage ? (
    <Link href={`/members/${member.codexSlug}`} className={`${cardClassName} block`}>
      {inner}
    </Link>
  ) : (
    <div className={cardClassName}>
      {inner}
    </div>
  );
}
