import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getQuotes, getQuoteCount } from "@/lib/queries/quotes";
import { IconQuote } from "@/components/graphics/codex-icons";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

export const revalidate = 300;

export const metadata = {
  title: "Quotes — CULT CODEX",
  description: "Notable quotes from Cult of Psyche episodes",
};

interface QuotesPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;

  const totalCount = await getQuoteCount();
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const quotes = await getQuotes({ take, skip });
  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const glanceItems = [
    { icon: <IconQuote size={14} />, label: `${totalCount} notable quote${totalCount !== 1 ? "s" : ""}` },
  ];

  return (
    <>
    <PageHero
      title="QUOTES"
      subtitle={
        totalCount > 0
          ? `${totalCount} notable quotes from the archive`
          : "Notable quotes from the archive"
      }
      backgroundImage="/long-form-background.jpg"
    />
    <EntityGlanceBar items={glanceItems} />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      {quotes.length === 0 ? (
        <EmptyState
          message="No quotes archived yet"
          suggestion="Quotes will be extracted during AI enrichment"
        />
      ) : (
        <>
          <div className="space-y-4">
            {quotes.map((quote) => (
              <QuoteHighlightCard
                key={quote.id}
                id={quote.id}
                text={quote.text}
                speakerName={quote.speaker?.displayName}
                speakerAvatarUrl={quote.speaker?.avatarUrl}
                timestampSeconds={quote.timestampSeconds}
              />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/quotes" />
        </>
      )}
    </main>
    </>
  );
}
