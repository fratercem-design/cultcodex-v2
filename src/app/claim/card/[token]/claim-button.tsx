"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClaimButton({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "claiming" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function claim() {
    setState("claiming");
    try {
      const res = await fetch("/api/claim/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong.");
        setState("error");
        return;
      }
      setState("done");
      setTimeout(() => router.push("/cards/vault"), 1800);
    } catch {
      setError("Something went wrong.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="font-mono text-xs uppercase tracking-[0.4em] text-accent-gold-text py-5">
        The card is yours. Entering the vault…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={claim}
        disabled={state === "claiming"}
        className="block w-full py-5 font-mono text-xs uppercase tracking-[0.5em] transition-all text-center text-accent-gold-text/80 hover:text-accent-gold-text disabled:opacity-50"
        style={{
          border: "1px solid rgba(200,169,107,0.3)",
          background: "rgba(200,169,107,0.05)",
          borderRadius: 4,
        }}
      >
        {state === "claiming" ? "Claiming…" : "Claim This Card"}
      </button>
      {state === "error" && (
        <p className="font-mono text-[10px] text-red-400/70 uppercase tracking-[0.3em]">{error}</p>
      )}
    </div>
  );
}
