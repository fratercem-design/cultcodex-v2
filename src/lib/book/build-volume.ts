import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PrismaClient } from "@/generated/prisma/client";
import { getR2, R2_BUCKET, artKey, r2Configured } from "@/lib/r2";

// Compiles a run of illustrated Psychenomicon chapters into a single PDF and
// (optionally) upserts it into BookEdition, served by
// /api/psychenomicon/book/[sku]. Pure function of a PrismaClient so it runs
// both from the CLI (public proxy) and from a server route (internal DB host)
// — no env/connection assumptions.
//
// Volumes continue by *exclusion*, not by re-sorting. Volume I is already sold,
// so its contents are frozen; Volume N starts strictly after the chapterTo
// recorded on Volume N-1's BookEdition row. That makes "no overlap, no gap" a
// property of the data rather than something the caller has to get right.
//
// Note on ordering: chapters are selected by chapterNumber, which the chronicle
// UI correctly describes as "a stable id, not a rank" — broadcast order is
// episode.airDate. Volume I shipped in chapterNumber order, so later volumes
// match it for series consistency. Changing to air-date order is a deliberate
// series reset, not a bug fix, because it would move chapters between volumes.

export const VOLUME_SKU = "psychenomicon-vol-1";
export const DEFAULT_COUNT = 24;

const SERIES_SUBTITLE = "An Illustrated Mythography";

/**
 * Per-volume front matter. Volumes beyond these fall back to a generic name.
 *
 * Names follow Volume I's shape — adjective + plural noun — so the spines read
 * as a series. Volume II is named for what its 24 chapters actually do: a
 * throne is announced (CH.46) and a coattail cosmology built (CH.31) while a
 * doctrine hardens before the door (CH.36) and the opposition convenes (CH.47).
 * "Contested" is also the schema's own word for a chapter whose account is
 * disputed, which is most of this run.
 *
 * One line to change if John prefers another. Alternates considered:
 * "The Hardening Doctrines", "The Thrones and the Mirrors", "The Doctrine Years".
 */
const VOLUME_META: Record<number, { subtitle: string }> = {
  1: { subtitle: `The Early Transmissions · ${SERIES_SUBTITLE}` },
  2: { subtitle: `The Contested Thrones · ${SERIES_SUBTITLE}` },
};

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
export const roman = (n: number): string => ROMAN[n] ?? String(n);
export const skuForVolume = (n: number): string => `psychenomicon-vol-${n}`;
export const titleForVolume = (n: number): string =>
  `The Psychenomicon — Volume ${roman(n)}`;

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

/**
 * Load a chapter's cover image, mirroring /api/psychenomicon-art/[slug]/[slot]:
 * Cloudflare R2 first, Postgres blob as fallback.
 *
 * This used to read the Postgres blob only. When art moved to R2 the blobs were
 * emptied — all 1,200 of them are now zero bytes — so the builder silently
 * produced an unillustrated "Illustrated Mythography". Whatever this returns,
 * the caller counts it, so a repeat of that failure shows up in the output
 * instead of only in the file size.
 */
async function loadCover(
  prisma: PrismaClient,
  slug: string
): Promise<Buffer | null> {
  if (r2Configured()) {
    try {
      const obj = await getR2().send(
        new GetObjectCommand({ Bucket: R2_BUCKET, Key: artKey(slug, "cover") })
      );
      const bytes = Buffer.from(await obj.Body!.transformToByteArray());
      if (bytes.length > 0) return bytes;
    } catch {
      // R2 miss → fall through to Postgres.
    }
  }

  const asset = await prisma.psychenomiconArtAsset
    .findUnique({
      where: { chapterSlug_slot: { chapterSlug: slug, slot: "cover" } },
      select: { data: true },
    })
    .catch(() => null);

  if (!asset?.data) return null;
  const buf = Buffer.from(asset.data);
  return buf.length > 0 ? buf : null;
}

/**
 * Embed by actual file signature rather than by the declared mimeType, which
 * is a default (`image/jpeg`) that nothing verifies. A PNG stored under that
 * default would throw inside embedJpg and be skipped.
 */
async function embedCover(doc: PDFDocument, bytes: Buffer) {
  const isPng =
    bytes[0] === 0x89 && bytes.subarray(1, 4).toString("latin1") === "PNG";
  return isPng ? doc.embedPng(bytes) : doc.embedJpg(bytes);
}

export interface BuildVolumeOptions {
  /** Which volume to compile. Defaults to 1 for backwards compatibility. */
  volume?: number;
  /** Maximum chapters to include. */
  count?: number;
  /**
   * Exclusive lower bound on chapterNumber. Omit and it is read from the
   * previous volume's BookEdition row, so volumes chain automatically.
   */
  afterChapter?: number;
  /**
   * false = dry run: build the PDF and report, but write nothing to the
   * database. Defaults to true so existing callers are unchanged.
   */
  persist?: boolean;
  /** Override the front-matter subtitle. */
  subtitle?: string;
}

export type BuildVolumeResult =
  | {
      ok: true;
      sku: string;
      volume: number;
      title: string;
      pageCount: number;
      sizeMB: number;
      chapterFrom: number;
      chapterTo: number;
      chapters: number;
      /** Chapter numbers actually included, in book order. */
      chapterNumbers: number[];
      /** Chapters whose cover could not be drawn. Empty means fully illustrated. */
      missingArt: number[];
      persisted: boolean;
      /** The PDF itself — returned so a dry run can be written to disk. */
      bytes: Uint8Array;
    }
  | { ok: false; reason: string };

/**
 * Resolve where this volume starts. Volume 1 starts at the beginning; any
 * later volume starts after the last chapter of the volume before it. A
 * missing predecessor is an error rather than a silent restart at zero —
 * that would republish Volume I's chapters inside Volume II.
 */
async function resolveAfterChapter(
  prisma: PrismaClient,
  volume: number,
  explicit?: number
): Promise<{ ok: true; after: number } | { ok: false; reason: string }> {
  if (explicit !== undefined) return { ok: true, after: explicit };
  if (volume <= 1) return { ok: true, after: -1 };

  const previous = await prisma.bookEdition
    .findUnique({
      where: { sku: skuForVolume(volume - 1) },
      select: { chapterTo: true },
    })
    .catch(() => null);

  if (!previous) {
    return {
      ok: false,
      reason:
        `Volume ${roman(volume - 1)} (${skuForVolume(volume - 1)}) is not in BookEdition, ` +
        `so there is no way to tell where Volume ${roman(volume)} should start. ` +
        `Build the previous volume first, or pass afterChapter explicitly.`,
    };
  }
  return { ok: true, after: previous.chapterTo };
}

export async function buildPsychenomiconVolume(
  prisma: PrismaClient,
  optionsOrCount: BuildVolumeOptions | number = {}
): Promise<BuildVolumeResult> {
  // Back-compat: the admin route and old CLI pass a bare count.
  const options: BuildVolumeOptions =
    typeof optionsOrCount === "number" ? { count: optionsOrCount } : optionsOrCount;

  const volume = options.volume ?? 1;
  const count = options.count ?? DEFAULT_COUNT;
  const persist = options.persist ?? true;
  const sku = skuForVolume(volume);
  const TITLE = titleForVolume(volume);
  const SUBTITLE =
    options.subtitle ?? VOLUME_META[volume]?.subtitle ?? SERIES_SUBTITLE;

  const bound = await resolveAfterChapter(prisma, volume, options.afterChapter);
  if (!bound.ok) return { ok: false, reason: bound.reason };

  const chapters = await prisma.psychenomiconChapter.findMany({
    where: {
      artGeneratedAt: { not: null },
      ...(bound.after >= 0 ? { chapterNumber: { gt: bound.after } } : {}),
    },
    orderBy: { chapterNumber: "asc" },
    take: count,
    select: {
      slug: true, chapterNumber: true, title: true,
      canonText: true, interpretationText: true, mythicText: true,
    },
  });
  if (chapters.length === 0) {
    return {
      ok: false,
      reason:
        bound.after >= 0
          ? `No illustrated chapters after CH.${bound.after}. Volume ${roman(volume)} has nothing to compile — generate art for later chapters first.`
          : "no illustrated chapters",
    };
  }

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
  page.drawText(`VOLUME ${roman(volume)}`, { x: MARGIN, y: PAGE_H - 300, font: mono, size: 16, color: VIOLET });
  for (const [i, ln] of wrap(SUBTITLE, serif, 13, CONTENT_W).entries()) {
    page.drawText(ln, { x: MARGIN, y: PAGE_H - 340 - i * 18, font: serif, size: 13, color: MUTED });
  }
  page.drawText("cultcodex.me", { x: MARGIN, y: MARGIN, font: mono, size: 9, color: MUTED });

  // Chapters
  const missingArt: number[] = [];

  for (const ch of chapters) {
    newPage();
    const cover = await loadCover(prisma, ch.slug);
    let drew = false;
    if (cover) {
      try {
        const img = await embedCover(doc, cover);
        const maxH = 300;
        const scale = Math.min(CONTENT_W / img.width, maxH / img.height);
        const w = img.width * scale, h = img.height * scale;
        page.drawImage(img, { x: (PAGE_W - w) / 2, y: y - h, width: w, height: h });
        y -= h + 22;
        drew = true;
      } catch { /* unreadable image — recorded below, not swallowed */ }
    }
    if (!drew) missingArt.push(ch.chapterNumber);
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

  if (persist) {
    await prisma.bookEdition.upsert({
      where: { sku },
      create: {
        sku, title: TITLE, mimeType: "application/pdf",
        data: Buffer.from(bytes), pageCount, chapterFrom, chapterTo,
      },
      update: {
        title: TITLE, data: Buffer.from(bytes), pageCount, chapterFrom, chapterTo,
        generatedAt: new Date(),
      },
    });
  }

  return {
    ok: true,
    sku,
    volume,
    title: TITLE,
    pageCount,
    sizeMB: +(bytes.length / 1024 / 1024).toFixed(2),
    chapterFrom,
    chapterTo,
    chapters: chapters.length,
    chapterNumbers: chapters.map((c) => c.chapterNumber),
    missingArt,
    persisted: persist,
    bytes,
  };
}
