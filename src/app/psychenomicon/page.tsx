import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import dynamic from "next/dynamic";

const PsychenomiconChronicle = dynamic(
  () => import("@/components/psychenomicon/chronicle/psychenomicon-chronicle"),
  { ssr: false }
);

export const metadata: Metadata = buildMetadata({
  title: "The Psychenomicon \u2014 CULT CODEX",
  description: "A living record of evolving patterns.",
  path: "/psychenomicon",
});

export default function PsychenomiconPage() {
  return <PsychenomiconChronicle />;
}
