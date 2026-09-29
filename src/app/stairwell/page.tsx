import type { Metadata } from "next";
import { StairPage } from "@/components/easter-eggs/stair-page";

export const metadata: Metadata = {
  title: "▼ — CULT CODEX",
  description: "There is no page here.",
  robots: { index: false, follow: false },
};

export default function Stairwell() {
  return (
    <StairPage level="B1" heading="The Stairwell" base="/stairwell">
      <p>The stairs keep going past the basement. Someone chalked a verse on the wall.</p>
      <p className="text-text-primary/80 italic text-left inline-block">
        Every voice that enters here<br />
        Carries back a little changed.<br />
        Hollow walls remember what you<br />
        Only said the once.
      </p>
      <p>Read it the way a stairwell does: from the top, one step at a time.</p>
    </StairPage>
  );
}
