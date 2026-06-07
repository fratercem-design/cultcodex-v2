import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";

  return {
    rules: [
      // Standard crawlers — allow everything except private routes
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/admin/"],
      },

      // AI *retrieval* bots (ChatGPT Browse, Perplexity, Claude, AI Overviews) —
      // allow the public surface so we get cited as a source when people ask about
      // Cult of Psyche, guest names, lore, etc. Transcripts + Oracle are already
      // gated server-side behind auth — nothing premium leaks to these crawlers.
      {
        userAgent: [
          "GPTBot",           // OpenAI ChatGPT browsing
          "OAI-SearchBot",    // OpenAI search
          "ChatGPT-User",     // OpenAI ChatGPT
          "PerplexityBot",    // Perplexity
          "ClaudeBot",        // Anthropic Claude
          "Claude-Web",       // Anthropic Claude
          "anthropic-ai",
          "Google-Extended",  // Google Gemini / AI Overviews
        ],
        allow: [
          "/episodes/",
          "/people/",
          "/topics/",
          "/lore/",
          "/eras/",
          "/archetypes/",
          "/collections/",
          "/lexicon/",
          "/symbols/",
          "/series/",
          "/graph/",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/oracle/",          // paid AI feature — don't let them replicate it
          "/psychenomicon/",   // premium narrative content
          "/settings/",
          "/members/",
          "/cards/",
          "/salon/",
          "/red-room/",
          "/onboarding/",
          "/claim/",
          "/user/",
        ],
      },

      // AI *training* crawlers — block entirely.
      // These scrape content for LLM training datasets and contribute zero
      // search traffic or citations in return.
      {
        userAgent: [
          "CCBot",             // Common Crawl — primary LLM training source
          "Bytespider",        // TikTok/ByteDance training
          "FacebookBot",       // Meta AI training
          "Cohere-ai",
          "Diffbot",           // Data extraction service
          "omgili",
          "omgilibot",
          "peer39_crawler",
          "Scrapy",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
