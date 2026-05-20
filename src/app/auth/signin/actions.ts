"use server";

import { signIn } from "@/lib/auth";

export async function signInWithGoogle(callbackUrl?: string) {
  await signIn("google", { redirectTo: callbackUrl ?? "/" });
}
