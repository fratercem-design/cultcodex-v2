import Link from "next/link";
import type { Metadata } from "next";
import { getStripe } from "@/lib/stripe";
import { KIT_PLANS } from "@/lib/kit/sample-kit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order received — Transmission Kit",
  robots: { index: false, follow: false },
};

/** Look up the Checkout Session so the page only says "paid" when Stripe agrees. */
async function getPaidPlanName(sessionId: string | undefined): Promise<string | null> {
  if (!sessionId?.startsWith("cs_")) return null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.kind !== "kit" || session.status !== "complete") return null;
    return KIT_PLANS.find((p) => p.id === session.metadata?.kitPlan)?.name ?? null;
  } catch {
    return null;
  }
}

export default async function KitThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const planName = await getPaidPlanName(session_id);

  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      {planName ? (
        <>
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan">{"/// order_received"}</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-accent-gold">You&rsquo;re in. Your kit is on the way.</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Payment for <strong className="text-text-primary">{planName}</strong> went through. Stripe is emailing your
            receipt now. Your kit arrives by email within 48 hours.
          </p>
          <ol className="mt-6 w-full space-y-2 text-left text-sm text-text-primary">
            <li>1. We pull the transcript and chat from your replay.</li>
            <li>2. A human checks every timestamp and picks the clips.</li>
            <li>3. You get chapters, clips, a description and Shorts hooks to paste in.</li>
          </ol>
          <p className="mt-6 text-sm text-text-muted">
            Wrong link, or want to add a note? Reply to your receipt or email{" "}
            <a href="mailto:psychetarotchannel@gmail.com" className="text-accent-cyan underline underline-offset-2">
              psychetarotchannel@gmail.com
            </a>
            .
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-accent-gold">We couldn&rsquo;t confirm that order</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            If you paid, your Stripe receipt is on its way and your kit is still coming. If you closed checkout early,
            you haven&rsquo;t been charged.
          </p>
          <Link href="/kit#pricing" className="mt-6 font-mono text-xs text-accent-gold-text hover:underline">
            Back to plans →
          </Link>
        </>
      )}
    </main>
  );
}
