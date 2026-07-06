import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

const { version } = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")) as { version: string };

// Pin Turbopack's workspace root to this project. Stray package-lock.json
// files in parent dirs (C:\Users\John Bates\ and C:\Users\John Bates\Projects\)
// were causing Next to infer the wrong root and then fail to resolve
// tailwindcss from there, which cascaded into Turbopack compile errors.
// `process.cwd()` works because `next dev`is always launched from the
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
      source: "/(about|faq)",
      headers: [
        { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800, max-age=0, must-revalidate" },
      ],
    },
    {
      source: "/(people|episodes)",
      headers: [
        { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800, max-age=0, must-revalidate" },
      ],
    },
    {
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.youtube.com https://s.ytimg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
            "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
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
    {
      source: "/:path*.(jpg|jpeg|png|webp|avif|gif|svg|ico)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
  redirects: async () => [
    { source: "/pricing", destination: "/premium", permanent: true },
  ],
};

export default nextConfig;
