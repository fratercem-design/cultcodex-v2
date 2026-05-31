"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { CodexSessionUser } from "@/lib/auth";

type SessionState = "loading" | "guest" | "user";

export function UserMenu() {
  const [status, setStatus] = useState<SessionState>("loading");
  const [user, setUser] = useState<CodexSessionUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me/session")
      .then((r) => r.json())
      .then((data: { user: CodexSessionUser | null }) => {
        setUser(data.user);
        setStatus(data.user ? "user" : "guest");
      })
      .catch(() => setStatus("guest"));
  }, []);

  if (status === "loading") {
    return (
      <div className="h-[30px] w-20 animate-pulse rounded-lg bg-surface border border-border" />
    );
  }

  if (status === "guest" || !user) {
    return (
      <Link
        href="/auth/signin"
        className="rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-3 py-1.5 font-mono text-xs text-accent-gold transition-colors hover:bg-accent-gold/20"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:border-accent-gold/30"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold/20 text-[10px] text-accent-gold">
            {user.displayName[0]?.toUpperCase()}
          </div>
        )}
        <span className="max-w-[100px] truncate">{user.displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-text-primary font-medium truncate">{user.displayName}</p>
            <p className="text-[10px] text-text-muted font-mono">{user.role.toUpperCase()}</p>
          </div>
          <Link
            href={`/user/${user.id}`}
            className="block w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-elevated transition-colors"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/codex"
            className="block w-full px-3 py-2 text-left text-xs font-bold text-accent-gold hover:bg-elevated transition-colors"
            onClick={() => setOpen(false)}
          >
            ✦ Your Codex
          </Link>
          <Link
            href="/settings/profile"
            className="block w-full px-3 py-2 text-left text-xs text-accent-gold hover:bg-elevated transition-colors"
            onClick={() => setOpen(false)}
          >
            ✦ Member Profile
          </Link>
          <Link
            href="/members"
            className="block w-full px-3 py-2 text-left text-xs text-text-muted hover:bg-elevated transition-colors"
            onClick={() => setOpen(false)}
          >
            Member Roll
          </Link>
          <Link
            href="/settings/notifications"
            className="block w-full px-3 py-2 text-left text-xs text-text-primary hover:bg-elevated transition-colors"
            onClick={() => setOpen(false)}
          >
            Notifications
          </Link>
          <div className="border-t border-border my-1" />
          <Link
            href="/premium"
            className="block w-full px-3 py-2 text-left text-xs font-bold text-accent-gold hover:bg-elevated transition-colors"
            onClick={() => setOpen(false)}
          >
            ✦ Premium
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-3 py-2 text-left text-xs text-accent-crimson hover:bg-elevated transition-colors"
              onClick={() => setOpen(false)}
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
