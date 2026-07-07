import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PremiumContent from "@/components/premium/premium-content-client";

export const metadata: Metadata = buildMetadata({
  title: "Join the Archive — Choose Your Role",
  description: "Initiate+ ($10/mo) unlocks the intelligence layer. Oracle ($25/mo) puts you inside it.",
  path: "/premium",
});

export default function PremiumPage() {
  return <PremiumContent />;
}