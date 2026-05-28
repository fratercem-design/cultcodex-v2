/**
 * Fetch Alexandra Mayers content from ip2wiki.info and upsert to PersonMedia.
 *
 * Uses the MediaWiki API to extract the article intro text and metadata.
 * Stores as a single "wiki" PersonMedia record for the person.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/scrape/fetch-ip2wiki.ts
 *
 * Env vars:
 *   PERSON_SLUG   — defaults to "alexandra-mayers"
 *   WIKI_PAGE     — defaults to "Alexandra_Mayers"
 *   WIKI_BASE_URL — defaults to "https://ip2wiki.info"
 */
import "dotenv/config";
import { getPrisma, disconnect } from "../ingest/lib";

const PERSON_SLUG = process.env.PERSON_SLUG ?? "alexandra-mayers";
const WIKI_PAGE = process.env.WIKI_PAGE ?? "Alexandra_Mayers";
const WIKI_BASE_URL = (process.env.WIKI_BASE_URL ?? "https://ip2wiki.info").replace(/\/$/, "");

interface MediaWikiParseResult {
  parse?: {
    title?: string;
    text?: { "*"?: string };
    wikitext?: { "*"?: string };
  };
}

interface MediaWikiSearchResult {
  query?: {
    search?: Array<{ title: string; snippet: string; timestamp: string }>;
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gsi, "")
    .replace(/<script[^>]*>.*?<\/script>/gsi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractIntro(html: string, maxChars = 2000): string {
  // Try to grab the first paragraph text before any navboxes / tables
  const paraMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [];
  const paragraphs: string[] = [];

  for (const para of paraMatches) {
    const text = stripHtml(para).trim();
    // Skip very short or clearly metadata paragraphs
    if (text.length < 30 || /^\s*(edit|coordinates|coordinates)/i.test(text)) continue;
    paragraphs.push(text);
    if (paragraphs.join("\n\n").length >= maxChars) break;
  }

  const intro = paragraphs.join("\n\n");
  if (intro.length > maxChars) return intro.slice(0, maxChars) + "…";
  return intro;
}

async function fetchWikiArticle(pageTitle: string): Promise<{
  title: string;
  intro: string;
  articleUrl: string;
} | null> {
  const articleUrl = `${WIKI_BASE_URL}/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`;

  // Try MediaWiki API
  const apiUrl = `${WIKI_BASE_URL}/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&redirects=1`;

  try {
    console.log(`  Trying MediaWiki API: ${apiUrl}`);
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "CultCodex/1.0 (archive research bot)" },
      signal: AbortSignal.timeout(20_000),
    });

    if (res.ok) {
      const data = (await res.json()) as MediaWikiParseResult;
      const html = data.parse?.text?.["*"] ?? "";
      const title = data.parse?.title ?? pageTitle;

      if (html) {
        const intro = extractIntro(html);
        if (intro.length > 50) {
          console.log(`  Got article via API: "${title}" (${intro.length} chars)`);
          return { title, intro, articleUrl };
        }
      }
    }
  } catch (err) {
    console.warn(`  API fetch failed: ${err instanceof Error ? err.message : err}`);
  }

  // Fallback: try direct page fetch and extract from HTML
  const candidates = [
    `${WIKI_BASE_URL}/wiki/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
    `${WIKI_BASE_URL}/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
    `${WIKI_BASE_URL}/index.php/${encodeURIComponent(pageTitle.replace(/ /g, "_"))}`,
  ];

  for (const url of candidates) {
    try {
      console.log(`  Trying direct fetch: ${url}`);
      const res = await fetch(url, {
        headers: { "User-Agent": "CultCodex/1.0 (archive research bot)" },
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      // Grab the page content div
      const contentMatch =
        html.match(/<div[^>]*id="mw-content-text"[^>]*>([\s\S]*?)<\/div>/i) ??
        html.match(/<div[^>]*class="[^"]*mw-parser-output[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const contentHtml = contentMatch?.[1] ?? html;
      const intro = extractIntro(contentHtml);

      if (intro.length > 50) {
        // Try to extract title from <h1>
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        const title = titleMatch ? stripHtml(titleMatch[1]) : pageTitle;
        console.log(`  Got article via direct fetch: "${title}" (${intro.length} chars)`);
        return { title, intro, articleUrl: url };
      }
    } catch (err) {
      console.warn(`  Direct fetch failed for ${url}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Try search fallback
  try {
    const searchUrl = `${WIKI_BASE_URL}/api.php?action=query&list=search&srsearch=${encodeURIComponent(pageTitle)}&format=json&srlimit=3`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "CultCodex/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = (await res.json()) as MediaWikiSearchResult;
      const first = data.query?.search?.[0];
      if (first && first.title !== pageTitle) {
        console.log(`  Search suggests page title: "${first.title}" — retrying...`);
        return fetchWikiArticle(first.title);
      }
    }
  } catch {}

  return null;
}

async function main() {
  console.log(`ip2wiki.info scraper — ${WIKI_PAGE}`);
  console.log(`Person: ${PERSON_SLUG}\n`);

  const result = await fetchWikiArticle(WIKI_PAGE);

  if (!result) {
    console.error(`Could not fetch article for "${WIKI_PAGE}" from ${WIKI_BASE_URL}`);
    console.error("The wiki may require authentication or the page may not exist.");
    process.exit(1);
  }

  const prisma = getPrisma();

  await prisma.personMedia.upsert({
    where: { source_sourceId: { source: "wiki", sourceId: `ip2wiki:${WIKI_PAGE}` } },
    create: {
      personSlug: PERSON_SLUG,
      source: "wiki",
      sourceId: `ip2wiki:${WIKI_PAGE}`,
      sourceUrl: result.articleUrl,
      title: result.title,
      rawContent: result.intro,
    },
    update: {
      title: result.title,
      rawContent: result.intro,
      sourceUrl: result.articleUrl,
    },
  });

  console.log(`\n✓ Upserted wiki record for "${result.title}"`);
  console.log(`  URL: ${result.articleUrl}`);
  console.log(`  Content: ${result.intro.slice(0, 120)}...`);

  await disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
