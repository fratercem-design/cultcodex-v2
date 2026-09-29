import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TradingCard } from "@/components/cards/trading-card";
import type { TradingCardData } from "@/components/cards/trading-card";
import { getUserCollectionStats } from "@/lib/queries/cards";
import { BANNER_THEMES } from "@/lib/codex-page";
import { RankBadge } from "@/components/rank/rank-badge";
import { getUserRank } from "@/lib/rankings/get-user-rank";

interface Props {
  params: Promise<{ slug: string }>;
}

type SocialLink = { label: string; url: string };

async function getMember(slug: string) {
  return prisma.codexUser.findUnique({
    where: { codexSlug: slug },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      memberTitle: true,
      bio: true,
      codexPagePublic: true,
      codexSlug: true,
      codexBanner: true,
      codexLinks: true,
      codexShowCards: true,
      subscriptionTier: true,
      isLifetimeMember: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          favorites: true,
          savedTopics: true,
          savedQuotes: true,
        },
      },
    },
  });
}

async function getMemberCards(userId: string): Promise<TradingCardData[]> {
  const owned = await prisma.ownedCard.findMany({
    where: { userId },
    take: 6,
    orderBy: { obtainedAt: "desc" },
    include: {
      card: {
        select: {
          id: true,
          slug: true,
          cardType: true,
          rarity: true,
          title: true,
          subtitle: true,
          flavourText: true,
          artUrl: true,
          statA: true,
          statB: true,
          statC: true,
          abilities: true,
          totalMinted: true,
          maxSupply: true,
          season: true,
          collectorNo: true,
          obtainMethod: true,
        },
      },
    },
  });

  return owned
    .map((o) => ({ ...o.card, isFoil: o.isFoil }))
    .sort((a, b) => {
      const order = ["FORBIDDEN", "MYTHIC", "LEGENDARY", "ORACLE", "ANOMALY", "TRANSMISSION", "SIGNAL", "STATIC"];
      return order.indexOf(a.rarity) - order.indexOf(b.rarity);
    });
}

function getLinkIcon(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "▶";
  if (url.includes("twitter.com") || url.includes("x.com")) return "✕";
  if (url.includes("instagram.com")) return "◎";
  if (url.includes("twitch.tv")) return "◉";
  if (url.includes("substack.com")) return "✉";
  if (url.includes("tiktok.com")) return "◈";
  return "↗";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMember(slug);
  if (!member || (!member.codexPagePublic && member.role !== "admin")) {
    return { title: "Member — CultCodex" };
  }
  return {
    title: `${member.displayName} — CultCodex`,
    description: member.bio ?? `${member.displayName}'s codex in the Psycheverse.`,
    openGraph: {
      title: `${member.displayName} — CultCodex`,
      description: member.bio ?? `${member.displayName}'s personal codex.`,
    },
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const { slug } = await params;
  const [member, currentUser] = await Promise.all([
    getMember(slug).catch(() => null),
    getCurrentUser(),
  ]);

  if (!member) notFound();

  const isOwner = currentUser?.id === member.id;
  if (!member.codexPagePublic && !isOwner && currentUser?.role !== "admin") {
    notFound();
  }

  const [cards, collectionStats, memberRank] = await Promise.all([
    member.codexShowCards ? getMemberCards(member.id) : Promise.resolve([]),
    member.codexShowCards ? getUserCollectionStats(member.id, { includeWallet: false }).catch(() => null) : Promise.resolve(null),
    getUserRank(member.id, true).catch(() => null),
  ]);

  const joinYear = new Date(member.createdAt).getFullYear();
  const joinMonth = new Date(member.createdAt).toLocaleDateString("en-US", { timeZone: "UTC", month: "long" });
  const isAdmin = member.role === "admin";
  const isOracle = isAdmin || member.isLifetimeMember || member.subscriptionTier === "system";

  const bannerKey = member.codexBanner ?? "void";
  const bannerTheme = BANNER_THEMES[bannerKey] ?? BANNER_THEMES.void;
  const links = (member.codexLinks ?? []) as SocialLink[];

  return (
    <>
      {/* Banner */}
      <div className="relative" style={{ ...bannerTheme.style, minHeight: "180px" }}>
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 40% 60%, rgba(255,255,255,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Scan-line texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)",
          }}
        />

        {/* Tier badge top-right */}
        <div className="absolute top-4 right-4">
          {isAdmin ? (
            <span
              className="rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-widest"
              style={{ borderColor: bannerTheme.accent + "80", color: bannerTheme.accent, background: "rgba(0,0,0,0.4)" }}
            >
              Admin
            </span>
          ) : isOracle ? (
            <span
              className="rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-widest"
              style={{ borderColor: bannerTheme.accent + "80", color: bannerTheme.accent, background: "rgba(0,0,0,0.4)" }}
            >
              ✦ Oracle
            </span>
          ) : null}
        </div>

        {/* Owner edit button */}
        {isOwner && (
          <div className="absolute top-4 left-4">
            <Link
              href="/settings/profile"
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 font-mono text-[12px] text-white/70 transition-colors hover:border-white/40 hover:text-white backdrop-blur-sm"
            >
              ✎ Edit page
            </Link>
          </div>
        )}

        {/* Avatar — overlaps the banner/content boundary */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          {member.avatarUrl ? (
            <div
              className="relative h-24 w-24 overflow-hidden rounded-full"
              style={{
                border: `3px solid ${bannerTheme.accent}`,
                boxShadow: `0 0 30px ${bannerTheme.accent}40`,
              }}
            >
              <Image src={member.avatarUrl} alt={member.displayName} fill className="object-cover" sizes="96px" />
            </div>
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full font-display text-3xl font-bold text-white"
              style={{
                border: `3px solid ${bannerTheme.accent}`,
                background: `linear-gradient(135deg, ${bannerTheme.accent}20, rgba(0,0,0,0.6))`,
                boxShadow: `0 0 30px ${bannerTheme.accent}40`,
              }}
            >
              {member.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        {/* Name + title block — padded for avatar overlap */}
        <div className="pt-16 pb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            {member.displayName}
          </h1>
          {member.memberTitle && (
            <p className="mt-2 font-mono text-sm italic" style={{ color: bannerTheme.accent }}>
              {member.memberTitle}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span
              className="rounded-full border px-2.5 py-0.5 font-mono text-[12px] uppercase tracking-widest"
              style={{
                borderColor: bannerTheme.accent + "50",
                color: bannerTheme.accent,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              {isAdmin ? "Admin" : isOracle ? "✦ Oracle Tier" : "Initiate+"}
            </span>
            <span className="font-mono text-[12px] text-text-muted">
              Member since {joinMonth} {joinYear}
            </span>
          </div>

          {memberRank && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <Link
                href="/leaderboard"
                title={`${memberRank.score.toLocaleString("en-US")} codex score`}
                className="flex items-center gap-2"
              >
                <RankBadge rank={memberRank.progress.current} size="sm" />
                <span className="font-mono text-[12px] font-bold" style={{ color: bannerTheme.accent }}>
                  {memberRank.score.toLocaleString("en-US")}
                  <span className="ml-1 font-normal text-text-muted">codex score</span>
                </span>
              </Link>
            </div>
          )}

          {/* Social links */}
          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[12px] transition-all hover:opacity-100"
                  style={{
                    borderColor: bannerTheme.accent + "40",
                    color: bannerTheme.accent,
                    background: "rgba(0,0,0,0.3)",
                    opacity: 0.85,
                  }}
                >
                  <span className="text-[12px]">{getLinkIcon(link.url)}</span>
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Bio */}
          {member.bio && (
            <section
              className="rounded-xl border p-6"
              style={{ borderColor: bannerTheme.accent + "20", background: "rgba(0,0,0,0.2)" }}
            >
              <p
                className="font-mono text-[12px] uppercase tracking-[0.12em] mb-3"
                style={{ color: bannerTheme.accent + "80" }}
              >
                {"/// about"}
              </p>
              <p className="font-mono text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                {member.bio}
              </p>
            </section>
          )}

          {/* Archive stats */}
          <section className="grid grid-cols-3 gap-4">
            {[
              { n: member._count.favorites, label: "Transmissions saved" },
              { n: member._count.savedTopics, label: "Signals pinned" },
              { n: member._count.savedQuotes, label: "Moments saved" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border p-4 text-center"
                style={{ borderColor: bannerTheme.accent + "20", background: "rgba(0,0,0,0.2)" }}
              >
                <p
                  className="font-mono text-2xl font-bold"
                  style={{ color: bannerTheme.accent }}
                >
                  {s.n}
                </p>
                <p className="mt-1 font-mono text-[12px] text-text-muted">{s.label}</p>
              </div>
            ))}
          </section>

          {/* Card showcase */}
          {cards.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <p
                  className="font-mono text-[12px] uppercase tracking-[0.12em]"
                  style={{ color: bannerTheme.accent + "80" }}
                >
                  {"/// card archive"}
                </p>
                {collectionStats && collectionStats.ownedCount > 0 && (
                  <span className="font-mono text-[12px] text-text-muted">
                    {collectionStats.ownedCount.toLocaleString("en-US")} card
                    {collectionStats.ownedCount === 1 ? "" : "s"}
                    <span className="text-text-muted">
                      {" · "}
                      {collectionStats.completionPct}% of the archive
                    </span>
                  </span>
                )}
                <div
                  className="flex-1 border-t"
                  style={{ borderColor: bannerTheme.accent + "15" }}
                />
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {cards.map((card) => (
                  <TradingCard key={`${card.id}-${card.isFoil}`} card={card} size="sm" noTilt />
                ))}
              </div>
              {isOwner && (
                <p className="mt-4 text-center font-mono text-[12px] text-text-muted">
                  <Link href="/cards" className="hover:text-text-primary transition-colors" style={{ color: bannerTheme.accent }}>
                    Open your full collection →
                  </Link>
                </p>
              )}
            </section>
          )}

          {/* Footer nav */}
          <div
            className="flex justify-center gap-6 pt-4 border-t"
            style={{ borderColor: bannerTheme.accent + "15" }}
          >
            <Link href="/members" className="font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors">
              ← Member Roll
            </Link>
            {!isOracle && (
              <Link href="/premium" className="font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors">
                Get Oracle Access →
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
