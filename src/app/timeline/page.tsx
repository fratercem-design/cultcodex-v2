import type { Metadata } from "next";
import { TimelineView } from "./timeline-view";

export const revalidate = 300;
export const maxDuration = 30;

export const metadata: Metadata = {
  alternates: { canonical: "/timeline" },
  title: "Timeline — CULT CODEX",
  description: "Every Cult of Psyche episode in chronological order",
};

/** The most recent archived year. Older years live at /timeline/[year]. */
export default async function TimelinePage() {
  return <TimelineView />;
}
