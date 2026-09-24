"use client";

import dynamic from "next/dynamic";

const PremiumContent = dynamic(
  () => import("@/components/premium/premium-content"),
  { ssr: false }
);

export default PremiumContent;