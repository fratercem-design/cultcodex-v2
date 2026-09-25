import type { Metadata } from "next";
import { Suspense } from "react";
import { spaceGrotesk, jetbrainsMono } from "@/fonts";
import { LiveBanner } from "@/components/layout/live-banner";
import { ScrollReset } from "@/components/layout/scroll-reset";
import { EntryBanner } from "@/components/layout/entry-banner";
import { TerminalTopBar } from "@/components/layout/terminal-topbar";
import { TerminalSidebar } from "@/components/layout/terminal-sidebar";
import { TerminalStatusBar } from "@/components/layout/terminal-statusbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { RadialDialNav } from "@/components/layout/radial-dial-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { ConsoleSigil } from "@/components/layout/console-sigil";
import { getCountsOrNull, fmtEpisodeCount } from "@/lib/queries/stats";
import { getLiveChannels } from "@/lib/queries/live-status";
import { ClientOverlays } from "@/components/layout/client-overlays";
import { SkipLink } from "@/components/ui/skip-link";
import { SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CookieConsent } from "@/components/layout/cookie-consent";
import "./globals.css";

// Layout data fetches never throw: getCountsOrNull() returns null (shown as
// "unavailable", never as 0) and getLiveChannels is wrapped in .catch() and the user menu loads client-side — no server-side session reads.
// revalidate=60 enables Next.js server-side ISR caching for the layout shell.

const SITE_DESCRIPTION =
  "The complete archive of the Cult of Psyche: nearly 3,000 transmissions, searchable transcripts, lore entries, guest profiles, relationship maps, and AI-powered exploration of every word ever spoken in the stream.";

// SITE_URL comes from @/lib/seo — single source of truth with a localhost guard,
// so a stray dev value in NEXT_PUBLIC_SITE_URL can never become metadataBase.

// The shell no longer reads the session cookie during server render (the
// user menu loads client-side), so the layout can be cached. Pages that
// read cookies/headers still opt into dynamic rendering on their own.
export const revalidate = 60;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CultCodex — The Living Archive",
  description: SITE_DESCRIPTION,
  // NOTE: no global `alternates.canonical` here. Setting it at the root made
  // every page inherit the homepage URL as its canonical, so Google treated
  // all routes as duplicates of `/`. Each page declares its own canonical.
  // NOTE: no global `robots` here either. "index, follow" is already what a
  // crawler assumes when no robots meta is present, so declaring it bought
  // nothing — and it collided with the `noindex` Next emits automatically on a
  // 404, leaving not-found pages carrying both directives at once. Google
  // resolves such a conflict by taking the most restrictive, so the outcome
  // happened to be right, but it was luck rather than intent. Pages that need
  // to be excluded set `robots` themselves.
  verification: { google: "QfWzbm45sKbw9uEbINbuPaWLQEbVsVpP3J8umJYCUAo" },
  other: { "build-commit": process.env.SOURCE_COMMIT ?? "dev" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.jpg" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.jpg",
  },
  openGraph: {
    title: "CultCodex — The Living Archive",
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/site/og.jpg", width: 1200, height: 630 }],
    siteName: "CultCodex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CultCodex — The Living Archive",
    description: SITE_DESCRIPTION,
    images: ["/images/site/og.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [counts, liveChannels] = await Promise.all([
    getCountsOrNull(),
    getLiveChannels().catch(() => ({ cultOfPsyche: false, psychesNightmares: false, nightmareFrequencies: false })),
  ]);

  const fontVariables = [
    spaceGrotesk.variable,
    jetbrainsMono.variable,
  ].join(" ");

  return (
    <html lang="en" className="dark">
      <head>
        {/* Apply persisted appearance prefs (ambient visuals / high contrast)
            before first paint to avoid a flash. Mirrors @/lib/appearance. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var r=document.documentElement;" +
              "if(localStorage.getItem('cc-ambient')==='off')r.classList.add('ambient-off');" +
              "if(localStorage.getItem('cc-contrast')==='high')r.classList.add('high-contrast');" +
              "}catch(e){}})();",
          }}
        />
        {/* Episode thumbnails and channel avatars load from YouTube CDNs on
            most archive pages — preconnect cuts their connection setup cost. */}
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://yt3.ggpht.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* RSS autodiscovery. Deliberately rendered here rather than via
            `metadata.alternates.types`: Next.js replaces the whole `alternates`
            object per route, so every page declaring its own canonical (all of
            `buildMetadata`, plus ~69 pages inline) silently dropped it. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="CultCodex — Latest Episodes"
          href={`${SITE_URL}/feed.xml`}
        />
              </head>
      <body
        className={`${fontVariables} font-mono antialiased bg-void text-text-primary`}
        style={{ backgroundColor: "var(--term-bg)" }}
      >
        <SkipLink />
        <Suspense fallback={null}>
          <ScrollReset />
        </Suspense>
        <LiveBanner />
        <EntryBanner episodeCount={fmtEpisodeCount(counts?.episodes ?? 0)} />
        <div className="terminal-grid">
          <TerminalTopBar />
          <TerminalSidebar counts={counts} liveChannels={liveChannels} />
          <div
            id="terminal-scroll"
            tabIndex={-1}
            className="terminal-main outline-none"
            style={{ backgroundColor: "var(--term-bg)" }}
          >
            {children}
            <SiteFooter />
          </div>
          <TerminalStatusBar feedCount={counts?.episodes ?? null} />
        </div>
        <MobileBottomNav />
        <RadialDialNav />
        <ConsoleSigil />
        <ClientOverlays />
        {/* WebSite + SearchAction JSON-LD — enables sitelinks search box in Google */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CultCodex",
            url: SITE_URL,
            description: SITE_DESCRIPTION,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <CookieConsent gaId="G-1ML217JXYV" />
      </body>
    </html>
  );
}
