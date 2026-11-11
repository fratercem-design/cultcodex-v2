import { SITE_URL } from "@/lib/seo";

// OpenSearch description: lets browsers offer "Search CultCodex" from the
// address bar (Firefox's "Add search engine", Chrome's tab-to-search).
// Linked from <head> in src/app/layout.tsx.
export const dynamic = "force-static";

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>CultCodex</ShortName>
  <Description>Search Cult of Psyche episodes, transcripts, people and lore</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/x-icon">${SITE_URL}/favicon.ico</Image>
  <Url type="text/html" method="get" template="${SITE_URL}/search?q={searchTerms}"/>
</OpenSearchDescription>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/opensearchdescription+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
