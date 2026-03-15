import { PageShell } from "@/components/ui/page-shell";
import { QuoteCard } from "@/components/archive/quote-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getQuotes, getQuoteCount } from "@/lib/queries/quotes";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

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

  return (
    <PageShell
      title="QUOTES"
      subtitle={
        totalCount > 0
          ? `${totalCount} notable quotes from the archive`
          : "Notable quotes from the archive"
      }
    >
      {quotes.length === 0 ? (
        <EmptyState
          message="No quotes archived yet"
          suggestion="Quotes will be extracted during AI enrichment"
        />
      ) : (
        <>
          <div className="grid gap-3">
            {quotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
          <PaginationControls meta={paginationMeta} basePath="/quotes" />
        </>
      )}
    </PageShell>
  );
}
