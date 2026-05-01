import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{ slug: string }>;
}

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
      subscriptionTier: true,
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMember(slug);
  if (!member || (!member.codexPagePublic && member.role !== "admin")) {
    return { title: "Member — CultCodex" };
  }
  return {
    title: `${member.displayName} — CultCodex Member`,
    description: member.bio ?? `${member.displayName}'s personal codex page.`,
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const { slug } = await params;
  const [member, currentUser] = await Promise.all([
    getMember(slug),
    getCurrentUser(),
  ]);

  if (!member) notFound();

  const isOwner = currentUser?.id === member.id;
  if (!member.codexPagePublic && !isOwner && currentUser?.role !== "admin") {
    notFound();
  }

  const joinYear = new Date(member.createdAt).getFullYear();
  const joinMonth = new Date(member.createdAt).toLocaleDateString("en-US", { month: "long" });
  const isAdmin = member.role === "admin";
  const isSystem = member.subscriptionTier === "system" || isAdmin;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-accent-gold/10 bg-gradient-to-b from-[#1a0033] via-[#0d001a] to-void">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-gold/20 via-transparent to-transparent opacity-40" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/60">
            ✦ &nbsp; Full System Member &nbsp; ✦
          </p>

          {/* Avatar */}
          <div className="mx-auto mt-6 mb-4">
            {member.avatarUrl ? (
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-accent-gold/40 shadow-xl shadow-accent-gold/20">
                <Image src={member.avatarUrl} alt={member.displayName} fill className="object-cover" sizes="96px" />
              </div>
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent-gold/40 bg-accent-gold/10 text-4xl shadow-xl shadow-accent-gold/20">
                {member.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            {member.displayName}
          </h1>

          {member.memberTitle && (
            <p className="mt-2 font-mono text-sm italic text-accent-gold">
              {member.memberTitle}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {isAdmin ? (
              <span className="rounded-full border border-accent-gold/50 bg-accent-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent-gold">
                Admin
              </span>
            ) : isSystem ? (
              <span className="rounded-full border border-accent-violet/50 bg-accent-violet/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent-violet">
                Full System
              </span>
            ) : null}
            <span className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-[10px] text-text-muted">
              Member since {joinMonth} {joinYear}
            </span>
          </div>

          {isOwner && (
            <div className="mt-4">
              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-1.5 rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-4 py-2 font-mono text-[11px] text-accent-gold transition-colors hover:border-accent-gold/60 hover:bg-accent-gold/20"
              >
                Edit your page →
              </Link>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        {/* Bio */}
        {member.bio && (
          <section className="rounded-xl border border-border bg-surface p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60 mb-3">
              /// about
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
            <div key={s.label} className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="font-mono text-2xl font-bold text-accent-gold">{s.n}</p>
              <p className="mt-1 font-mono text-[10px] text-text-muted">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Footer nav */}
        <div className="flex justify-center gap-6 pt-4 border-t border-border">
          <Link href="/members" className="font-mono text-[11px] text-text-muted hover:text-accent-gold transition-colors">
            ← Member Roll
          </Link>
          <Link href="/subscribe" className="font-mono text-[11px] text-text-muted hover:text-accent-gold transition-colors">
            Get Full System →
          </Link>
        </div>
      </main>
    </>
  );
}
