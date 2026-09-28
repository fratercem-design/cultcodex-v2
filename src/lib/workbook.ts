import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/db";

/**
 * The 30-Day Initiation workbook — a free PDF traded for an email address.
 *
 * The file lives outside /public so it can only be reached through a signed
 * link from the delivery email (see /api/workbook). Opening that link proves
 * the reader owns the address, so it also confirms them on the list.
 * Source and build script: docs/marketing/ai-personas/workbook/.
 */
export const WORKBOOK_SOURCE = "gift:initiation30";
export const WORKBOOK_FILENAME = "the-30-day-initiation.pdf";
const WORKBOOK_PATH = join(process.cwd(), "src/assets/workbook", WORKBOOK_FILENAME);

export function readWorkbookPdf(): Promise<Buffer> {
  return readFile(WORKBOOK_PATH);
}

/** Marks the address confirmed. Rows removed by unsubscribing are not recreated. */
export async function confirmWorkbookReader(email: string): Promise<void> {
  await prisma.subscriber.updateMany({
    where: { email: { equals: email, mode: "insensitive" }, verified: false },
    data: { verified: true },
  });
}
