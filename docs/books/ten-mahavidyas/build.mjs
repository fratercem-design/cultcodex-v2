#!/usr/bin/env node
// Builds "The Ten Mahāvidyās" as a 6 × 9 in print-ready PDF.
//
//   node docs/books/ten-mahavidyas/build.mjs
//
// Needs Playwright with Chromium (local or global install). Renders twice:
// the first pass reads chapter page numbers from the PDF outline, the second
// writes them into the contents page.

import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { BOOK, FRONT, INTRO, GODDESSES, EPILOGUE, GLOSSARY } from "./content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_HTML = join(HERE, "the-ten-mahavidyas.html");
const OUT_PDF = join(HERE, "the-ten-mahavidyas.pdf");
const require = createRequire(import.meta.url);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── Ornament ──────────────────────────────────────────────────────────
// A plain yantra: square gates, two circles, eight petals, interlocked triangles.
function yantra(size, cls = "") {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180;
    const x = 100 + Math.cos(a) * 52;
    const y = 100 + Math.sin(a) * 52;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="15" ry="8" transform="rotate(${i * 45} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }).join("");
  return `<svg class="yantra ${cls}" width="${size}" height="${size}" viewBox="0 0 200 200" aria-hidden="true">
    <rect x="8" y="8" width="184" height="184"/>
    <path class="gates" d="M86 8h28M86 192h28M8 86v28M192 86v28"/>
    <circle cx="100" cy="100" r="78"/><circle cx="100" cy="100" r="70"/>
    <g class="petals">${petals}</g>
    <circle cx="100" cy="100" r="38"/>
    <path d="M100 66 L130 118 L70 118 Z"/><path d="M100 134 L70 82 L130 82 Z"/>
    <circle cx="100" cy="100" r="3" class="bindu"/>
  </svg>`;
}

// ── Sections ──────────────────────────────────────────────────────────

// Typographic quotes: opening after a space or bracket, closing/apostrophe elsewhere.
const curly = (s) => s.replace(/(^|[\s(>])'/g, "$1\u2018").replace(/'/g, "\u2019");
const paras = (list) => list.map((p) => `<p>${curly(p)}</p>`).join("\n");

function cover() {
  return `
  <section class="cover">
    <div class="cover-deva">${BOOK.devanagari}</div>
    ${yantra(250, "cover-yantra")}
    <h1 class="cover-title">${esc(BOOK.title)}</h1>
    <p class="cover-sub">${esc(BOOK.subtitle)}</p>
    <p class="cover-credit">A retelling from ${esc(BOOK.sourceName)}</p>
    <div class="cover-imprint">${esc(BOOK.imprint)}</div>
  </section>`;
}

function titlePage() {
  return `
  <section class="front title-page">
    <div class="tp-deva">${BOOK.devanagari}</div>
    <h1>${esc(BOOK.title)}</h1>
    <p class="tp-sub">${esc(BOOK.subtitle)}</p>
    <div class="rule"></div>
    <p class="tp-credit">Retold in plain English from<br/>${esc(BOOK.sourceName)}<br/><span class="small">${esc(BOOK.sourceSite)} · ${esc(BOOK.sourceDates)}</span></p>
    <div class="tp-imprint">${esc(BOOK.imprint)}</div>
  </section>`;
}

function notePage() {
  return `
  <section class="front note">
    <h2 class="front-head">A note on this book</h2>
    ${paras(FRONT.note)}
    <p class="source">Source: <a href="${BOOK.sourceUrl}">${esc(BOOK.sourceUrl.replace("https://", ""))}</a></p>
  </section>`;
}

function contents(pages) {
  const row = (label, title, key) =>
    `<li><span class="toc-label">${label}</span><span class="toc-title">${title}</span><span class="toc-dots"></span><span class="toc-page">${pages[key] ?? ""}</span></li>`;
  return `
  <section class="front toc">
    <h2 class="front-head">Contents</h2>
    <ol>
      ${row("", esc(INTRO.title), "intro")}
      ${GODDESSES.map((g) => row(g.n, `${esc(g.name)} <span class="toc-epi">${esc(g.epithet)}</span>`, `g${g.n}`)).join("\n")}
      ${row("", esc(EPILOGUE.title), "epilogue")}
      ${row("", "The ten at a glance", "table")}
      ${row("", "Glossary", "glossary")}
    </ol>
  </section>`;
}

function essay(block, kicker) {
  return `
  <section class="chapter essay">
    <div class="kicker">${kicker}</div>
    <h2 class="chapter-title">${esc(block.title)}</h2>
    ${block.sections.map((s) => `<h3>${esc(s.heading)}</h3>\n${paras(s.paras)}`).join("\n")}
  </section>`;
}

function goddess(g) {
  return `
  <section class="chapter goddess">
    <div class="opener">
      <div class="kicker">The ${ordinal(g.n)} Mahāvidyā</div>
      <div class="big-num">${g.n}</div>
      <div class="deva">${g.deva}</div>
      <h2 class="chapter-title">${esc(g.name)}</h2>
      <p class="epithet">${esc(g.epithet)}</p>
      <div class="seat"><span class="seat-label">In the body</span>${curly(g.seat)}</div>
    </div>
    ${g.sections.map((s, i) => `<h3>${esc(s.heading)}</h3>\n${i === 0 ? paras(s.paras).replace("<p>", '<p class="first">') : paras(s.paras)}`).join("\n")}
    <aside class="reflect"><span class="reflect-label">To sit with</span>${curly(esc(g.reflect))}</aside>
  </section>`;
}

function ordinal(n) {
  return ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"][n - 1];
}

function atAGlance() {
  return `
  <section class="chapter backmatter">
    <h2 class="chapter-title">The ten at a glance</h2>
    <table class="glance">
      <thead><tr><th></th><th>Goddess</th><th>Face</th><th>In the body</th></tr></thead>
      <tbody>
      ${GODDESSES.map(
        (g) =>
          `<tr><td class="n">${g.n}</td><td><span class="g-name">${esc(g.name)}</span><span class="g-deva">${g.deva}</span></td><td>${esc(g.epithet)}</td><td>${g.seat.split(". ")[0].replace(/\.$/, "")}.</td></tr>`,
      ).join("\n")}
      </tbody>
    </table>
    <p class="note-small">Placements follow the epilogue of the source series. All but Tripura Bhairavī work in the higher chakras.</p>
  </section>`;
}

function glossary() {
  return `
  <section class="chapter backmatter">
    <h2 class="chapter-title">Glossary</h2>
    <dl class="glossary">
      ${GLOSSARY.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join("\n")}
    </dl>
  </section>`;
}

function colophon() {
  return `
  <section class="colophon">
    ${yantra(90, "small-yantra")}
    <p>This retelling follows ${esc(BOOK.sourceName)}, published on ${esc(BOOK.sourceSite)}. Readers who want the mantras, the Sanskrit verses and the full commentary should go there.</p>
    <p class="small">${esc(BOOK.imprint)} · Set in EB Garamond and Noto Serif Devanagari.</p>
  </section>`;
}

// ── Fonts ─────────────────────────────────────────────────────────────
// Inlined as data URIs so the PDF always embeds the real faces. latin-ext
// carries the IAST diacritics (ā ś ṣ ṇ ṛ ṁ ḥ).
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+Devanagari:wght@400;600&display=block";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const SUBSETS = ["/* latin */", "/* latin-ext */", "/* devanagari */"];

function fontCss() {
  try {
    const css = execSync(`curl -sSfL -A "${UA}" "${FONTS_URL}"`).toString();
    const blocks = css.split(/(?=\/\* [a-z-]+ \*\/)/).filter((b) => SUBSETS.some((s) => b.startsWith(s)));
    return blocks
      .map((b) =>
        b.replace(/url\((https:[^)]+)\)/g, (_, url) => {
          const data = execSync(`curl -sSfL "${url}"`).toString("base64");
          return `url(data:font/woff2;base64,${data})`;
        }),
      )
      .join("\n");
  } catch (err) {
    console.warn("Could not fetch web fonts, falling back to system fonts:", err.message);
    return "";
  }
}

// ── Assemble ──────────────────────────────────────────────────────────

function build(fonts, pages = {}) {
  const body = [
    cover(),
    titlePage(),
    notePage(),
    contents(pages),
    essay(INTRO, "Introduction"),
    ...GODDESSES.map(goddess),
    essay(EPILOGUE, "Epilogue"),
    atAGlance(),
    glossary(),
    colophon(),
  ].join("\n");
  const css = readFileSync(join(HERE, "book.css"), "utf8");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${esc(BOOK.title)}</title>
<style>${fonts}${css}</style>
</head><body>${body}</body></html>`;
}

async function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    const globalRoot = execSync("npm root -g").toString().trim();
    return require(join(globalRoot, "playwright"));
  }
}

async function loadPdfLib() {
  try {
    return require("pdf-lib");
  } catch {
    return null;
  }
}

async function render(browser, html) {
  writeFileSync(OUT_HTML, html);
  const page = await browser.newPage();
  await page.goto("file://" + OUT_HTML, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, outline: true, tagged: true });
  await page.close();
  return pdf;
}

// Map each h2 title in the PDF outline to its 1-based page number.
async function outlinePages(pdfBytes) {
  const lib = await loadPdfLib();
  if (!lib) return {};
  const { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef, PDFHexString, PDFString } = lib;
  const doc = await PDFDocument.load(pdfBytes);
  const refs = doc.getPages().map((p) => p.ref.toString());
  const outlines = doc.catalog.lookupMaybe(PDFName.of("Outlines"), PDFDict);
  const found = {};
  const walk = (item) => {
    while (item) {
      const title = item.lookup(PDFName.of("Title"));
      const text = title instanceof PDFHexString || title instanceof PDFString ? title.decodeText() : "";
      let dest = item.lookup(PDFName.of("Dest"));
      if (!dest) {
        const action = item.lookupMaybe(PDFName.of("A"), PDFDict);
        dest = action?.lookup(PDFName.of("D"));
      }
      if (dest instanceof PDFArray) {
        const ref = dest.get(0);
        if (ref instanceof PDFRef) found[text.trim()] ??= refs.indexOf(ref.toString()) + 1;
      }
      const child = item.lookupMaybe(PDFName.of("First"), PDFDict);
      if (child) walk(child);
      item = item.lookupMaybe(PDFName.of("Next"), PDFDict);
    }
  };
  if (outlines) walk(outlines.lookupMaybe(PDFName.of("First"), PDFDict));
  return found;
}

const fonts = fontCss();
const { chromium } = await loadPlaywright();
const browser = await chromium.launch();

const first = await render(browser, build(fonts));
const byTitle = await outlinePages(first);
const pages = {
  intro: byTitle[INTRO.title],
  epilogue: byTitle[EPILOGUE.title],
  table: byTitle["The ten at a glance"],
  glossary: byTitle["Glossary"],
};
for (const g of GODDESSES) pages[`g${g.n}`] = byTitle[g.name];
if (Object.values(pages).some((v) => !v)) console.warn("Some contents page numbers are missing:", pages);

const final = await render(browser, build(fonts, pages));
writeFileSync(OUT_PDF, final);
await browser.close();

const lib = await loadPdfLib();
const count = lib ? (await lib.PDFDocument.load(final)).getPageCount() : "?";
console.log(`Wrote ${OUT_PDF} (${count} pages)`);
