import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { LiveBanner } from "@/components/layout/live-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SkipLink } from "@/components/ui/skip-link";
import { KonamiEasterEgg } from "@/components/ui/konami-easter-egg";
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
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me"),
  title: "CultCodex — The Living Archive",
  description: "The living archive of the Cult of Psyche.",
  icons: {
    icon: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  openGraph: {
    title: "CultCodex — The Living Archive",
    description: "The living archive of the Cult of Psyche.",
    images: [{ url: "/social-share.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/social-share.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} font-sans antialiased bg-void text-text-primary min-h-screen flex flex-col`}
      >
        <SkipLink />
        <LiveBanner />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <KonamiEasterEgg />
      </body>
    </html>
  );
}
