import { NextResponse } from "next/server";
import { AdminAccessError } from "@/lib/auth";

/**
 * Response for an admin API route whose requireAdmin() threw. A database blip
 * or an expired sign-in used to come back as "Admin access required", which
 * told a real admin they weren't one.
 */
export function adminDeniedResponse(err: unknown): NextResponse {
  if (err instanceof AdminAccessError && err.reason === "account-unavailable") {
    return NextResponse.json(
      { error: "Couldn't check your account (database busy). Try again in a moment." },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }
  if (err instanceof AdminAccessError && err.reason === "signed-out") {
    return NextResponse.json(
      { error: "Your sign-in has expired. Reload the page and sign in again." },
      { status: 401 },
    );
  }
  return NextResponse.json({ error: "Admin access required" }, { status: 403 });
}
