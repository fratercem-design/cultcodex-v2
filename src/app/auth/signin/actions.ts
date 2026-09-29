"use server";

import { signIn } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function signInWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: safeRedirectPath(callbackUrl) });
}
