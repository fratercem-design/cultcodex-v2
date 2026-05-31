"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { SessionWithCodex } from "@/lib/auth";

export function OnboardingCheck() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const s = session as SessionWithCodex | null;
    if (s?.codexUser?.onboardingCompleted === false) {
      router.replace("/onboarding");
    }
  }, [session, router]);

  return null;
}
