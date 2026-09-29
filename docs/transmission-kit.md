# Transmission Kit

A productized service sold at [`/kit`](https://cultcodex.me/kit). A tarot or astrology streamer sends a live replay. Within 48 hours they get YouTube chapters, 10 clip moments with timestamps, a searchable description, tags and 5 Shorts hooks.

The site takes the order and the payment. You deliver the kit by email, with an optional script that writes the first draft.

## How it works

1. **The visitor picks a plan on `/kit`** and enters their email and replay link.
2. **`POST /api/kit/checkout`** creates a Stripe Checkout Session with inline prices, so nothing needs to be set up in the Stripe dashboard. The plan and replay link ride along in the session metadata.
3. **The buyer pays on Stripe** and lands on `/kit/thanks`, which checks with Stripe before it says the payment went through.
4. **Stripe calls `/api/stripe/webhook`.** Its kit branch emails you the order (plan, amount, buyer, replay link, Stripe link) and sends the buyer a confirmation. When you reply to your email it goes straight to the buyer.
5. **You run `npm run kit:draft`,** edit the draft, and reply to the order email with the finished kit.

Free-pilot requests from the form at `/kit#pilot` reach you the same way, by email with Reply-To set to the applicant.

There's no database table and no migration. **Stripe is the order record**, and your inbox is the work queue.

| Piece | File |
|---|---|
| Landing page | `src/app/kit/page.tsx` |
| Plans, FAQ, sample kit | `src/lib/kit/sample-kit.ts` |
| Order form, pilot form, sample tabs | `src/components/kit/` |
| Checkout validation and session params | `src/lib/kit/checkout.ts` |
| Checkout API | `src/app/api/kit/checkout/route.ts` |
| Thank-you page | `src/app/kit/thanks/page.tsx` |
| Order emails (called from the webhook) | `src/lib/kit/fulfillment.ts`, `src/lib/notifications.ts` |
| Pilot API | `src/app/api/kit/pilot/route.ts`, `src/lib/kit/pilot.ts` |
| Draft script | `scripts/kit-draft.ts`, `src/lib/kit/draft.ts` |

## Setup

### Environment variables

Everything reuses keys the site already has:

| Variable | Used for | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | Checkout sessions, thank-you page check | Yes |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature check | Yes |
| `RESEND_API_KEY` | Order, confirmation and pilot emails | Yes |
| `NEXTAUTH_URL` | Success and cancel URLs (falls back to `https://cultcodex.me`) | Yes in production |
| `KIT_ADMIN_EMAIL` | Where order and pilot notices go (defaults to psychetarotchannel@gmail.com) | No |
| `ANTHROPIC_API_KEY` | `kit:draft` only, run locally from `.env.local` | Only for the draft script |
| `KIT_DRAFT_MODEL` / `KIT_DRAFT_EFFORT` | Draft script model (`claude-opus-5`) and effort (`high`) | No |

### Stripe dashboard (one-time)

1. **Webhook:** the existing endpoint at `https://cultcodex.me/api/stripe/webhook` must send `checkout.session.completed`. It already does for claps, books and credits.
2. **Founding price:** go to Products → Coupons, create a $10-off coupon, then add a **promotion code `FOUNDING`** with max redemptions set to 10. Checkout has promotion codes turned on, so the $29 Single Kit becomes $19 for the first 10 buyers. The code isn't limited to one plan, so it also takes $10 off a subscription's first month.
3. **Self-serve cancelling:** under Settings → Billing → Customer portal, turn on the login link. Monthly buyers can then cancel on their own; the FAQ promises this.
4. **Payment emails** (optional backup): Settings → Team and security → Communication preferences → Successful payments.

### Test before announcing

1. In Stripe **test mode**, open `/kit`, pick a plan and pay with card `4242 4242 4242 4242`.
2. Check that you land on "You're in", that the order email reaches you, and that the confirmation reaches the buyer address.
3. Submit the pilot form and check that the email arrives.
4. Switch to live keys and do the same with one real $19 purchase using `FOUNDING`, then refund it in Stripe.

## Delivering a kit

```bash
# YouTube replay (uses its captions; auto-generated is fine)
npm run kit:draft -- https://youtube.com/live/VIDEO_ID

# Rumble, Twitch or anything else: download the .srt and pass it
npm run kit:draft -- --srt replay.srt --title "Sunday reading"
```

- The draft lands in `kit-drafts/<id>-<date>.md`. That folder is gitignored because it holds buyer content.
- It costs roughly $0.30–0.80 per 3-hour stream.
- **Always review before sending.** Check that the clip moments land where the draft says, and fix any card names the captions misheard.
- Paste the result into your reply to the order email.
- **If YouTube refuses the captions** (it sometimes blocks server and cloud IPs, and some videos have captions off), download the captions as `.srt` and use `--srt`.
- **If the draft stops with "ran out of output room"**, rerun with `KIT_DRAFT_EFFORT=medium`.

**Monthly subscribers** reply to their confirmation email with each new replay link. Keep their thread and run the script per stream.

**Turnaround:** the page promises 48 hours for a Single Kit and 24 hours on monthly plans.

## Monetization notes

| Plan | Price | What it is |
|---|---|---|
| Single Kit | $29 one-time ($19 with `FOUNDING`, first 10) | One stream up to 3h |
| Weekly Live | $79/mo | 4 streams a month, 24h turnaround |
| Done For You | $249/mo | 8 streams, plus 5 edited Shorts and title options a month |

- **Change prices** in `KIT_PLANS` in `src/lib/kit/sample-kit.ts`. Checkout reads from there, so no Stripe changes are needed.
- **Margin:** at about $0.50 in API cost and 15–25 minutes of editing, a Single Kit is almost all margin. Done For You includes edited Shorts; set aside real editing time before selling many of those.
- **Replace the sample kit.** The one on the page is illustrative. Once a pilot or buyer agrees, swap in a real kit (`SAMPLE_KIT` in `sample-kit.ts`), because real examples sell better.
- **Watch for:** visits to `/kit`, checkouts started versus paid (in the Stripe dashboard), and replies to pilot kits. A first target is 3 paid kits and 1 subscriber in the first week.
- **Refunds:** the FAQ promises a redo or a refund within 7 days. Refund through the Stripe dashboard.

## Not built yet (on purpose)

There are no accounts, no order dashboard, no automatic delivery, no video editing and no database. Add them only once real orders show the manual workflow can't keep up.
