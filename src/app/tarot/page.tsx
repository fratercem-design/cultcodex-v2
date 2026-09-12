import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";
import { TarotWaitlist } from "./tarot-waitlist";

// Server shell so the waitlist copy can quote the live archive size. The page
// itself is interactive, so the markup stays in a client component.
export default async function TarotPage() {
  const counts = await getCounts().catch(() => null);
  return <TarotWaitlist episodeCount={fmtEpisodeCount(counts?.episodes ?? 0)} />;
}
