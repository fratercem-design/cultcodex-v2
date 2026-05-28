import { redirect } from "next/navigation";

// /subscribe is the legacy checkout entry point.
// /premium is the canonical pricing page with all tiers (Observer → Initiate+ → Oracle).
export default function SubscribePage() {
  redirect("/premium");
}
