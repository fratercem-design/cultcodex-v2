import type { Metadata } from "next";
import { StairPage } from "@/components/easter-eggs/stair-page";

export const metadata: Metadata = {
  title: "▼ — CULT CODEX",
  description: "There is no page here.",
  robots: { index: false, follow: false },
};

export default function Landing2() {
  return (
    <StairPage level="B2" heading="The Shifting Wall" base="/stairwell/echo">
      <p>Your word came back up the stairs a moment later. The next landing is dark except for one line, written by a hand that won&apos;t hold still:</p>
      <p className="text-2xl tracking-[0.4em] text-amber-200/90 not-italic">SHUALYU</p>
      <p>Each letter has walked forward. Walk them back as many steps as the Codex&apos;s seal wants knocks.</p>
    </StairPage>
  );
}
