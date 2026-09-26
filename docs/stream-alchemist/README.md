# Stream Alchemist

A tool for livestream hosts and podcasters. Paste a transcript and get the strongest short-form clip moments, each with:

- start and end times (when the transcript has timestamps)
- a title that doesn't overpromise
- a 2-second on-screen hook
- a YouTube Shorts description
- a TikTok / Reels caption
- thumbnail text options
- hashtags
- CSV and Markdown exports

It lives inside CultCodex as two routes and one API endpoint. It has no accounts, database tables, uploads, background jobs or billing logic yet. That's on purpose: the demo flow comes first.

| Route | What it is |
|---|---|
| `/stream-alchemist` | Landing page: benefits, a real sample clip, pricing, FAQ, CTAs |
| `/stream-alchemist/app` | The tool: paste, analyze, results, exports, upsell |
| `POST /api/stream-alchemist/analyze` | `{ transcript }` → `AnalysisResult` (see `src/lib/stream-alchemist/types.ts`) |

## Files

```
src/lib/stream-alchemist/
  transcript.ts        parses [mm:ss], hh:mm:ss, SRT, VTT, YouTube copy-paste, speaker labels, or plain text
  analyze-local.ts     the built-in engine (no API key): scores lines, picks 20–60s windows, writes copy
  analyze-claude.ts    optional Claude engine (structured output, same Clip shape)
  pricing.ts           plans, checkout links, free-tier limit (3 clips)
  export.ts            CSV (formula-safe) and Markdown
  analytics.ts         track() placeholder for the five funnel events
  demo-transcript.ts   fictional 8-minute stream used by "Paste demo transcript"
  __tests__/           parser, engine and export tests
src/components/stream-alchemist/   analyzer, clip cards, pricing cards, tracking helpers
src/app/stream-alchemist/          landing + app pages
src/app/api/stream-alchemist/      analyze route
```

## Run it locally

```bash
npm install
npm run dev
# open http://localhost:3000/stream-alchemist
npx vitest run src/lib/stream-alchemist   # tests
```

No env vars are needed. Without them:

- **Demo mode.** The built-in engine finds the clips. It runs on the server in milliseconds and costs nothing. Every title, hook and caption is quoted or trimmed from the transcript, so it can't make claims the clip doesn't back up. The trade-off is that the copy is plainer than what an LLM writes.
- **Checkout buttons** open an email to the site's contact address with the plan in the subject line ("Reserve Creator"), and the page says checkout opens soon. People can raise their hand before payments exist.

## AI mode (optional)

Set both of these in `.env.local` (or as Fly secrets in production):

```
STREAM_ALCHEMIST_AI=1
ANTHROPIC_API_KEY=sk-ant-...        # already used by other CultCodex features
```

Optional knobs: `STREAM_ALCHEMIST_MODEL` (default `claude-opus-5`), `STREAM_ALCHEMIST_EFFORT` (`low` / `medium` / `high`, default `medium`), `STREAM_ALCHEMIST_DAILY_AI_CAP` (default 100 analyses a day, site-wide).

AI mode needs its own flag, separate from the key being present. Production already has `ANTHROPIC_API_KEY` for other features, and this endpoint is public.

How AI mode is protected:

- Each caller gets 5 AI analyses a day (the shared, Postgres-backed `sharedRateLimit`), and the whole site shares a daily cap (`consumeLlmBudget`, which also respects `AI_KILLSWITCH=1`).
- When a limit is hit, or Claude errors or times out, the request **falls back to the built-in engine** with a notice. The user always gets results.
- Identical transcripts (the demo, retries) reuse the earlier result from process memory for free.
- The request uses the server-side refusal fallback (`fallbacks: "default"`), so a declined request is retried on a fallback model inside the same call.

**Cost (estimate, please measure):** a 3-hour stream is about 27k words, or roughly 36k input tokens. With Opus 5 at $5 / $25 per million tokens, a full analysis should land around $0.20–$0.50. At 20 analyses a month, that's up to about $10 of a $19 Creator plan. If real usage runs near that, setting `STREAM_ALCHEMIST_MODEL=claude-sonnet-5` cuts it by roughly 60%. Check the output quality first.

Free users only see 3 clips, but AI mode still generates all 10. That keeps one code path, and the locked cards show real timestamps and scores. If the free-tier AI spend gets noticeable, change `analyzeWithClaude(parsed, TARGET_CLIPS)` in the route to ask for fewer clips.

## Deployment

Stream Alchemist ships with CultCodex, so there's nothing extra to deploy:

1. Merge to the default branch. The usual Fly deploy picks it up.
2. There are **no Prisma migrations**. It reuses the existing `RateLimitBucket` and LLM budget tables, and only in AI mode.
3. To turn on AI mode: `fly secrets set STREAM_ALCHEMIST_AI=1` (the Anthropic key is already set).
4. `NEXT_PUBLIC_*` checkout links are inlined **at build time**, so set them as build args/env before building, or they'll stay on the email fallback.

The pages are static (`revalidate = false`). The analyze route is dynamic, runs on Node, and has `maxDuration = 120` so AI mode on long transcripts has room.

## Stripe setup (no code, no keys in the repo)

Use **Stripe Payment Links** while validating. They need no webhook, no secret key and no code.

1. In the Stripe Dashboard, switch to **Test mode**.
2. **Product catalog → Add product**:
   - "Stream Alchemist Creator", recurring $19/month
   - "Stream Alchemist Founding Lifetime", one-time $49
   - "Stream Alchemist Done-for-you clips", one-time $99
3. On each product, **Create payment link**. Under *After payment*, pick "Don't show confirmation page" and redirect to `https://cultcodex.me/stream-alchemist/app?purchased=<plan>`. Nothing reads that parameter yet, but it shows up in analytics. For done-for-you, add a custom field asking for the stream URL.
4. Put the links in the env:
   ```
   NEXT_PUBLIC_STREAM_ALCHEMIST_CREATOR_URL=https://buy.stripe.com/test_...
   NEXT_PUBLIC_STREAM_ALCHEMIST_LIFETIME_URL=https://buy.stripe.com/test_...
   NEXT_PUBLIC_STREAM_ALCHEMIST_DFY_URL=https://buy.stripe.com/test_...
   ```
   The buttons switch from "Reserve…" to "Start Creator" / "Get lifetime access" automatically.
5. Buy each one with card `4242 4242 4242 4242` and check the redirect. Then recreate the links in **live mode** and swap the env values.

**Fulfillment during validation is manual.** A purchase doesn't unlock anything in the app yet, so email buyers and run their transcripts for them. That's a feature at this stage: every buyer is a conversation. When enough people pay (see below), build accounts plus a Stripe webhook that sets the plan and usage count. Reuse the CultCodex patterns in `src/lib/stripe.ts` and `src/lib/subscription.ts` rather than starting fresh.

## Analytics events

`track()` in `src/lib/stream-alchemist/analytics.ts` sends each event to Google Analytics (only after the visitor accepts cookies through the site's existing consent banner). It also dispatches a `stream-alchemist:track` DOM event, so PostHog or Plausible can be attached later without touching call sites. In dev, events are logged to the console.

| Event | Fired when | Props |
|---|---|---|
| `sa_landing_view` | landing page mounts | none |
| `sa_demo_used` | "Paste demo transcript" clicked | none |
| `sa_analysis_started` | "Find my clips" clicked | `chars`, `demo` |
| `sa_export_clicked` | CSV or Markdown download | `format`, `clips` |
| `sa_checkout_clicked` | any paid-plan or done-for-you button | `plan`, `location` (`landing` / `results`), `live` (real checkout vs email) |

## Customer-validation plan

The question to answer before writing billing code: **will hosts pay for clip plans, or only for finished clips?**

**Week 1: 20 conversations**

- Find 30 hosts who stream or record at least weekly, have 1k–50k subscribers, and post few or no Shorts. Good places to look: YouTube live search in your niche, podcast Discords, r/podcasting, r/NewTubers.
- Offer: *"I built a tool that finds the best Shorts in a stream. Can I run your last one through it? Free. I just want to know if the clips are any good."*
- Run their transcript with AI mode on, send them the Markdown export, and ask three questions:
  1. Which of these would you actually post?
  2. What would you have to fix before posting?
  3. Would you pay $19 a month for this every week, or $99 to have the clips cut for you?

**Weeks 2–3: put the page in front of people**

- Share `/stream-alchemist` wherever the interviews found interest. Watch the funnel:
  - landing → analysis started: aim for **25%+**
  - analysis → export: aim for **40%+** (the best sign the output is useful)
  - analysis → checkout click: aim for **5%+**

**Decision at the end of week 3**

| Result | Next step |
|---|---|
| 5+ people pay or reserve (Creator or Lifetime) | Build accounts, usage counting and the Stripe webhook |
| 2+ done-for-you buyers but few self-serve | Lead with the $99 service. The tool becomes your internal editor's assistant |
| Hosts say they'd post fewer than 2 of the top 3 clips | Fix quality first: tune the Claude prompt against their feedback before selling harder |
| Under 10% of analyses export, and nobody pays | The problem isn't painful enough at this price. Talk to 10 more hosts before building anything |

## Deliberately not built yet

- Accounts, usage limits per user, and billing webhooks. Free-tier limits are shown, not enforced: anyone can run another transcript.
- File upload. Pasting covers SRT/VTT/TXT for now; a client-side "open file" button is a small next step.
- Pulling transcripts from a YouTube URL. CultCodex already has `youtube-transcript` installed, so this is the most-requested feature to expect.
- Video cutting or rendering.
