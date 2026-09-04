#!/usr/bin/env node
/**
 * Build The Cult Master's Handbook as a reflowable EPUB 3.
 *
 *   node scripts/handbook/build-epub.mjs [--src <dir>] [--out <file>]
 *
 * The source of record is ten markdown volumes on disk, not the database, so
 * this deliberately does not touch Prisma — it is a pure file-in/file-out build
 * that runs without a DATABASE_URL. Upserting the result into BookEdition is a
 * separate step that needs a live connection.
 *
 * ZIP is written by hand rather than pulling in a dependency: EPUB requires the
 * `mimetype` entry to be *stored* (uncompressed) and physically first, which is
 * exactly the constraint most convenience wrappers hide. ~80 lines of zlib beats
 * adding a package to a production repo whose lockfile moves constantly.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { join, dirname, resolve } from "node:path";

// ---------------------------------------------------------------- ZIP writer

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function zip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const { name, data, store } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const body = store ? data : deflateRawSync(data, { level: 9 });
    const method = store ? 0 : 8;
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0, 6);           // flags
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);          // mod time
    local.writeUInt16LE(0x2821, 12);     // mod date — fixed, so builds are byte-stable
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x2821, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, cdBuf, eocd]);
}

// ---------------------------------------------------------- markdown -> XHTML

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Inline spans. Escapes first, so markup can never inject raw XHTML. */
function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

/**
 * Editorial-state blockquotes are working notes to the author, not part of the
 * book. Every volume carries exactly one, and shipping them to a paying reader
 * would be a small but real breach of craft — so they are dropped at build time
 * rather than hand-deleted from the source of record.
 */
function stripEditorialNotes(md) {
  return md.replace(
    /^> \*\*(Editorial state|Editor|Status|Note)\b[\s\S]*?(?=\n\s*\n)/gim,
    ""
  );
}

function mdToXhtml(md) {
  const lines = stripEditorialNotes(md).replace(/\r/g, "").split("\n");
  const out = [];
  let para = [];
  let quote = [];

  const flushPara = () => {
    if (para.length) {
      out.push("<p>" + inline(para.join(" ")) + "</p>");
      para = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out.push("<blockquote><p>" + inline(quote.join(" ")) + "</p></blockquote>");
      quote = [];
    }
  };
  const flushAll = () => { flushPara(); flushQuote(); };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === "") { flushAll(); continue; }
    if (/^---+\s*$/.test(line)) { flushAll(); out.push("<hr/>"); continue; }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushAll();
      const level = Math.min(h[1].length + 1, 6); // the page <h1> is the volume title
      out.push("<h" + level + ">" + inline(h[2]) + "</h" + level + ">");
      continue;
    }

    if (line.startsWith("> ")) { flushPara(); quote.push(line.slice(2)); continue; }

    flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return out.join("\n");
}

// ------------------------------------------------------------------- build

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SRC = argOf(
  "--src",
  "C:/Users/johnb/OneDrive/Desktop/02 Projects/Cult of Psyche/Handbook"
);
const OUT = resolve(argOf("--out", "out/cult-masters-handbook.epub"));

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const files = readdirSync(SRC).filter((f) => /^Volume-.*\.md$/.test(f));
const volumes = ROMAN.map((r) => {
  // Anchored so Volume I does not match Volume II/III/IV/IX.
  const file = files.find((f) => new RegExp("^Volume-" + r + "-").test(f));
  if (!file) throw new Error("Missing Volume " + r + " in " + SRC);
  const md = readFileSync(join(SRC, file), "utf8");
  const title =
    (md.match(/^##\s+(Volume\s+[IVX]+\s*[\u2014-].*)$/m) || [])[1]?.trim() ||
    ("Volume " + r);
  return {
    roman: r,
    file,
    title,
    words: md.trim().split(/\s+/).length,
    xhtml: mdToXhtml(md),
  };
});

const TITLE = "The Cult Master's Handbook";
const SUBTITLE = "The Codex of Gatekeepers";
const AUTHOR = "The Cult of Psyche";
const UID = "urn:uuid:cult-masters-handbook-v1";

const CSS = [
  "html, body { margin: 0; padding: 0; }",
  'body { font-family: Georgia, "Iowan Old Style", serif; line-height: 1.6; padding: 1em; }',
  "h1, h2, h3, h4 { font-family: Georgia, serif; line-height: 1.25; page-break-after: avoid; }",
  "h1 { font-size: 1.7em; margin: 1.2em 0 .2em; }",
  "h2 { font-size: 1.35em; margin: 1.6em 0 .3em; }",
  "h3 { font-size: 1.1em; margin: 1.4em 0 .3em; letter-spacing: .02em; }",
  "p { margin: 0 0 .85em; }",
  "blockquote { margin: 1.2em; font-style: italic; border-left: 2px solid #8b5cf6; padding-left: .9em; }",
  "hr { border: 0; border-top: 1px solid #bbb; margin: 2em auto; width: 40%; }",
  "code { font-family: Consolas, monospace; font-size: .95em; }",
  ".title-page { text-align: center; margin-top: 20%; }",
  ".title-page h1 { font-size: 2.2em; }",
  ".title-page .sub { font-style: italic; color: #6b21a8; margin-top: .4em; }",
  ".title-page .author { margin-top: 3em; letter-spacing: .08em; text-transform: uppercase; font-size: .85em; }",
  "nav ol { list-style: none; padding-left: 0; }",
  "nav li { margin: .4em 0; }",
].join("\n");

const page = (title, body) =>
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  "<!DOCTYPE html>\n" +
  '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">\n' +
  "<head><meta charset=\"utf-8\"/><title>" + esc(title) + "</title>\n" +
  '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n' +
  "<body>\n" + body + "\n</body>\n</html>";

const titlePage = page(
  TITLE,
  '<div class="title-page">\n<h1>' + esc(TITLE) + "</h1>\n" +
    '<p class="sub">' + esc(SUBTITLE) + "</p>\n" +
    '<p class="author">' + esc(AUTHOR) + "</p>\n</div>"
);

const nav = page(
  "Contents",
  '<nav xmlns:epub="http://www.idpf.org/2007/ops" epub:type="toc" id="toc">\n' +
    "<h1>Contents</h1>\n<ol>\n" +
    volumes
      .map((v, i) =>
        '<li><a href="vol-' + String(i + 1).padStart(2, "0") + '.xhtml">' +
        esc(v.title) + "</a></li>"
      )
      .join("\n") +
    "\n</ol>\n</nav>"
);

const manifestItems = [
  '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
  '<item id="css" href="style.css" media-type="text/css"/>',
  '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>',
  ...volumes.map((_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return '<item id="vol' + n + '" href="vol-' + n + '.xhtml" media-type="application/xhtml+xml"/>';
  }),
].join("\n    ");

const spineItems = [
  '<itemref idref="title"/>',
  '<itemref idref="nav"/>',
  ...volumes.map((_, i) => '<itemref idref="vol' + String(i + 1).padStart(2, "0") + '"/>'),
].join("\n    ");

const opf =
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">\n' +
  '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n' +
  '    <dc:identifier id="pub-id">' + UID + "</dc:identifier>\n" +
  "    <dc:title>" + esc(TITLE) + "</dc:title>\n" +
  "    <dc:creator>" + esc(AUTHOR) + "</dc:creator>\n" +
  "    <dc:language>en</dc:language>\n" +
  '    <meta property="dcterms:modified">2026-01-01T00:00:00Z</meta>\n' +
  "  </metadata>\n  <manifest>\n    " + manifestItems +
  "\n  </manifest>\n  <spine>\n    " + spineItems +
  "\n  </spine>\n</package>";

const container =
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
  '  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>\n' +
  "</container>";

const B = (s) => Buffer.from(s, "utf8");
const entries = [
  // Must be first and stored uncompressed — this is the EPUB magic-bytes rule.
  { name: "mimetype", data: B("application/epub+zip"), store: true },
  { name: "META-INF/container.xml", data: B(container) },
  { name: "OEBPS/content.opf", data: B(opf) },
  { name: "OEBPS/style.css", data: B(CSS) },
  { name: "OEBPS/title.xhtml", data: B(titlePage) },
  { name: "OEBPS/nav.xhtml", data: B(nav) },
  ...volumes.map((v, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { name: "OEBPS/vol-" + n + ".xhtml", data: B(page(v.title, v.xhtml)) };
  }),
];

mkdirSync(dirname(OUT), { recursive: true });
const buf = zip(entries);
writeFileSync(OUT, buf);

const totalWords = volumes.reduce((a, v) => a + v.words, 0);
console.log("Built " + OUT);
console.log("  volumes : " + volumes.length);
console.log("  words   : " + totalWords.toLocaleString());
console.log("  entries : " + entries.length);
console.log("  size    : " + (buf.length / 1024).toFixed(0) + " KB");
for (const v of volumes) {
  console.log("    " + v.roman.padEnd(5) + v.title);
}
