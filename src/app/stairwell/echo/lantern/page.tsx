import type { Metadata } from "next";
import { StairPage } from "@/components/easter-eggs/stair-page";

export const metadata: Metadata = {
  title: "▼ — CULT CODEX",
  description: "There is no page here.",
  robots: { index: false, follow: false },
};

export default function Landing3() {
  return (
    <StairPage level="B3" heading="Lantern Light" base="/stairwell/echo/lantern" prompt="Name it.">
      <p>The lantern lights itself. Something is circling it.</p>
      <p className="text-text-primary/80 italic">
        I eat no bread but wear holes in wool.<br />
        I chase no fire, yet I die for one.<br />
        The Greeks gave my name to the soul.
      </p>
    </StairPage>
  );
}
