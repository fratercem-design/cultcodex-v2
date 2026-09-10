export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSubscribed, hasSystemTier } from "@/lib/subscription";
import { PageHero } from "@/components/ui/page-hero";
import { ProfileForm } from "./profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Profile — CultCodex",
  description: "Manage your cult flair title and public member roll listing.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const [subscribed, systemTier, codexUser] = await Promise.all([
    isSubscribed(user.id),
    hasSystemTier(user.id),
    prisma.codexUser.findUnique({
      where: { id: user.id },
      select: {
        displayName: true,
        email: true,
        avatarUrl: true,
        memberTitle: true,
        isPublicMember: true,
        bio: true,
        codexSlug: true,
        codexPagePublic: true,
        codexBanner: true,
        codexLinks: true,
        codexShowCards: true,
        createdAt: true,
        role: true,
      },
    }),
  ]);

  if (!codexUser) redirect("/auth/signin");

  return (
    <div>
      <PageHero
        title="MEMBER PROFILE"
        subtitle="Your identity in the Psycheverse"
        backgroundImage="/wiki-page-header.jpg"
      label="identity"
      />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {subscribed ? (
          <ProfileForm
            displayName={codexUser.displayName}
            email={codexUser.email ?? ""}
            avatarUrl={codexUser.avatarUrl}
            memberTitle={codexUser.memberTitle}
            isPublicMember={codexUser.isPublicMember}
            memberSince={codexUser.createdAt.toISOString()}
            isAdmin={codexUser.role === "admin"}
            isSystemTier={systemTier}
            bio={codexUser.bio}
            codexSlug={codexUser.codexSlug}
            codexPagePublic={codexUser.codexPagePublic}
            codexBanner={codexUser.codexBanner}
            codexLinks={(codexUser.codexLinks as { label: string; url: string }[] | null)}
            codexShowCards={codexUser.codexShowCards}
          />
        ) : (
          <div className="rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent-gold/30 bg-accent-gold/10 text-2xl">
              🔐
            </div>
            <h3 className="font-display text-xl font-bold text-accent-gold">
              Premium Members Only
            </h3>
            <p className="mt-2 font-mono text-xs leading-relaxed text-text-muted">
              Custom flair titles, the public Member Roll, and your official
              cult identity are exclusive to premium members.
            </p>
            <div className="mt-5">
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/20"
              >
                Unlock Premium — $10/month
              </Link>
            </div>
            <p className="mt-3 font-mono text-[10px] text-text-muted/60">
              Cancel anytime. Instant access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
