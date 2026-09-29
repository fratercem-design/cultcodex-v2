"use client";

import { useState } from "react";
import Link from "next/link";

export function WellClaim() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "again" | "signin" | "error">("idle");
  const [granted, setGranted] = useState(0);

  async function drop() {
    setState("busy");
    const res = await fetch("/api/secrets/well", { method: "POST" }).catch(() => null);
    if (res?.status === 401) return setState("signin");
    const json = res?.ok ? ((await res.json()) as { granted: number; alreadyClaimed: boolean }) : null;
    if (!json) return setState("error");
    setGranted(json.granted);
    setState(json.alreadyClaimed ? "again" : "done");
  }

  if (state === "done") return <p className="text-amber-200">You hear it land. {granted} Signal Credits are in your wallet.</p>;
  if (state === "again") return <p>You drop another coin. This time you don&apos;t hear anything at all.</p>;
  if (state === "signin") {
    return (
      <p>
        You have no coins on you. <Link href="/auth/signin?callbackUrl=/stairwell/echo/lantern/moth" className="text-amber-300 underline">Sign in</Link> and come back down.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={drop}
        disabled={state === "busy"}
        className="rounded border border-amber-300/40 px-5 py-2 font-mono text-[12px] uppercase tracking-wider text-amber-300 hover:bg-amber-300/10 disabled:opacity-50"
      >
        {state === "busy" ? "Falling…" : "Drop a coin in"}
      </button>
      {state === "error" && <p className="text-red-300/80">The well is quiet. Try again.</p>}
    </div>
  );
}
