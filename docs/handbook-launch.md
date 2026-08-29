# Launching The Cult Master's Handbook

Status as of 2026-08-22. Everything below the "Decisions" line is yours; everything
above it is done and verified locally.

## What is already built

| Piece | State |
|---|---|
| Manuscript | Complete — 10 volumes, 50,442 words, in `OneDrive\...\Cult of Psyche\Handbook\` |
| PDF | Already existed — 202 pages, Chrome-rendered, editor notes confirmed absent |
| EPUB | Built by `scripts/handbook/build-epub.mjs` — valid EPUB 3, verified |
| Sales page | `src/app/handbook/page.tsx` — renders, price-gated (see below) |
| Checkout | SKU `cult-masters-handbook` registered in `src/app/api/stripe/book-checkout/route.ts` |
| Purchase + delivery | **No code needed** — `BookPurchase` / `BookEdition` / `/api/psychenomicon/book/[sku]` already handle one-time book sales generically |

Rebuild the EPUB any time with:

```bash
node scripts/handbook/build-epub.mjs
```

## Decisions and steps that are yours

### 1. Set the price

`src/app/handbook/page.tsx` has `const PRICE_USD = 0`. While it is 0 the page shows
"Coming soon" and renders no buy button — a placeholder price cannot reach a customer.
Set it to the agreed figure.

Drafted options (unapproved): **$19** impulse · **$39** recommended · **$39 + $69**
annotated edition. Reasoning is in the conversation; the number is yours.

### 2. Create the Stripe product

In the Stripe dashboard, **Products → Add product**:

- Name: `The Cult Master's Handbook`
- Pricing model: **One-time**, not recurring
- Price: the figure from step 1, USD
- Copy the resulting **price ID** (`price_...`) — not the product ID (`prod_...`)

### 3. Set the env var in Vercel

- Key: `STRIPE_PRICE_BOOK_HANDBOOK_ID`
- Value: the `price_...` from step 2
- Environments: Production (and Preview if you want to test there)

**Then redeploy.** The Stripe client is initialised at module scope, so a newly added
env var is not picked up by already-running instances. If you see
"Price not configured (STRIPE_PRICE_BOOK_HANDBOOK_ID)" after setting it, redeploy
before debugging anything else.

### 4. Load the edition into the database

The serve route streams `BookEdition.data` out of Postgres, so the file has to be in
the DB — a file on disk is not enough. There is no admin route for the Handbook yet
(`/api/admin/build-book` is Psychenomicon-specific); either extend it or upsert once
from a script with a working `DATABASE_URL`:

```
sku:      cult-masters-handbook
title:    The Cult Master's Handbook
mimeType: application/pdf
data:     <bytes of The-Cult-Masters-Handbook.pdf>
pageCount: 202
```

### 5. Verify end to end before announcing

1. Sign in on production, visit `/handbook`, confirm the price and buy button appear.
2. Buy it with a Stripe **test** card if you can, or make one real purchase yourself.
3. Confirm the download link appears and the PDF opens.
4. Check a `BookPurchase` row exists for your user + sku.

## Known gap: EPUB delivery

`BookEdition` holds **one** blob per SKU, and the serve route hardcodes
`filename="<sku>.pdf"`. So the current flow can deliver the PDF *or* the EPUB, not both.

Three options, cheapest first:

1. **Ship PDF only** for now. Nothing to build; the EPUB waits.
2. **Companion edition row** — store the EPUB under sku `cult-masters-handbook-epub`,
   and teach the serve route to accept `?format=epub`: look up the companion row for
   the bytes, but keep checking entitlement against the *base* sku so one purchase
   covers both. Roughly a five-line change to
   `src/app/api/psychenomicon/book/[sku]/route.ts`, plus the correct filename extension.
3. **Schema change** — a proper `BookAsset` table keyed by sku + format. Cleanest,
   most work, and only worth it if you expect several books in several formats.

Option 2 is the pragmatic one and needs no migration. I did not implement it because it
touches the payment-gated delivery path on production and you should decide the shape first.

## Legal, before the first live charge

`midas` flagged and I agree: selling digital goods into the EU/UK triggers
VAT-on-digital-services obligations regardless of volume. Confirm with an accountant
whether Stripe Tax covers you. There are already `/legal` Privacy, Terms, and Refund
pages on the site — check the Refund policy actually covers one-time digital purchases,
not just subscriptions.
