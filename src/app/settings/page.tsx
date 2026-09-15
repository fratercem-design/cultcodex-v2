export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { ManageSubscription } from "@/components/subscription/manage-subscription";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings — CultCodex",
  description: "Manage your CultCodex profile, notification preferences and subscription.",
};

// Index for /settings. The site footer, /contact and /refund have always linked
// here — /refund specifically promises members they can cancel from "account
// settings" — but only the /settings/* children existed, so the bare path 404'd
// on every page of the site. This hub links the children and surfaces the
// existing Stripe portal control so that promise is actually honoured.

const LINKS = [
  {
    href: "/settings/profile",
    label: "Member Profile",
    description: "Display name, member title, bio, and your public codex page.",
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    description: "Email and push alerts for new episodes and live streams.",
  },
] as const;

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const subscription = await getSubscriptionStatus(user.id).catch(() => null);
  const allowAdminPortalTest =
    process.env.FLY_APP_NAME?.endsWith("-staging") === true &&
    subscription?.isAdmin === true &&
    subscription.hasStripeCustomer;

  return (
    <div>
      <PageHero
        title="ACCOUNT SETTINGS"
        subtitle="Profile, notifications and subscription"
        backgroundImage="/wiki-page-header.jpg"
        label="settings"
      />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <SectionCard title="Your Account">
          <ul className="space-y-2 py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg border border-accent-gold/20 bg-surface px-4 py-3 transition-colors hover:border-accent-gold/50"
                >
                  <span className="font-mono text-xs font-bold text-accent-gold-text">
                    {link.label}
                  </span>
                  <p className="mt-1 font-mono text-[10px] text-text-muted">
                    {link.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Subscription" accent="cyan">
          <div className="py-2">
            {subscription ? (
              <ManageSubscription
                status={subscription.isAdmin ? null : subscription.status}
                periodEnd={subscription.periodEnd?.toISOString() ?? null}
                isAdmin={subscription.isAdmin}
                allowAdminPortalTest={allowAdminPortalTest}
              />
            ) : (
              <p className="font-mono text-[10px] text-text-muted">
                Subscription details are unavailable right now. Please try again shortly.
              </p>
            )}
            {subscription && !subscription.isAdmin && subscription.status !== "active" && (
              <p className="mt-3 font-mono text-[10px] text-text-muted">
                No active subscription.{" "}
                <Link href="/premium" className="text-accent-gold-text hover:underline">
                  See membership tiers
                </Link>
                .
              </p>
            )}
          </div>
        </SectionCard>

        <p className="text-center font-mono text-[10px] text-text-muted">
          Need help?{" "}
          <Link href="/contact" className="text-accent-gold-text hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
