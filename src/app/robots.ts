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
      // AI training crawlers — block entirely
      // These bots scrape content for LLM training datasets without contributing
      // any search traffic back to the site.
      {
        userAgent: [
          "GPTBot",           // OpenAI
          "ChatGPT-User",     // OpenAI ChatGPT browsing
          "OAI-SearchBot",    // OpenAI search
          "Claude-Web",       // Anthropic
          "ClaudeBot",        // Anthropic
          "anthropic-ai",     // Anthropic
          "PerplexityBot",    // Perplexity
          "Cohere-ai",        // Cohere
          "CCBot",            // Common Crawl (used by many AI trainers)
          "FacebookBot",      // Meta AI
          "Google-Extended",  // Google Bard/Gemini training
          "Bytespider",       // TikTok/ByteDance
          "Diffbot",          // Data extraction
          "omgili",           // Data harvesting
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

