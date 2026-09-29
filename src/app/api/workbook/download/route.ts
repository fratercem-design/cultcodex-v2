/**
 * GET /api/workbook/download?e=<email>&t=<token>
 *
 * Streams the 30-Day Initiation PDF to the holder of a signed workbook link
 * (sent by POST /api/workbook). Opening the link confirms the address.
 */
import { NextRequest, NextResponse } from "next/server";
import { subscriberTokenValid } from "@/lib/subscriber-links";
import { confirmWorkbookReader, readWorkbookPdf, WORKBOOK_FILENAME } from "@/lib/workbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e");
  const token = req.nextUrl.searchParams.get("t");
  if (!subscriberTokenValid("workbook", email, token)) {
    // The page explains the broken link and offers a fresh one.
    return NextResponse.redirect(new URL("/initiation/download", req.url), 303);
  }

  await confirmWorkbookReader(email!);
  const pdf = await readWorkbookPdf();
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${WORKBOOK_FILENAME}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
