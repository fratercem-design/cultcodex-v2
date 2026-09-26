#!/usr/bin/env node
// Builds "The 30-Day Initiation" workbook as print-ready US Letter HTML + PDF.
//
//   node docs/marketing/ai-personas/workbook/build.mjs
//
// Needs Playwright with Chromium (local or global install). Drop a portrait of
// Madame Sulphur at ./cover.jpg (square works best) and it lands on the cover;
// otherwise the cover shows the archetype glyph ring alone.

import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { SITE, UTM, GATES, DAYS, FIELD_GUIDE, SPREADS } from "./content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_HTML = join(HERE, "initiation-workbook.html");
const OUT_PDF = join(HERE, "the-30-day-initiation.pdf");
const COVER = join(HERE, "cover.jpg");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pad = (n) => String(n).padStart(2, "0");
// Visible text stays short; the PDF link carries the UTM so clicks are attributable.
const link = (path) => `<a href="https://${SITE}${path}${UTM}">${SITE}${path}</a>`;

// ── Page builders ─────────────────────────────────────────────────────

function cover() {
  const glyphs = FIELD_GUIDE.map((a) => a.glyph);
  const ring = glyphs
    .map((g, i) => {
      const angle = (i / glyphs.length) * Math.PI * 2 - Math.PI / 2;
      const x = 150 + Math.cos(angle) * 128;
      const y = 150 + Math.sin(angle) * 128;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="ring-glyph">${g}</text>`;
    })
    .join("");
  const portrait = existsSync(COVER)
    ? `<image href="data:image/jpeg;base64,${readFileSync(COVER).toString("base64")}" x="50" y="50" width="200" height="200" clip-path="url(#portrait)" preserveAspectRatio="xMidYMid slice"/>`
    : `<text x="150" y="150" class="ring-center">◉</text>`;
  return `
  <section class="page cover">
    <div class="cover-top mono">CULTCODEX · WORKBOOK</div>
    <svg class="ring" viewBox="0 0 300 300" aria-hidden="true">
      <defs><clipPath id="portrait"><circle cx="150" cy="150" r="100"/></clipPath></defs>
      <circle cx="150" cy="150" r="128" class="ring-line"/>
      <circle cx="150" cy="150" r="104" class="ring-line faint"/>
      ${portrait}
      ${ring}
    </svg>
    <h1 class="cover-title">The 30-Day<br/>Initiation</h1>
    <p class="cover-sub serif">One rite a day. Eight archetypes. Five gates. One seal.</p>
    <p class="cover-host mono">Hosted by Madame Sulphur, an AI character</p>
    <div class="cover-foot mono">An independent Cult of Psyche fan project · ${SITE}</div>
  </section>`;
}

function welcome() {
  return `
  <section class="page">
    ${header("Before you begin", "")}
    <h2 class="title">Sit down, darling.</h2>
    <div class="letter serif">
      <p>You picked this up because some part of you wants to know which one you are. Not your star sign or a personality type with four letters. Something older. The <em>archetype</em> you keep coming back to, whether you meant to or not.</p>
      <p>For thirty days I'll give you one rite a day. Each takes about ten minutes. Some will be easy and some you'll put off until the evening. Do them anyway. Skipping is information too.</p>
      <p>There are five gates. At the <em>Threshold</em> you watch. In the <em>Mirror</em> you look back at yourself. In the <em>Crucible</em> you transform what you found. With the <em>Signal</em> you speak. And at the <em>Seal</em> you make a promise.</p>
      <p>I already know how this ends. You don't yet. That's the fun of it.</p>
      <p class="sign">— Madame Sulphur</p>
    </div>
    <div class="how">
      <div class="how-label mono">How to use this workbook</div>
      <ol>
        <li><strong>One page a day.</strong> Read the rule, do the rite, fill in the lines. About ten minutes.</li>
        <li><strong>Tick the tracker.</strong> It's on page 4. Cut it out, stick it on the fridge and don't break the chain.</li>
        <li><strong>Tasks marked <span class="mono">In the Codex</span> are optional.</strong> They send you into the archive at ${SITE}. Most of them are free.</li>
        <li><strong>Missed a day?</strong> Do it tomorrow. Don't do two at once. The rites need a night in between.</li>
      </ol>
    </div>
    <p class="fine">Madame Sulphur is an AI character. This workbook is for reflection and fun. It is not therapy, medical advice or a prediction of the future. If you're struggling, please talk to someone you trust or a local support service. CultCodex is an independent fan archive, not an official Cult of Psyche publication.</p>
    ${footer(2)}
  </section>`;
}

function map() {
  const rows = GATES.map(
    (g) => `
      <div class="gate-row">
        <div class="gate-glyph">${g.glyph}</div>
        <div>
          <div class="mono small">GATE ${g.numeral} · ${esc(g.days.toUpperCase())} · ${esc(g.theme.toUpperCase())}</div>
          <div class="gate-row-name">${esc(g.name)}</div>
          <p class="serif">${esc(g.intro)}</p>
        </div>
      </div>`,
  ).join("");
  return `
  <section class="page">
    ${header("The map", "")}
    <h2 class="title">Five gates</h2>
    <div class="gates">${rows}</div>
    ${footer(3)}
  </section>`;
}

function tracker() {
  const blocks = GATES.map((g, gi) => {
    const cells = DAYS.map((d, i) => ({ d, n: i + 1 }))
      .filter(({ d }) => d.gate === gi)
      .map(({ d, n }) => `<div class="cell"><span class="mono">${pad(n)}</span><span class="cell-name">${esc(d.title)}</span></div>`)
      .join("");
    return `<div class="track-gate"><div class="mono small">${g.glyph} GATE ${g.numeral} · ${esc(g.name.toUpperCase())}</div><div class="cells">${cells}</div></div>`;
  }).join("");
  return `
  <section class="page">
    ${header("The tracker", "cut along the edge · stick it on the fridge")}
    <div class="cut">
      <h2 class="title">Don't break the chain</h2>
      <p class="serif lead">Put a mark in each box when the rite is done. Any mark is fine, darling: a tick, a cross, a small drawing of a cat.</p>
      ${blocks}
      <div class="track-name">Initiate: ____________________________ &nbsp; Began: ______________</div>
    </div>
    ${footer(4)}
  </section>`;
}

function gateDivider(g, pageNo) {
  return `
  <section class="page divider">
    <div class="divider-inner">
      <div class="mono small">GATE ${g.numeral} · ${esc(g.days.toUpperCase())}</div>
      <div class="divider-glyph">${g.glyph}</div>
      <h2 class="divider-name">${esc(g.name)}</h2>
      <div class="mono divider-theme">${esc(g.theme.toUpperCase())}</div>
      <p class="serif divider-intro">${esc(g.intro)}</p>
    </div>
    ${footer(pageNo)}
  </section>`;
}

function dayPage(d, n, pageNo) {
  const g = GATES[d.gate];
  const codex = d.codex
    ? `<div class="codex"><span class="mono codex-label">In the Codex</span> ${esc(d.codex.text)} <span class="mono codex-url">${link(d.codex.path)}</span></div>`
    : "";
  let body;
  if (d.numbered) {
    const rows = Array.from({ length: d.numbered }, (_, i) => `<div class="num-row"><span class="mono">${pad(i + 1)}</span><span class="num-line"></span></div>`).join("");
    body = `<div class="prompt grow"><div class="prompt-label">${esc(d.prompts[0])}</div><div class="numbered">${rows}</div></div>`;
  } else {
    const blocks = d.prompts
      .map((p, i) => {
        const sketch = d.sketch && i === 0 ? `<div class="sketch"><span class="mono">sketch here</span></div>` : "";
        return `${sketch}<div class="prompt grow"><div class="prompt-label">${esc(p)}</div><div class="lines"></div></div>`;
      })
      .join("");
    body = blocks;
  }
  return `
  <section class="page day">
    ${header(`${g.glyph} Gate ${g.numeral} · ${g.name}`, `Day ${pad(n)} / 30`)}
    <h2 class="title">${esc(d.title)}</h2>
    <blockquote class="rule serif">${esc(d.rule)}</blockquote>
    <p class="note serif">“${esc(d.note)}” <span class="note-by mono">— Madame Sulphur</span></p>
    <div class="rite"><span class="mono rite-label">${d.review ? "The review" : "The rite"}</span> ${esc(d.rite)}</div>
    ${codex}
    <div class="work">${body}</div>
    <div class="done"><span class="box"></span> Rite complete <span class="done-date">Date ________________</span></div>
    ${footer(pageNo)}
  </section>`;
}

function seal(pageNo) {
  return `
  <section class="page seal-page">
    ${header("The Seal of Initiation", "")}
    <div class="seal">
      <div class="seal-glyphs">${FIELD_GUIDE.map((a) => a.glyph).join(" ")}</div>
      <div class="mono small">THIS CERTIFIES THAT</div>
      <div class="seal-line"></div>
      <div class="mono small">HAS PASSED THROUGH ALL FIVE GATES AS</div>
      <div class="seal-arche serif">The <span class="seal-blank"></span></div>
      <p class="serif seal-vow">and has promised to keep what they found.</p>
      <div class="seal-sign">
        <div><div class="seal-line short"></div><div class="mono small">Signed</div></div>
        <div><div class="seal-line short"></div><div class="mono small">Date</div></div>
      </div>
      <p class="serif seal-madame">Witnessed, fondly, by Madame Sulphur</p>
    </div>
    ${footer(pageNo)}
  </section>`;
}

function fieldGuide(items, pageNo, part) {
  const cards = items
    .map(
      (a) => `
      <div class="arche">
        <div class="arche-head"><span class="arche-glyph">${a.glyph}</span><span class="arche-name">${esc(a.name)}</span></div>
        <div class="arche-row"><span class="mono">GIFT</span><span class="serif">${esc(a.gift)}</span></div>
        <div class="arche-row"><span class="mono">SHADOW</span><span class="serif">${esc(a.shadow)}</span></div>
        <div class="arche-row"><span class="mono">PRACTICE</span><span class="serif">${esc(a.practice)}</span></div>
      </div>`,
    )
    .join("");
  return `
  <section class="page">
    ${header("Bonus · The Field Guide", `${part} of 2`)}
    <h2 class="title">${part === 1 ? "The eight archetypes" : "The eight archetypes, continued"}</h2>
    ${part === 1 ? `<p class="serif lead">You'll need this on Day 9. Find yours, then read the one you'd least like to be. That one has something to teach you too.</p>` : ""}
    <div class="arches">${cards}</div>
    ${footer(pageNo)}
  </section>`;
}

function spreads(pageNo) {
  const s = SPREADS.map(
    (sp) => `
      <div class="spread">
        <div class="spread-name">${esc(sp.name)}</div>
        <div class="serif spread-use">${esc(sp.use)}</div>
        <div class="spread-cards">${sp.positions.map((p, i) => `<div class="spread-card"><span class="mono">${i + 1}</span><span class="serif">${esc(p)}</span></div>`).join("")}</div>
      </div>`,
  ).join("");
  return `
  <section class="page">
    ${header("Bonus · Madame's spreads", "")}
    <h2 class="title">Three spreads for later</h2>
    <p class="serif lead">For after the thirty days. Draw one card for each position from any deck or <span class="mono">${link("/draw")}</span>, or skip the cards and simply answer each position in writing. The questions do most of the work.</p>
    ${s}
    ${footer(pageNo)}
  </section>`;
}

function continuePage(pageNo) {
  return `
  <section class="page">
    ${header("What comes after", "")}
    <h2 class="title">The archive remembers everything</h2>
    <p class="serif lead">You spent thirty days keeping a record of yourself. The Codex does the same for every Cult of Psyche transmission: every episode, transcript, running joke and prophecy, all searchable down to the sentence.</p>
    <div class="next">
      <div class="next-item"><div class="mono small">FREE</div><div class="next-name">The archetype quiz</div><div class="mono codex-url">${link("/archetype-quiz")}</div></div>
      <div class="next-item"><div class="mono small">FREE · 3 A MONTH</div><div class="next-name">Ask the Oracle</div><div class="mono codex-url">${link("/oracle")}</div></div>
      <div class="next-item"><div class="mono small">FREE</div><div class="next-name">Search the archive</div><div class="mono codex-url">${link("/search")}</div></div>
      <div class="next-item feature"><div class="mono small">INITIATE+ · $10 / MONTH</div><div class="next-name">100 Oracle questions a month, full transcripts and the Psychenomicon</div><div class="mono codex-url">${link("/premium")}</div></div>
    </div>
    <p class="serif sign">Come and find me. I'll be at the table.<br/>— Madame Sulphur</p>
    ${footer(pageNo)}
  </section>`;
}

function header(left, right) {
  return `<header class="hdr mono"><span>${esc(left)}</span><span>${esc(right)}</span></header>`;
}
function footer(n) {
  return `<footer class="ftr mono"><span>The 30-Day Initiation</span><span>${n}</span></footer>`;
}

// ── Fonts ─────────────────────────────────────────────────────────────
// Downloaded with curl and inlined as data URIs, so the PDF always embeds the
// real faces (headless Chromium may not trust a proxy's CA for web fonts).
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=block";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function fontCss() {
  try {
    const css = execSync(`curl -sSfL -A "${UA}" "${FONTS_URL}"`).toString();
    // Keep only the basic latin subset; drop latin-ext, vietnamese, etc.
    const blocks = css.split(/(?=\/\* [a-z-]+ \*\/)/).filter((b) => b.startsWith("/* latin */"));
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

function build() {
  const pages = [cover(), welcome(), map(), tracker()];
  let pageNo = pages.length;
  let currentGate = -1;
  DAYS.forEach((d, i) => {
    if (d.gate !== currentGate) {
      currentGate = d.gate;
      pages.push(gateDivider(GATES[d.gate], ++pageNo));
    }
    pages.push(dayPage(d, i + 1, ++pageNo));
  });
  pages.push(seal(++pageNo));
  pages.push(fieldGuide(FIELD_GUIDE.slice(0, 4), ++pageNo, 1));
  pages.push(fieldGuide(FIELD_GUIDE.slice(4), ++pageNo, 2));
  pages.push(spreads(++pageNo));
  pages.push(continuePage(++pageNo));

  const css = readFileSync(join(HERE, "workbook.css"), "utf8");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>The 30-Day Initiation</title>
<style>${fontCss()}${css}</style>
</head><body>${pages.join("\n")}</body></html>`;
}

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    const globalRoot = execSync("npm root -g").toString().trim();
    return require(join(globalRoot, "playwright"));
  }
}

const html = build();
writeFileSync(OUT_HTML, html);
const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("file://" + OUT_HTML, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: OUT_PDF, format: "Letter", printBackground: true, preferCSSPageSize: true });
const count = await page.locator("section.page").count();
await browser.close();
console.log(`Wrote ${OUT_PDF} (${count} pages)`);
