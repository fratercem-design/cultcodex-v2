import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import PsychenomiconChronicle from "@/components/psychenomicon/chronicle/psychenomicon-chronicle-client";

export const metadata: Metadata = buildMetadata({
  title: "The Psychenomicon",
  description: "A living record of evolving patterns.",
  path: "/psychenomicon",
});

export default function PsychenomiconPage() {
  return <PsychenomiconChronicle />;
}