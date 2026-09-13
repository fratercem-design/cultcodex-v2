"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionLite } from "@/lib/session-lite";

/**
 * Sends a signed-in user who has not finished onboarding to /onboarding.
 *
 * This used to be a server-side `redirect()` in the homepage, which required
 * reading the session cookie during render. One cookie read opts the entire
 * route out of static rendering, so the homepage HTML shipped as
 * `Cache-Control: private, no-store` and every visitor - including crawlers and
 * the 99% who are signed out - paid for a personalised render they did not use.
 *
 * Moving the check here costs one already-shared session fetch and only
 * affects the small set of users it applies to. Signed-out visitors and bots
 * never navigate.
 */
export function OnboardingGate() {
  const router = useRouter();
  const { user, loaded } = useSessionLite();

  useEffect(() => {
    if (loaded && user && user.onboardingCompleted === false) {
      router.replace("/onboarding");
    }
  }, [loaded, user, router]);

  return null;
}
