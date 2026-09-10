import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/refund" },
  title: "Refund Policy — CULT CODEX",
  description: "How refunds and cancellations work for CultCodex subscriptions and the Psychenomicon book.",
};

export const revalidate = false;

export default function RefundPage() {
  return (
    <>
      <PageHero
        title="REFUND POLICY"
        subtitle="Cancellations and refunds"
        backgroundImage="/wiki-page-header.jpg"
        label="legal"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-4 py-3 font-mono text-[11px] text-text-muted">
          Last updated: June 2026. This policy applies to cultcodex.me and is part of our{" "}
          <Link href="/terms" className="text-accent-gold-text hover:underline">Terms of Service</Link>.
        </div>

        <SectionCard title="Subscriptions (Initiate+ &amp; Oracle)">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              Paid subscriptions are billed monthly through Stripe and renew automatically unless
              cancelled before the renewal date.
            </p>
            <p>
              You may cancel at any time from your{" "}
              <Link href="/settings" className="text-accent-gold-text hover:underline">account settings</Link>;
              access continues through the end of the current billing period, and you will not be
              charged again.
            </p>
            <p>
              Refunds are handled on a case-by-case basis. If you believe a charge was made in error,
              contact us through the{" "}
              <Link href="/contact" className="text-accent-gold-text hover:underline">contact page</Link>{" "}
              or the{" "}
              <Link href="/corrections" className="text-accent-gold-text hover:underline">corrections page</Link>{" "}
              and we will review it.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="The Psychenomicon (One-Time Book Purchase)">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              The Psychenomicon is a one-time purchase of a digital PDF. Because it is delivered
              immediately as a downloadable file, it is generally non-refundable once downloaded.
            </p>
            <p>
              If you were charged in error, did not receive your download, or the file is unusable,
              contact us through the{" "}
              <Link href="/contact" className="text-accent-gold-text hover:underline">contact page</Link>{" "}
              and we will make it right on a case-by-case basis.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="How to Request">
          <div className="space-y-3 text-sm text-text-muted leading-relaxed">
            <p>
              Email us or use the{" "}
              <Link href="/contact" className="text-accent-gold-text hover:underline">contact page</Link>{" "}
              with your account email and, if relevant, the approximate date and amount of the charge.
              We aim to respond to billing inquiries promptly.
            </p>
          </div>
        </SectionCard>

      </main>
    </>
  );
}
