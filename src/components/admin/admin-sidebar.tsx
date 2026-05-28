"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "\uD83D\uDCCA" },
  { href: "/admin/analytics", label: "Analytics", icon: "\uD83D\uDCCA" },
  { href: "/admin/episodes", label: "Episodes", icon: "\uD83C\uDFAC" },
  { href: "/admin/people", label: "People", icon: "\uD83D\uDC64" },
  { href: "/admin/lore", label: "Lore", icon: "\uD83D\uDCDC" },
  { href: "/admin/topics", label: "Topics", icon: "\uD83C\uDFF7\uFE0F" },
  { href: "/admin/series", label: "Series", icon: "\uD83D\uDCDA" },
  { href: "/admin/comments", label: "Comments", icon: "\uD83D\uDCAC" },
  { href: "/admin/live", label: "Live Stream", icon: "\uD83D\uDD34" },
  { href: "/admin/psychenomicon", label: "Psychenomicon", icon: "\u03C8" },
  { href: "/admin/users", label: "Users", icon: "\uD83D\uDC65" },
  { href: "/admin/signals", label: "Signals", icon: "\u25C8" },
  { href: "/admin/sync", label: "Sync & Ingest", icon: "\u21BB" },
];

interface AdminSidebarProps {
  userName?: string | null;
  userAvatar?: string | null;
}

export function AdminSidebar({ userName, userAvatar }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-surface">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <h1 className="font-display text-sm font-bold text-accent-gold">
          CULT CODEX
        </h1>
        <p className="font-mono text-[10px] text-text-muted">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded px-3 py-2 font-mono text-xs transition-colors ${
              isActive(item.href)
                ? "bg-accent-gold/10 text-accent-gold"
                : "text-text-muted hover:bg-elevated hover:text-text-primary"
            }`}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName ?? ""}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple/20 font-mono text-[10px] text-accent-purple">
              {userName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="font-mono text-xs text-text-primary truncate">
            {userName ?? "Admin"}
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors"
        >
          ← Back to Site
        </Link>
      </div>
    </aside>
  );
}
