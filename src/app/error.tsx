"use client";

import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // This boundary catches far more than global-error.tsx does, and until now it
  // reported nothing at all — errors here were invisible.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl">⚠️</span>
      <h1 className="mt-4 font-display text-2xl font-bold text-accent-gold">
        Something Went Wrong
      </h1>
      <p className="mt-2 font-mono text-sm text-text-muted">
        This page couldn&apos;t load. If the archive is briefly unavailable, trying again
        in a minute usually works.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-[12px] text-text-muted">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-accent-gold bg-accent-gold/10 px-4 py-2 font-mono text-xs text-accent-gold-text transition-colors hover:bg-accent-gold/20"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-muted transition-colors hover:border-accent-gold/30 hover:text-text-primary"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
