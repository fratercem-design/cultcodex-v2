import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PrismaClient } from "@/generated/prisma/client";

// Compiles the first N illustrated Psychenomicon chapters into a single PDF and
// upserts it into BookEdition (served by /api/psychenomicon/book/[sku]). Pure
// function of a PrismaClient so it runs both from the CLI (public proxy) and
// from a server route (internal DB host) — no env/connection assumptions.

export const VOLUME_SKU = "psychenomicon-vol-1";
const TITLE = "The Psychenomicon — Volume I";
const SUBTITLE = "The Early Transmissions · An Illustrated Mythography";
export const DEFAULT_COUNT = 24;

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const INK = rgb(0.93, 0.93, 0.89);
const BG = rgb(0.04, 0.04, 0.06);
const VIOLET = rgb(0.61, 0.43, 0.82);
const MUTED = rgb(0.6, 0.58, 0.52);

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.replace(/\r/g, "").split("\n")) {
    if (para.trim() === "") { out.push(""); continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const trial = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) > maxW && line) { out.push(line); line = word; }
      else line = trial;
    }
    if (line) out.push(line);
  }
  return out;
}

export type BuildVolumeResult =
  | { ok: true; sku: string; pageCount: number; sizeMB: number; chapterFrom: number; chapterTo: number; chapters: number }
  | { ok: false; reason: string };

export async function buildPsychenomiconVolume(
  prisma: PrismaClient,
  count: number = DEFAULT_COUNT
): Promise<BuildVolumeResult> {
  const chapters = await prisma.psychenomiconChapter.findMany({
    where: { artGeneratedAt: { not: null } },
    orderBy: { chapterNumber: "asc" },
    take: count,
    select: {
      slug: true, chapterNumber: true, title: true,
      canonText: true, interpretationText: true, mythicText: true,
    },
  });
  if (chapters.length === 0) return { ok: false, reason: "no illustrated chapters" };

  const doc = await PDFDocument.create();
  doc.setTitle(TITLE);
  doc.setAuthor("CultCodex");
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
  let y = PAGE_H - MARGIN;
  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
    y = PAGE_H - MARGIN;
  };
  const need = (h: number) => { if (y - h < MARGIN) newPage(); };
  const block = (label: string, body: string | null) => {
    if (!body?.trim()) return;
    need(22);
    page.drawText(label, { x: MARGIN, y, font: mono, size: 8, color: VIOLET });
    y -= 16;
    for (const ln of wrap(body.trim(), serif, 11, CONTENT_W)) {
      need(15);
      if (ln) page.drawText(ln, { x: MARGIN, y, font: serif, size: 11, color: INK });
      y -= 15;
    }
    y -= 12;
  };

  // Title page
  page.drawText("THE", { x: MARGIN, y: PAGE_H - 220, font: mono, size: 14, color: MUTED });
  page.drawText("PSYCHENOMICON", { x: MARGIN, y: PAGE_H - 270, font: serifBold, size: 40, color: INK });
  page.drawText("VOLUME I", { x: MARGIN, y: PAGE_H - 300, font: mono, size: 16, color: VIOLET });
  for (const [i, ln] of wrap(SUBTITLE, serif, 13, CONTENT_W).entries()) {
    page.drawText(ln, { x: MARGIN, y: PAGE_H - 340 - i * 18, font: serif, size: 13, color: MUTED });
  }
  page.drawText("cultcodex.me", { x: MARGIN, y: MARGIN, font: mono, size: 9, color: MUTED });

  // Chapters
  for (const ch of chapters) {
    newPage();
    const art = await prisma.psychenomiconArtAsset.findUnique({
      where: { chapterSlug_slot: { chapterSlug: ch.slug, slot: "cover" } },
      select: { data: true },
    }).catch(() => null);
    if (art?.data) {
      try {
        const img = await doc.embedJpg(Buffer.from(art.data));
        const maxH = 300;
        const scale = Math.min(CONTENT_W / img.width, maxH / img.height);
        const w = img.width * scale, h = img.height * scale;
        page.drawImage(img, { x: (PAGE_W - w) / 2, y: y - h, width: w, height: h });
        y -= h + 22;
      } catch { /* non-embeddable image — skip */ }
    }
    need(40);
    page.drawText(`CH.${String(ch.chapterNumber).padStart(3, "0")}`, { x: MARGIN, y, font: mono, size: 9, color: VIOLET });
    y -= 22;
    for (const ln of wrap(ch.title, serifBold, 20, CONTENT_W)) {
      need(24);
      page.drawText(ln, { x: MARGIN, y, font: serifBold, size: 20, color: INK });
      y -= 24;
    }
    y -= 12;
    block("CANON", ch.canonText);
    block("INTERPRETATION", ch.interpretationText);
    block("MYTHIC", ch.mythicText);
  }

  const bytes = await doc.save();
  const pageCount = doc.getPageCount();
  const chapterFrom = chapters[0].chapterNumber;
  const chapterTo = chapters[chapters.length - 1].chapterNumber;

  await prisma.bookEdition.upsert({
    where: { sku: VOLUME_SKU },
    create: {
      sku: VOLUME_SKU, title: TITLE, mimeType: "application/pdf",
      data: Buffer.from(bytes), pageCount, chapterFrom, chapterTo,
    },
    update: {
      title: TITLE, data: Buffer.from(bytes), pageCount, chapterFrom, chapterTo,
      generatedAt: new Date(),
    },
  });

  return {
    ok: true, sku: VOLUME_SKU, pageCount,
    sizeMB: +(bytes.length / 1024 / 1024).toFixed(2),
    chapterFrom, chapterTo, chapters: chapters.length,
  };
}
