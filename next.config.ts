import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

const { version } = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")) as { version: string };

// Pin Turbopack's workspace root to this project. Stray package-lock.json
// files in parent dirs (C:\Users\John Bates\ and C:\Users\John Bates\Projects\)
// were causing Next to infer the wrong root and then fail to resolve
// tailwindcss from there, which cascaded into Turbopack compile errors.
// `process.cwd()` works because `next dev` is always launched from the
// project root; matches the launch.json cwd setup.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        // Enforce HTTPS for 2 years; include subdomains; eligible for browser preload lists.
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        // Prevents cross-origin docs sharing a browsing context group (Spectre mitigation).
        // same-origin-allow-popups is used (vs same-origin) so Google OAuth redirect still works.
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        // Cross-origin images/fonts are loaded by design (Google Fonts, YouTube thumbs),
        // so cross-origin is correct here.
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            // Default: only same-origin resources.
            "default-src 'self'",
            // Scripts: self + inline (required for Next.js hydration and JSON-LD) + Vercel Analytics + YouTube IFrame API.
            // TODO: replace 'unsafe-inline' with per-request nonces once Next.js middleware is wired.
            "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://www.youtube.com https://s.ytimg.com",
            // Styles: self + inline (Tailwind) + Google Fonts CSS.
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            // Fonts: self + Google Fonts files.
            "font-src 'self' https://fonts.gstatic.com",
            // Images: self + inline data URIs + blob + any HTTPS (YouTube thumbnails, Google avatars, imgur).
            "img-src 'self' data: blob: https:",
            // Frames: YouTube + Cult of Psyche Arcanum Oracle.
            "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://tarot-oracle-production.up.railway.app",
            // Fetch/XHR: self + Vercel Analytics beacon + Speed Insights beacon.
            "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
            // No plugins (Flash, etc.).
            "object-src 'none'",
            // Prevent base-tag hijacking.
            "base-uri 'self'",
            // Allow forms to submit to self or Stripe Checkout.
            "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
            // Prevent this site from being embedded in foreign iframes.
            "frame-ancestors 'self'",
          ].join("; "),
        },
      ],
    },
    {
      source: "/:path*.woff2",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/:path*.woff",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    // Public images (logo, favicon, thumbnails served directly from /public)
    {
      source: "/:path*.(jpg|jpeg|png|webp|avif|gif|svg|ico)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
      ],
    },
    // Service worker — must never be cached so updates propagate immediately
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;
