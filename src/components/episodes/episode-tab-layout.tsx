"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
  locked?: boolean;
}

interface EpisodeTabLayoutProps {
  tabs: Tab[];
  children: Record<string, ReactNode>;
  /**
   * Tab ids whose panels stay in the DOM (with `hidden`) while another tab is
   * active. Used for the transcript so its full text is server-rendered on the
   * canonical episode URL — crawlers never click tabs, and `?tab=transcript`
   * canonicalizes back to the base URL, so anything rendered only on demand is
   * invisible to search.
   */
  prerender?: string[];
}

export function EpisodeTabLayout({ tabs, children, prerender = [] }: EpisodeTabLayoutProps) {
  const defaultTab = tabs[0]?.id ?? "overview";
  // The page is cached (ISR), so the server always renders the default tab;
  // ?tab= / ?t= are read from the URL after mount. useSearchParams would make
  // this whole subtree client-only and drop the transcript from the HTML.
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      // A shared moment link (?t=) lands on the transcript, where that line is.
      const momentTab = params.has("t") && tabs.some((t) => t.id === "transcript") ? "transcript" : undefined;
      setActiveTab(params.get("tab") ?? momentTab ?? defaultTab);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [tabs, defaultTab]);

  const setTab = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(window.location.search);
      if (tabId === defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", tabId);
      }
      if (tabId !== "transcript") {
        params.delete("t");
      }
      const qs = params.toString();
      window.history.pushState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
      setActiveTab(tabId);
    },
    [defaultTab]
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
                ? "border-accent-gold text-accent-gold-text"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
            }`}
          >
            {tab.label}
            {tab.locked && <span className="ml-1 text-[12px] opacity-50">🔒</span>}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 text-[12px] opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>
      <div>{children[activeTab] ?? children[tabs[0]?.id]}</div>
      {prerender
        .filter((id) => id !== activeTab && children[id] != null)
        .map((id) => (
          <div key={id} hidden>
            {children[id]}
          </div>
        ))}
    </div>
  );
}
