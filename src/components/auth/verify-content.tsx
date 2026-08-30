"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "verifying" | "success" | "error";

export function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    // Validate callbackUrl to prevent open-redirect attacks. Only allow
    // same-origin relative paths (must start with "/" but not "//").
    const rawCallback = searchParams.get("callbackUrl");
    const callbackUrl =
      rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
        ? rawCallback
        : "/";

    if (!token || !email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- React 18 batches synchronous setState; no cascade
      setErrorMsg("This sign-in link is incomplete or malformed.");
      setStatus("error");
      return;
    }

    signIn("magic-link", { token, email, redirect: false }).then((result) => {
      if (result?.ok && !result.error) {
        setStatus("success");
        router.replace(callbackUrl);
      } else {
        setErrorMsg(
          result?.error === "CredentialsSignin"
            ? "This link has expired or has already been used. Please request a new one."
            : "Sign-in failed. Please try again.",
        );
        setStatus("error");
      }
    });
  }, [searchParams, router]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
        <p className="font-mono text-sm text-text-muted">Verifying your link…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/60">
          {"/// access_granted"}
        </p>
        <p className="font-display text-lg font-semibold text-text-primary">You&apos;re in</p>
        <p className="font-mono text-xs text-text-muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-400/60">
        {"/// link_invalid"}
      </p>
      <p className="font-display text-lg font-semibold text-text-primary">Link expired</p>
      <p className="font-mono text-xs text-text-muted max-w-xs">{errorMsg}</p>
      <Link
        href="/auth/signin"
        className="mt-2 inline-flex items-center gap-2 rounded border border-accent-gold/40 bg-accent-gold/10 px-5 py-2 font-mono text-xs font-bold text-accent-gold-text transition-colors hover:bg-accent-gold/20"
      >
        Request a new link →
      </Link>
    </div>
  );
}
