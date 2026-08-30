"use client";

import { useRouter } from "next/navigation";

interface Payload {
  query: string;
  concepts: string[];
  thresholds: number[];
  eraId: string | null;
  personSlug: string | null;
  archetype: string | null;
}

interface Props {
  id: string;
  kind: "simple" | "deep" | "oracle";
  payload: Payload;
}

export function SavedSearchRunButton({ id, kind, payload }: Props) {
  const router = useRouter();

  async function run() {
    // Best-effort markRun — don't block navigation if it fails
    fetch(`/api/me/saved-searches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markRun: true }),
    }).catch(() => {});

    if (kind === "deep") {
      const params = new URLSearchParams();
      payload.concepts.forEach((c) => params.append("concept", c));
      if (payload.eraId) params.set("era", payload.eraId);
      router.push(`/search/deep?${params.toString()}`);
      return;
    }
    if (kind === "oracle") {
      const params = new URLSearchParams({ q: payload.query });
      router.push(`/oracle?${params.toString()}`);
      return;
    }
    // simple
    const params = new URLSearchParams({ q: payload.query });
    if (payload.eraId) params.set("era", payload.eraId);
    router.push(`/episodes?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={run}
      className="shrink-0 rounded border border-accent-violet/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-accent-violet-text hover:bg-accent-violet/10 transition-colors"
    >
      Run →
    </button>
  );
}
