import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import {
  EDITIONS,
  HOUSES,
  HOUSE_ORDER,
  PRICING_APPROVED,
  itemsForHouse,
  productUrl,
  type House,
  type MerchItem,
} from "@/lib/merch";

export const metadata: Metadata = buildMetadata({
  title: "Vestments of the Cult — CultCodex Shop",
  description:
    "Ten designs across three houses: the Moth at the Gate, the Oracle Mask, the Codex Seal and the rest. Plus the numbered editions that cannot be printed on demand.",
  path: "/shop",
});

const HOUSE_ACCENT: Record<House, { text: string; border: string; rule: string }> = {
  signal:  { text: "text-accent-gold-text",       border: "border-accent-gold/30",   rule: "bg-accent-gold/40" },
  shadow:  { text: "text-accent-violet-text", border: "border-accent-violet/40", rule: "bg-accent-violet/50" },
  archive: { text: "text-accent-cyan",        border: "border-accent-cyan/30",   rule: "bg-accent-cyan/40" },
};

function ProductCard({ item }: { item: MerchItem }) {
  const accent = HOUSE_ACCENT[item.house];
  return (
    <a
      href={productUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col rounded-lg border ${accent.border} bg-surface transition-colors hover:border-accent-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-gold`}
    >
      <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-t-lg bg-void p-6">
        <Image
          src={item.art}
          alt={item.name}
          width={360}
          height={430}
          className="max-h-[240px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t border-border p-4">
        <p className={`font-mono text-[12px] uppercase tracking-[0.24em] ${accent.text}`}>
          {item.product}
        </p>
        <h3 className="font-serif text-lg font-bold text-text-primary">{item.name}</h3>
        <p className="flex-1 text-sm text-text-muted">{item.blurb}</p>
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-text-muted">
          {item.colourways.join(" · ")}
        </p>
        <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
          <span className="font-mono text-base tabular-nums text-accent-gold-text">${item.price}</span>
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted group-hover:text-accent-gold-text">
            View →
          </span>
        </div>
      </div>
    </a>
  );
}

export default function ShopPage() {
  return (
    <>
      <PageHero
        title="VESTMENTS OF THE CULT"
        subtitle="Ten designs, three houses, and the editions that cannot be reprinted"
        backgroundImage="/hero-bg.jpg"
        label="the shop"
      />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 space-y-14">
        {!PRICING_APPROVED && (
          <div className="rounded-lg border border-accent-sulphur/40 bg-accent-sulphur/5 px-4 py-3 font-mono text-[12px] text-text-muted">
            <span className="text-accent-sulphur">Coming soon —</span> the designs below are
            final, but the store is not open yet. Prices are provisional and the product links
            go live when the shop opens.
          </div>
        )}

        <p className="max-w-3xl text-text-muted">
          Every mark here is drawn as vector, in the same palette as the rest of this archive.
          Printing and shipping run through Fourthwall; the numbered editions below are made by
          hand and are not print-on-demand.
        </p>

        {HOUSE_ORDER.map((house) => {
          const meta = HOUSES[house];
          const accent = HOUSE_ACCENT[house];
          const items = itemsForHouse(house);
          return (
            <section key={house} aria-labelledby={`house-${house}`}>
              <div className="mb-6 border-t border-border pt-5">
                <a
                  href={meta.href}
                  target={meta.href.startsWith("http") ? "_blank" : undefined}
                  rel={meta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`font-mono text-[12px] uppercase tracking-[0.24em] ${accent.text} hover:underline`}
                >
                  {meta.handle}
                </a>
                <h2
                  id={`house-${house}`}
                  className="mt-2 font-serif text-2xl font-black tracking-tight text-text-primary"
                >
                  {meta.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">{meta.blurb}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ProductCard key={item.slug} item={item} />
                ))}
              </div>
            </section>
          );
        })}

        <section aria-labelledby="editions" className="border-t border-border pt-5">
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-accent-sulphur">
            made by hand
          </p>
          <h2
            id="editions"
            className="mt-2 font-serif text-2xl font-black tracking-tight text-text-primary"
          >
            The Numbered Editions
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Print on demand cannot make a thing scarce. These are made one at a time, in runs, and
            when a run is gone it is gone.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {EDITIONS.map((ed) => (
              <article
                key={ed.name}
                className="rounded-lg border border-border border-t-2 border-t-accent-sulphur/60 bg-surface p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-serif text-lg font-bold text-text-primary">{ed.name}</h3>
                  <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-sulphur">
                    {ed.run}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-muted">{ed.blurb}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 font-mono text-[12px] text-text-muted">
            Editions are enquiry-only —{" "}
            <Link href="/contact" className="text-accent-gold-text hover:underline">
              get in touch
            </Link>{" "}
            for availability.
          </p>
        </section>
      </main>
    </>
  );
}
