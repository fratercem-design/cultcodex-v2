import type { Metadata } from "next";
import {
  Space_Grotesk,
  Inter,
  IBM_Plex_Mono,
  Playfair_Display,
  JetBrains_Mono,
  VT323,
} from "next/font/google";
import { LiveBanner } from "@/components/layout/live-banner";
import { EntryBanner } from "@/components/layout/entry-banner";
import { TerminalTopBar } from "@/components/layout/terminal-topbar";
import { TerminalSidebar } from "@/components/layout/terminal-sidebar";
import { TerminalStatusBar } from "@/components/layout/terminal-statusbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { RadialDialNav } from "@/components/layout/radial-dial-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { ConsoleSigil } from "@/components/layout/console-sigil";
import { getCounts } from "@/lib/queries/stats";
import { getLiveChannels } from "@/lib/queries/live-status";
import { ClientOverlays } from "@/components/layout/client-overlays";
import { CRTOverlay } from "@/components/graphics/crt-overlay";
import { SkipLink } from "@/components/ui/skip-link";
import { SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Layout data fetches (getCounts, getLiveChannels) are already wrapped in
// .catch() and the user menu loads client-side — no server-side session reads.
// revalidate=60 enables Next.js server-side ISR caching for the layout shell.

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({preload: false,
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({preload: false,
  variable: "--font-mono-fallback",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({preload: false,
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "900"],
});

// JetBrains Mono — primary monospace for the neon-terminal aesthetic.
// Overrides --font-mono so all existing `font-mono` consumers pick it up
// without per-component changes.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// VT323 — CRT large-number font, exposed as --font-crt for opt-in use
// (large stat counters, retro headers). Single weight is all VT323 ships.
const vt323 = VT323({preload: false,
  variable: "--font-crt",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "The complete archive of the Cult of Psyche: 2,500+ transmissions, searchable transcripts, lore entries, guest profiles, relationship maps, and AI-powered exploration of every word ever spoken in the stream.";

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
  robots: { index: true, follow: true },
  verification: { google: "QfWzbm45sKbw9uEbINbuPaWLQEbVsVpP3J8umJYCUAo" },
  other: { "build-commit": process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" },
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
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "CultCodex — Latest Episodes" }],
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [counts, liveChannels] = await Promise.all([
    getCounts().catch(() => ({
      episodes: 0,
      segments: 0,
      people: 0,
      topics: 0,
      lore: 0,
      quotes: 0,
      totalHours: 0,
      transcribedEpisodes: 0,
      transcribedPct: 0,
    })),
    getLiveChannels().catch(() => ({ cultOfPsyche: false, psychesNightmares: false, nightmareFrequencies: false })),
  ]);

  const fontVariables = [
    spaceGrotesk.variable,
    inter.variable,
    ibmPlexMono.variable,
    playfairDisplay.variable,
    jetbrainsMono.variable,
    vt323.variable,
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
              </head>
      <body
        className={`${fontVariables} font-mono antialiased bg-void text-text-primary`}
        style={{ backgroundColor: "var(--term-bg)" }}
      >
        <SkipLink />
        <LiveBanner />
        <EntryBanner />
        <div className="terminal-grid">
          <TerminalTopBar />
          <TerminalSidebar counts={counts} liveChannels={liveChannels} />
          <div
            id="main-content"
            className="terminal-main"
            style={{ backgroundColor: "var(--term-bg)" }}
          >
            {children}
            <SiteFooter />
          </div>
          <TerminalStatusBar feedCount={counts.episodes} />
        </div>
        <MobileBottomNav />
        <RadialDialNav />
        <ConsoleSigil />
        <ClientOverlays />
        <CRTOverlay />
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
        <Analytics />
      </body>
    </html>
  );
}
