import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getArchiveStats } from "@/lib/queries/stats";
import { SubscriptionCTA } from "@/components/subscription/subscription-cta";
import { ManageSubscription } from "@/components/subscription/manage-subscription";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscribe — CultCodex",
  description: "Unlock full searchable transcript access for every Cult of Psyche episode.",
};

export default async function SubscribePage() {
  const user = await getCurrentUser();
  const subStatus = user ? await getSubscriptionStatus(user.id) : null;
  const stats = await getArchiveStats();

  const isActive =
    subStatus?.isAdmin || subStatus?.status === "active";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-center font-display text-3xl font-bold text-accent-gold">
        CultCodex Membership
      </h1>
      <p className="mt-2 text-center font-mono text-sm text-text-muted">
        Full searchable transcript access for every episode
      </p>

      {/* Already subscribed */}
      {isActive && subStatus && (
        <div className="mt-8">
          <ManageSubscription
            status={subStatus.status}
            periodEnd={subStatus.periodEnd}
            isAdmin={subStatus.isAdmin}
          />
          <p className="mt-4 text-center font-mono text-xs text-accent-gold">
            You have full transcript access.{" "}
            <Link href="/episodes" className="underline hover:text-accent-gold/80">
              Browse episodes
            </Link>
          </p>
        </div>
      )}

      {/* Not subscribed */}
      {!isActive && (
        <>
          <div className="mt-8">
            <SubscriptionCTA />
          </div>

          {/* Features */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <SectionCard title="What you get">
              <ul className="space-y-2 font-mono text-xs text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-accent-gold">&#10003;</span>
                  Full searchable transcripts for {stats.episodes}+ episodes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-gold">&#10003;</span>
                  Keyword search across all segments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-gold">&#10003;</span>
                  Click-to-seek timestamps synced to video
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-gold">&#10003;</span>
                  Copy any segment with one click
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-gold">&#10003;</span>
                  Speaker-labeled dialogue view
                </li>
              </ul>
            </SectionCard>

            <SectionCard title="Archive stats">
              <ul className="space-y-2 font-mono text-xs text-text-muted">
                <li>{stats.episodes.toLocaleString()} episodes archived</li>
                <li>{stats.quotes.toLocaleString()} quotes extracted</li>
                <li>{stats.people.toLocaleString()} people catalogued</li>
                <li>{stats.topics.toLocaleString()} topics indexed</li>
                <li>{stats.loreEntries.toLocaleString()} lore entries documented</li>
              </ul>
            </SectionCard>
          </div>
        </>
      )}
    </main>
  );
}
