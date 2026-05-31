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
import { getArchiveCounts } from "@/lib/queries/stats";
import { SkipLink } from "@/components/ui/skip-link";
import { KonamiEasterEgg } from "@/components/ui/konami-easter-egg";
import { CommandPalette } from "@/components/search/command-palette";
import { Providers } from "@/components/providers";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-fallback",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
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
const vt323 = VT323({
  variable: "--font-crt",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "The complete archive of the Cult of Psyche: 2,500+ transmissions, searchable transcripts, lore entries, guest profiles, relationship maps, and AI-powered exploration of every word ever spoken in the stream.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me"
  ),
  title: "CultCodex — The Living Archive",
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  openGraph: {
    title: "CultCodex — The Living Archive",
    description: SITE_DESCRIPTION,
    images: [{ url: "/social-share.jpg", width: 1200, height: 630 }],
    siteName: "CultCodex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CultCodex — The Living Archive",
    description: SITE_DESCRIPTION,
    images: ["/social-share.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const counts = await getArchiveCounts().catch(() => ({
    episodes: 0,
    topics: 0,
    people: 0,
    transcribedEpisodes: 0,
  }));

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
      <body
        className={`${fontVariables} font-mono antialiased bg-void text-text-primary`}
        style={{ backgroundColor: "var(--term-bg)" }}
      >
        <Providers>
        <SkipLink />
        <LiveBanner />
        <EntryBanner />
        <div className="terminal-grid">
          <TerminalTopBar />
          <TerminalSidebar counts={counts} />
          <div
            id="main-content"
            className="terminal-main"
            style={{ backgroundColor: "var(--term-bg)" }}
          >
            {children}
          </div>
          <TerminalStatusBar feedCount={counts.episodes} />
        </div>
        <KonamiEasterEgg />
        <CommandPalette />
        </Providers>
        <GoogleAnalytics gaId="G-1ML217JXYV" />
      </body>
    </html>
  );
}
