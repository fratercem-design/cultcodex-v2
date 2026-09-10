"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookBuyButton } from "@/components/book/book-buy-button";

type Ownership = { signedIn: boolean; owned: boolean; isAdmin: boolean };

/**
 * Per-user CTA for the book page. The page itself is static/ISR-cached; this
 * component resolves ownership client-side via /api/psychenomicon/book/ownership
 * so a cached HTML shell can serve everyone instantly. Non-owners (the common
 * case) see the buy button immediately; owners get the download link once resolved.
 */
export function BookCta({ sku, price }: { sku: string; price: number }) {
  const [state, setState] = useState<Ownership | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/psychenomicon/book/ownership?sku=${encodeURIComponent(sku)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Ownership | null) => alive && setState(d ?? { signedIn: false, owned: false, isAdmin: false }))
      .catch(() => alive && setState({ signedIn: false, owned: false, isAdmin: false }));
    return () => {
      alive = false;
    };
  }, [sku]);

  if (state && (state.owned || state.isAdmin)) {
    return (
      <div className="space-y-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet-text/70">
          {"/// psychenomicon · the_book"}
        </p>
        <Link
          href={`/api/psychenomicon/book/${sku}`}
          className="inline-block w-full rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-sm font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25"
        >
          Download the PDF →
        </Link>
      </div>
    );
  }

  // Loading + non-owner: show the buy button (correct for the common visitor).
  return <BookBuyButton sku={sku} signedIn={state?.signedIn ?? false} price={price} />;
}
