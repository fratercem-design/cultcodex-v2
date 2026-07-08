"use client";

import dynamic from "next/dynamic";

const PsychenomiconChronicle = dynamic(
  () => import("@/components/psychenomicon/chronicle/psychenomicon-chronicle"),
  { ssr: false }
);

export default PsychenomiconChronicle;