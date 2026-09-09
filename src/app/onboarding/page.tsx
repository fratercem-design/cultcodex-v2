export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OnboardingWizard } from "./onboarding-wizard";
import { EmailGate } from "./email-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Initiation — CultCodex",
  alternates: { canonical: "/onboarding" },
};

/** Shown under both states — the procedure is the promise we make about all of this. */
function ProcedureLink() {
  return (
    <div className="mx-auto mt-8 max-w-lg rounded border border-border bg-surface/60 p-4 text-center">
      <p className="font-mono text-[11px] leading-relaxed text-text-muted">
        Every step of initiation — and every red line we hold ourselves to — is written down and
        public.
      </p>
      <Link
        href="/onboarding/procedure"
        className="mt-2 inline-block font-mono text-xs text-accent-cyan underline underline-offset-4 hover:text-accent-gold-text"
      >
        Read The First Gate Procedure →
      </Link>
    </div>
  );
}

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  // Not signed in: the address comes first. This captures the lead and
  // provisions the account, rather than bouncing to Google and losing them.
  if (!user) {
    return (
      <div className="min-h-screen bg-void px-4 py-12">
        <EmailGate callbackUrl="/onboarding" />
        <ProcedureLink />
      </div>
    );
  }

  const dbUser = await prisma.codexUser.findUnique({
    where: { id: user.id },
    select: { onboardingCompleted: true, displayName: true },
  });

  if (dbUser?.onboardingCompleted) redirect("/");

  return (
    <>
      <OnboardingWizard displayName={dbUser?.displayName ?? user.displayName} />
      <div className="px-4 pb-10">
        <ProcedureLink />
      </div>
    </>
  );
}
