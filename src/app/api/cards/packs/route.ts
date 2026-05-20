export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getActivePacks } from "@/lib/queries/cards";

export async function GET() {
  const packs = await getActivePacks();
  return NextResponse.json(packs);
}
