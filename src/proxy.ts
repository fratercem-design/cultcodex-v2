import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildReportOnlyCsp, generateNonce } from "@/lib/csp";

const CANONICAL_HOSTS: Record<string, string> = {
  "www.cultcodex.me": "cultcodex.me",
  "cultcodex.xyz": "cultcodex.me",
  "www.cultcodex.xyz": "cultcodex.me",
};

// Auth.js session cookie names (the __Secure- variant is used over HTTPS;
// large sessions are chunked as `.0`, `.1`, ...).
const SESSION_COOKIE_PREFIXES = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => SESSION_COOKIE_PREFIXES.some((p) => c.name === p || c.name.startsWith(`${p}.`)));
}

// The host the visitor asked for. The standalone server (the Dockerfile sets
// HOSTNAME=0.0.0.0) can report its bind address in nextUrl.hostname, which
// would stop the www redirect below from ever matching, so prefer the
// forwarded / Host headers.
function requestedHostname(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.hostname;
  return raw.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
}

export function proxy(request: NextRequest) {
  const canonicalHost = CANONICAL_HOSTS[requestedHostname(request)];
  if (!canonicalHost) {
    // Second layer for /admin: send visitors with no session at all to sign
    // in before any admin page renders. This does not check the role (that
    // needs the DB); requireAdminPage() in each page remains the real gate.
    const path = request.nextUrl.pathname;
    if ((path === "/admin" || path.startsWith("/admin/")) && !hasSessionCookie(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.search = "";
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url, { status: 307 });
    }

    // Report-only for now (see src/lib/csp.ts). Next reads the nonce from the
    // request's CSP header, so pages rendered per request get it on their
    // scripts; prerendered pages cannot, and will show up in the reports.
    const csp = buildReportOnlyCsp(generateNonce());
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("Content-Security-Policy-Report-Only", csp);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy-Report-Only", csp);
    return response;
  }

  const url = request.nextUrl.clone();
  url.hostname = canonicalHost;
  url.port = "";
  url.protocol = "https:";
  return NextResponse.redirect(url, { status: 308 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.[^/]+$).*)",
  ],
};
