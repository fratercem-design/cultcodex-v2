import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  if (host.startsWith("www.")) {
    const apex = host.slice(4); // strip "www."
    const url = request.nextUrl.clone();
    url.host = apex;
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - files with an extension (e.g. .js, .css, .png, .svg ...)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.[^/]+$).*)",
  ],
};
