import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PsychenomiconChronicle from "@/components/psychenomicon/chronicle/psychenomicon-chronicle-client";

export const metadata: Metadata = buildMetadata({
  title: "The Psychenomicon",
  description:
    "A living book written from the Cult of Psyche archive: each episode becomes an illustrated chapter tracking the people, conflicts and patterns of the show.",
  path: "/psychenomicon",
});

export default function PsychenomiconPage() {
  return <PsychenomiconChronicle />;
}