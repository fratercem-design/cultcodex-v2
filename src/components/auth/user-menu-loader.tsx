"use client";

import { useEffect, useState } from "react";
import { UserMenu } from "./user-menu";

type LoadedUser = { id: string; displayName: string; avatarUrl: string | null; role: string } | null;

/**
 * Client-side loader for the user menu.
 *
 * Fetches the session from /api/auth/session-lite after mount instead of
 * reading the cookie during server render. This keeps the app shell (and
 * every public content page beneath it) statically renderable and
 * edge-cacheable — the session read is isolated to one tiny API call.
 */
export function UserMenuLoader() {
  const [user, setUser] = useState<LoadedUser>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session-lite")
      .then((r) => r.json())
      .then((d: { user: LoadedUser }) => {
        if (active) {
          setUser(d.user ?? null);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Reserve space pre-load to avoid layout shift in the topbar.
  if (!loaded) return <div style={{ width: 92, height: 30 }} aria-hidden="true" />;
  return <UserMenu user={user} />;
}
