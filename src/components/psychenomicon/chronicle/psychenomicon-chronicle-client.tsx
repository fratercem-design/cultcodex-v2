"use client";

import dynamic from "next/dynamic";
import { PsychenomiconChronicleShell } from "./psychenomicon-chronicle-shell";

const PsychenomiconChronicle = dynamic(
  () => import("@/components/psychenomicon/chronicle/psychenomicon-chronicle"),
  // The fallback is what the server renders, so crawlers get the heading.
  { ssr: false, loading: () => <PsychenomiconChronicleShell /> }
);

export default PsychenomiconChronicle;