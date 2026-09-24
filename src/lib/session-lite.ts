"use client";

import { useEffect, useState } from "react";

export type SessionLiteUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  onboardingCompleted: boolean;
} | null;

/**
 * Shared client-side session read.
 *
 * Every consumer awaits the SAME in-flight promise, so a page with a dozen
 * auth-aware widgets still makes exactly one /api/auth/session-lite request.
 * That matters: the point of moving the session read off the server is to let
 * the HTML be edge-cached, and that win evaporates if each widget opens its
 * own connection instead.
 *
 * The cache is module scoped, so it is per tab and per page load. It is
 * deliberately not invalidated on sign-in/sign-out - both do a full
 * navigation, which reloads the module.
 */
let inflight: Promise<SessionLiteUser> | null = null;

export function fetchSessionLite(): Promise<SessionLiteUser> {
  if (!inflight) {
    inflight = fetch("/api/auth/session-lite")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: SessionLiteUser }) => d.user ?? null)
      .catch(() => null);
  }
  return inflight;
}

/**
 * `loaded` is separate from `user` so callers can tell "signed out" apart from
 * "we do not know yet" - rendering a signed-out affordance during the unknown
 * window is what produces auth flicker.
 */
export function useSessionLite(): { user: SessionLiteUser; loaded: boolean } {
  const [user, setUser] = useState<SessionLiteUser>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSessionLite().then((u) => {
      if (active) {
        setUser(u);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { user, loaded };
}
