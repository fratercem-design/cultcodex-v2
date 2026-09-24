import { jsonLdScript } from "@/lib/seo";

/**
 * Render a schema.org JSON-LD block. Serialization goes through
 * jsonLdScript(), which escapes `<`, `>`, `&` and the U+2028/U+2029
 * separators — a value containing `</script>` cannot break out of the
 * script element (plain JSON.stringify would be an XSS vector for any
 * user- or CMS-sourced field).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  );
}
