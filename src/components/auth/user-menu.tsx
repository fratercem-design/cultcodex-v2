"use client";

import { useState } from "react";
import Link from "next/link";

interface UserMenuProps {
  user: {
    displayName: string;
    avatarUrl: string | null;
    role: string;
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  if (!user) {
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
