"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface EpisodeTabLayoutProps {
  tabs: Tab[];
  children: Record<string, ReactNode>;
}

export function EpisodeTabLayout({ tabs, children }: EpisodeTabLayoutProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get("tab") ?? tabs[0]?.id ?? "overview";

  const setTab = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tabId === tabs[0]?.id) {
        params.delete("tab");
      } else {
        params.set("tab", tabId);
      }
      if (tabId !== "transcript") {
        params.delete("t");
      }
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname, tabs]
  );

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border mb-6 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`shrink-0 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-accent-green text-accent-green"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
      <div>{children[activeTab] ?? children[tabs[0]?.id]}</div>
    </div>
  );
}
