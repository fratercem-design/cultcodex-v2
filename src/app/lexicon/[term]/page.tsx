import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata, jsonLdScript, breadcrumbListJsonLd, SITE_URL } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SectionCard } from "@/components/ui/section-card";
import {
  LEXICON,
  CATEGORY_META,
  lexiconSlug,
  getLexiconTerm,
  relatedLexiconTerms,
} from "@/app/lexicon/page";

// Each term is fully static content — prerender all of them at build time.
export const dynamic = "force-static";

export function generateStaticParams() {
  // The lexicon has a few duplicate word entries; dedupe by slug so Next never
  // receives two identical params (which would fail the build).
  const seen = new Set<string>();
  const params: { term: string }[] = [];
  for (const t of LEXICON) {
    const term = lexiconSlug(t.word);
    if (seen.has(term)) continue;
    seen.add(term);
    params.push({ term });
  }
  return params;
}

interface PageProps {
  params: Promise<{ term: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term: slug } = await params;
  const term = getLexiconTerm(slug);

  if (!term) {
    return buildMetadata({
      title: "Term Not Found",
      description: "This lexicon term could not be found.",
      path: `/lexicon/${slug}`,
    });
  }

  // Lead the title with the term itself (the actual search query) + a light
  // context qualifier so it reads as a definition in the SERP.
  const title =
    term.word.length <= 28 ? `${term.word} — Cult of Psyche Lexicon` : term.word;

  // A definition-style meta description: the term, then its meaning.
  const description = `${term.word}: ${term.definition}`.slice(0, 300);

  return buildMetadata({ title, description, path: `/lexicon/${slug}` });
}

export default async function LexiconTermPage({ params }: PageProps) {
  const { term: slug } = await params;
  const term = getLexiconTerm(slug);
  if (!term) notFound();

  const meta = CATEGORY_META[term.category];
  const related = relatedLexiconTerms(term);
  const url = `${SITE_URL}/lexicon/${slug}`;

  // schema.org DefinedTerm — the correct type for a glossary entry. Each term
  // becomes an individually indexable, near-zero-competition long-tail page.
  const definedTerm: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": url,
    name: term.word,
    description: term.definition,
    url,
    ...(term.aka && term.aka.length > 0 ? { alternateName: term.aka } : {}),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Panelverse Lexicon",
      url: `${SITE_URL}/lexicon`,
    },
  };

  const breadcrumb = breadcrumbListJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Lexicon", url: `${SITE_URL}/lexicon` },
    { name: term.word, url },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(definedTerm) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Lexicon", href: "/lexicon" },
          { label: term.word },
        ]}
      />

      <article className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${meta.dotColor}`} />
            <span className={`font-mono text-[10px] uppercase tracking-[0.3em] ${meta.color} opacity-70`}>
              {meta.label}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-text-primary">{term.word}</h1>
          {term.aka && term.aka.length > 0 && (
            <p className="text-sm text-text-muted">
              also known as <span className="text-text-primary">{term.aka.join(", ")}</span>
            </p>
          )}
        </header>

        <SectionCard title="Definition">
          <p className="text-base leading-relaxed text-text-primary">{term.definition}</p>
          {term.usage && (
            <blockquote className={`mt-4 border-l-2 ${meta.borderColor} pl-4 font-serif text-sm italic text-text-muted`}>
              {term.usage}
            </blockquote>
          )}
          {term.origin && (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-text-muted opacity-70">
              Origin: {term.origin}
            </p>
          )}
        </SectionCard>

        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Related {meta.label} terms
            </h2>
            <ul className="flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.word}>
                  <Link
                    href={`/lexicon/${lexiconSlug(r.word)}`}
                    className={`inline-block rounded-full border ${meta.borderColor} px-3 py-1 text-sm ${meta.color} transition-colors hover:bg-white/5`}
                  >
                    {r.word}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div>
          <Link
            href="/lexicon"
            className="font-mono text-[11px] uppercase tracking-widest text-accent-gold transition-colors hover:underline"
          >
            ← Back to the full lexicon
          </Link>
        </div>
      </article>
    </>
  );
}
