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
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()",
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
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
