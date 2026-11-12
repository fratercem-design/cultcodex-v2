import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("GET /opensearch.xml", () => {
  it("describes the site search with a {searchTerms} template", async () => {
    const res = GET();
    const xml = await res.text();

    expect(res.headers.get("Content-Type")).toContain("application/opensearchdescription+xml");
    expect(xml).toContain("<ShortName>CultCodex</ShortName>");
    expect(xml).toMatch(/template="https?:\/\/[^"]+\/search\?q=\{searchTerms\}"/);
  });
});
