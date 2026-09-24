import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOSTS: Record<string, string> = {
  "www.cultcodex.me": "cultcodex.me",
  "cultcodex.xyz": "cultcodex.me",
  "www.cultcodex.xyz": "cultcodex.me",
};

export function proxy(request: NextRequest) {
  const canonicalHost = CANONICAL_HOSTS[request.nextUrl.hostname.toLowerCase()];
  if (!canonicalHost) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.hostname = canonicalHost;
  url.port = "";
  return NextResponse.redirect(url, { status: 308 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.[^/]+$).*)",
  ],
};
