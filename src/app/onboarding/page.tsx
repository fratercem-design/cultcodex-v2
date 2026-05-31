import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./onboarding-wizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Initiation — CultCodex",
  alternates: { canonical: "/onboarding" },
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/onboarding");

  const dbUser = await prisma.codexUser.findUnique({
    where: { id: user.id },
    select: { onboardingCompleted: true, displayName: true },
  });

  if (dbUser?.onboardingCompleted) redirect("/");

  return <OnboardingWizard displayName={dbUser?.displayName ?? user.displayName} />;
}
