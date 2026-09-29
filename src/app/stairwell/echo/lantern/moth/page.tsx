import type { Metadata } from "next";
import { StairPage } from "@/components/easter-eggs/stair-page";
import { WellClaim } from "@/components/easter-eggs/well-claim";

export const metadata: Metadata = {
  title: "▼ — CULT CODEX",
  description: "There is no page here.",
  robots: { index: false, follow: false },
};

export default function TheWell() {
  return (
    <StairPage level="B∞" heading="The Well">
      <p>The stairs stop at a stone well with no bottom you can see. The moth lands on its rim and folds its wings.</p>
      <p>Everyone who reaches this far drops one coin in. Nobody has heard one land.</p>
      <WellClaim />
      <p className="text-text-muted/60">Don&apos;t post the way down. Point people at the basement and let them find the stairs themselves.</p>
    </StairPage>
  );
}
