# Page Inventory — CultCodex.me

**Crawled 2026-09-09 against production** (`origin/master` @ `6ba2a50`, pre-remediation). 367 fetches over 357 unique URLs: all 134 static routes, a 173-URL stratified sample across 37 sitemap segments, and a 60-URL random sample of psychenomicon chapters. **Every fetch returned HTTP 200.**

> Statuses below are **as audited**. Several were changed by [#157](https://github.com/fratercem-design/cultcodex-v2/pull/157) — see ISSUES.md for current state. The `no-canon` / `no-h1` flags on `/psychenomicon/*` in particular are now fixed.

## Scale

| Measure | At audit | Now |
|---|---|---|
| Sitemap URLs | 31,797 | **28,875** |
| Sitemap size (uncompressed) | 6.1 MB | 5.6 MB |
| `page.tsx` routes | 162 | — |
| `route.ts` API endpoints | 92 | — |
| React components | 195 | — |
| Top-level route segments | 84 | — |
| Source lines (`src/`, incl. generated) | 243,158 | — |

## Sitemap composition (at audit)

| Segment | URLs | % | Content health |
|---|---|---|---|
| `/topics/*` | 13,743 | 43.2% | **Thin** — 1,676-char median |
| `/lore/*` | 10,453 | 32.9% | Healthy |
| `/psychenomicon/*` | 2,991 | 9.4% | **Sealed** — now 3 in sitemap |
| `/episodes/*` | 2,982 | 9.4% | **Healthy** — 6,830-char median |
| `/people/*` | 1,539 | 4.8% | Healthy |
| `/symbols/*` | 21 | 0.1% | Missing canonicals |
| `/series/*` | 16 | 0.1% | Good |
| `/archetypes/*` | 9 | <0.1% | Missing canonicals |
| static / other | ~43 | 0.1% | — |

## Aggregate metadata health (367 pages, at audit)

| Check | Result |
|---|---|
| HTTP 200 | **367 / 367** |
| Missing `<title>` | **0** |
| Missing meta description | **0** |
| Missing `og:title` | **0** |
| Missing `twitter:card` | **0** |
| Missing `og:image` | 19 |
| Missing canonical | **90** |
| Missing `<h1>` | **75** (50 admin/auth/settings + 25 chapters) |
| Multiple `<h1>` | **0** |
| Missing `<main>` | 3 |
| Missing `lang` | **0** |
| `<img>` without `alt` | **0** |
| Description > 160 chars | 118 |
| Description < 70 chars | 45 |

## Genuine duplicate titles

Only one real cluster outside admin. (The apparent `/episodes` + `/episodes` pairs were the same URL sampled by two crawl passes, not duplicates — a crawler artifact, not a finding.)

| Count | Title | Paths |
|---|---|---|
| 10 | `Admin — CULT CODEX` | `/admin`, `/admin/cards`, `/admin/comments`, `/admin/data-ops`, … |
| 5 | `CultCodex — The Living Archive` | `/auth/error`, `/auth/signin`, `/cards/vault`, `/nightmare-frequencies` |

Admin is `noindex, nofollow`, so only the second cluster matters — `/cards/vault` and `/nightmare-frequencies` are indexable and share a generic fallback title.

## Not-found behaviour

**At audit:** all ten content types returned HTTP 200 for nonexistent slugs. **Now:** all return 404 (verified live).

| Probe | At audit | Now |
|---|---|---|
| `/this-page-does-not-exist-12345` | 404 ✅ | 404 ✅ |
| `/EPISODES` | 404 ✅ | 404 ✅ |
| `/episodes/zzz-404` | **200** ❌ | **404** ✅ |
| `/topics/zzz-404` | **200** ❌ | **404** ✅ |
| `/people/zzz-404` | **200** ❌ | **404** ✅ |
| `/lore/zzz-404` | **200** ❌ | **404** ✅ |
| `/symbols/zzz-404` | **200** ❌ | **404** ✅ |
| `/series/zzz-404` | **200** ❌ | not re-tested |
| `/archetypes/zzz-404` | **200** ❌ | not re-tested |
| `/collections/zzz-404` | **200** ❌ | not re-tested |
| `/eras/zzz-404` | **200** ❌ | not re-tested |
| `/psychenomicon/chapters/chapter-999999` | **200** ❌ | **404** ✅ |

## Redirects

| From | Status | To |
|---|---|---|
| `http://cultcodex.me/` | 308 | `https://cultcodex.me/` |
| `https://www.cultcodex.me/` | **307** | `https://cultcodex.me/` (Vercel platform, not middleware) |
| `http://www.cultcodex.me/` | 308 | `https://www.cultcodex.me/` then 307 — **2 hops** |
| `https://cultcodex.me/episodes/` | 308 | `/episodes` |
| `/pricing` | 308 | `/premium` |

## External links — all tested

| Target | Status |
|---|---|
| `matangi.vercel.app` | 200 ✅ |
| `dreamweave-darktales.vercel.app` | 200 ✅ |
| `living-grimoire.vercel.app` | 200 ✅ |
| `cultos-zeta.vercel.app` | 200 ✅ |
| `tools.google.com/dlpage/gaoptout` | 200 ✅ |
| `github.com/fratercem-design/cultcodex-v2/issues` | **404** ❌ (from `/corrections` — private repo) |
| 10 × `cultofpsyche.fourthwall.com/products/*` | **404** ❌ (from `/shop`, disclosed as pre-launch) |

230 distinct `youtube.com` links were catalogued but not individually status-checked (rate-limiting risk). Some fraction are likely dead across a 3,000-episode archive — worth a batched check.

## Full inventory

Admin routes omitted (25 rows, all `noindex, nofollow`). `textLen` = visible characters with markup and scripts stripped.

| URL | Status | Title | textLen | Structured data | Flags |
|---|---|---|---|---|---|
| `/` | 200 | CultCodex — The Archive of Cult of Psyche | Tarot, Conscio | 6846 | WebSite, Organization | desc>160 |
| `/about` | 200 | About CultCodex — The Cult of Psyche Archive — CultCodex | 4079 | WebSite | ok |
| `/about/methodology` | 200 | How CultCodex Works — Methodology & Transparency — CultCod | 3730 | WebSite | no-og-img |
| `/appear` | 200 | Appear on the Show — CultCodex | 3151 | WebSite | ok |
| `/archetype-quiz` | 200 | Discover Your Archetype — CultCodex | 1848 | WebSite | no-og-img, thin, desc>160 |
| `/archetypes` | 200 | Archetypes — CULT CODEX | 2593 | WebSite | ok |
| `/archetypes/alchemist` | 200 | The Alchemist — Archetypes — CULT CODEX | 1889 | WebSite | no-canon, thin |
| `/archetypes/architect` | 200 | The Architect — Archetypes — CULT CODEX | 1915 | WebSite | no-canon, thin |
| `/archetypes/exile` | 200 | The Exile — Archetypes — CULT CODEX | 1919 | WebSite | no-canon, thin |
| `/archetypes/familiar` | 200 | The Familiar — Archetypes — CULT CODEX | 1904 | WebSite | no-canon, thin |
| `/archetypes/mirror-walker` | 200 | The Mirror Walker — Archetypes — CULT CODEX | 1915 | WebSite | no-canon, thin |
| `/archetypes/oracle` | 200 | The Oracle — Archetypes — CULT CODEX | 1887 | WebSite | no-canon, thin |
| `/archetypes/prophet` | 200 | The Prophet — Archetypes — CULT CODEX | 1926 | WebSite | no-canon, thin |
| `/archetypes/trickster` | 200 | The Trickster — Archetypes — CULT CODEX | 1936 | WebSite | no-canon, thin |
| `/articles` | 200 | Articles — CULT CODEX | 2833 | WebSite | ok |
| `/auth/error` | 200 | CultCodex — The Living Archive | 1423 | WebSite | no-canon, no-h1, thin, desc>160 |
| `/auth/signin` | 200 | CultCodex — The Living Archive | 1499 | WebSite | no-canon, thin, desc>160 |
| `/auth/verify` | 200 | Verifying — CULT CODEX | 1341 | WebSite | no-canon, no-h1, thin, desc>160 |
| `/basement` | 200 | ░░░░░░ — CULT CODEX | 2060 | WebSite | ok |
| `/bestiary` | 200 | The Bestiary — CULT CODEX | 12781 | WebSite | ok |
| `/cards` | 200 | Signal Archive — CultCodex | 67551 | WebSite | ok |
| `/cards/decks` | 200 | Signal Arrays — CultCodex | 1335 | WebSite | no-h1, thin |
| `/cards/grimoire` | 200 | The Grimoire — Your Readings — CultCodex | 1535 | WebSite | thin |
| `/cards/packs` | 200 | Open Card Packs — CultCodex | 1657 | WebSite | no-canon, no-og-img, thin |
| `/cards/reading` | 200 | The Oracle — Draw a Reading — CultCodex | 1752 | WebSite | thin |
| `/cards/vault` | 200 | CultCodex — The Living Archive | 1340 | WebSite | no-canon, no-h1, thin, desc>160 |
| `/claps` | 200 | Clap Tokens — #cultofpsyche — CultCodex | 1657 | WebSite | no-og-img, thin |
| `/codex` | 200 | My Codex — CULT CODEX | 1323 | WebSite | no-h1, thin |
| `/codex/quotes` | 200 | Saved Quotes — CULT CODEX | 1336 | WebSite | no-h1, thin |
| `/codex/signals` | 200 | Saved Signals — CULT CODEX | 1338 | WebSite | no-canon, no-h1, thin |
| `/codex/transmissions` | 200 | Saved Transmissions — CULT CODEX | 1350 | WebSite | no-h1, thin |
| `/collections` | 200 | Collections — CULT CODEX | 4561 | WebSite | ok |
| `/contact` | 200 | Contact — CULT CODEX | 1981 | WebSite | thin |
| `/content-policy` | 200 | Content Policy — CULT CODEX | 3362 | WebSite | ok |
| `/corrections` | 200 | Corrections — CULT CODEX | 2468 | WebSite | ok |
| `/cult-live` | 200 | Cult Live — CultCodex | 6472 | WebSite | ok |
| `/dossier` | 200 | TX-001 // CultCodex Visual Audit + Redesign Dossier | 40567 | WebSite | no-canon, no-h1 |
| `/drama` | 200 | The Drama Files — CULT CODEX | 4447 | WebSite | desc>160 |
| `/draw` | 200 | Draw from the Deck — CULT CODEX | 2474 | WebSite | ok |
| `/draw/today` | 200 | Today's Draw — CULT CODEX | 2208 | WebSite | ok |
| `/episodes` | 200 | Episodes — CULT CODEX | 10293 | WebSite | desc>160 |
| `/episodes/can-you-feel-the-energy-in-this-place-ancient-sanskrit-heart-hymn` | 200 | CultCodex sigil | 7174 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/do-this-when-you-start-over` | 200 | CultCodex sigil | 7409 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/esoteric-philosophy` | 200 | CultCodex sigil | 7741 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/found-my-headphone` | 200 | CultCodex sigil | 6529 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/godbodys-primal-life-godbody-reigns-https-www-youtube-com-godbody-reigns` | 200 | CultCodex sigil | 8768 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/humorous-sibling-banter-and-its-role-in-relationships` | 200 | CultCodex sigil | 6279 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/i-m-back-on-my-main-channel-join-there` | 200 | CultCodex sigil | 6701 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/lalitha-tripura-sundari-the-beauty-of-the-three-worlds` | 200 | CultCodex sigil | 7808 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/make-sure-to-see-my-appearance-on-alexandramayers-today-12-pst` | 200 | CultCodex sigil | 6830 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/no-surrender-powerful-chorus-moment` | 200 | CultCodex sigil | 6314 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/red-discovers-her-grandmother-is-a-simulation` | 200 | CultCodex sigil | 7164 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/sammans-balloon-animal-showdown-who-has-the-best-expression` | 200 | CultCodex sigil | 6376 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/saturday-night-special-open-panel-tarot-and-cats` | 200 | CultCodex sigil | 7126 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/tarot-trolling-total-mayhem-open-panel-tarot-and-cats` | 200 | CultCodex sigil | 6893 | WebSite, VideoObject, BreadcrumbList | ok |
| `/episodes/the-amazing-capricorn` | 200 | CultCodex sigil | 6811 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/the-golden-ass-book-5-cupid-and-psyche-the-betrayal` | 200 | CultCodex sigil | 7636 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/the-grinch-analogy-real-life-scumbags` | 200 | CultCodex sigil | 6488 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/the-pattern-that-destroys-every-cult-from-within` | 200 | CultCodex sigil | 7009 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/this-false-claim-nearly-ended-his-career-drama-storytime` | 200 | CultCodex sigil | 6265 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/urgent-protecting-our-community-immediate-action-needed` | 200 | CultCodex sigil | 6728 | WebSite, VideoObject, BreadcrumbList | ok |
| `/episodes/welcome-to-psyche-awakens-a-unique-online-experience` | 200 | CultCodex sigil | 5571 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/whimsical-wednesday-night-open-panel-tarot-and-cats` | 200 | CultCodex sigil | 6985 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/why-ill-defend-you-against-online-bullies` | 200 | CultCodex sigil | 5748 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/episodes/youtube-trolls-reacting-to-the-hate-finding-peace` | 200 | CultCodex sigil | 6033 | WebSite, VideoObject, BreadcrumbList | desc>160 |
| `/eras` | 200 | Eras of the Archive — CULT CODEX — CultCodex | 2231 | WebSite | no-og-img, desc>160 |
| `/explore` | 200 | Explore the Archive — Tarot, Consciousness, Occult, AI & M | 2711 | WebSite | desc>160 |
| `/faq` | 200 | FAQ — CultCodex — CultCodex | 4110 | WebSite, FAQPage | ok |
| `/favorites` | 200 | My Favorites — CultCodex | 1330 | WebSite | no-h1, thin, desc>160 |
| `/from-youtube` | 200 | You followed the signal — CultCodex, the memory of Cult of | 3726 | WebSite | no-og-img, desc>160 |
| `/fun` | 200 | The Fun Wing — CULT CODEX | 7369 | WebSite | ok |
| `/gameshow` | 200 | The Panelverse Game Show — CULT CODEX | 1730 | WebSite | thin |
| `/gift/gospel` | 200 | Your Gospel — CultCodex | 1807 | WebSite | thin |
| `/graph` | 200 | Relationship Map — CULT CODEX | 3831 | WebSite | ok |
| `/graph/path` | 200 | Connection Paths — The Network — CULT CODEX — CultCodex | 4445 | WebSite | no-og-img |
| `/guide` | 200 | The Cult Master's Guide — CULT CODEX — CultCodex | 8720 | WebSite | no-og-img |
| `/handbook` | 200 | The Cult Master's Handbook — CultCodex | 3263 | WebSite | ok |
| `/initiate` | 200 | Become an Initiate — CULT CODEX — CultCodex | 3216 | WebSite | no-og-img |
| `/join` | 200 | Join the Cult — CultCodex | 3020 | WebSite | ok |
| `/leaderboard` | 200 | The Ascendant — Rank Leaderboard — CultCodex | 1803 | WebSite | thin |
| `/lexicon` | 200 | Panelverse Lexicon — CULT CODEX | 187266 | WebSite | ok |
| `/live` | 200 | Live — CultCodex | 1513 | WebSite | thin |
| `/lore` | 200 | Lore — CULT CODEX | 6850 | WebSite, CollectionPage | desc>160 |
| `/lore/capricorn-and-aquarius` | 200 | CultCodex sigil | 2213 | WebSite, Article, BreadcrumbList | ok |
| `/lore/caring-too-much` | 200 | CultCodex sigil | 2318 | WebSite, Article, BreadcrumbList | ok |
| `/lore/cats-and-the-spiritual-realm` | 200 | CultCodex sigil | 2437 | WebSite, Article, BreadcrumbList | ok |
| `/lore/community-feuds-bullying-allegations` | 200 | CultCodex sigil | 2519 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/conditional-support-cycles` | 200 | CultCodex sigil | 2142 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/conviction-vs-accusation` | 200 | CultCodex sigil | 2037 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/emmas-discord-interaction` | 200 | CultCodex sigil | 2315 | WebSite, Article, BreadcrumbList | ok |
| `/lore/jinn-summoning-as-harassment-mechanism` | 200 | CultCodex sigil | 2050 | WebSite, Article, BreadcrumbList | ok |
| `/lore/late-night-transmissions` | 200 | CultCodex sigil | 2089 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/liber-al-vel-legis-book-of-the-law` | 200 | CultCodex sigil | 2161 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/literary-tarot-deck` | 200 | CultCodex sigil | 1938 | WebSite, Article, BreadcrumbList | thin |
| `/lore/machiavellis-principle-of-decisive-action` | 200 | CultCodex sigil | 2130 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/marbles-the-intermittent-cat` | 200 | CultCodex sigil | 2144 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/mirror-eyes-self-awareness-in-storm` | 200 | CultCodex sigil | 2385 | WebSite, Article, BreadcrumbList | ok |
| `/lore/opposite-schedule-streaming` | 200 | CultCodex sigil | 2069 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/performative-accountability-culture` | 200 | CultCodex sigil | 2218 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/psyche-as-psychic-cat-daddy-king-of-the-stream` | 200 | CultCodex sigil | 2259 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/psychenomicon` | 200 | The Psychenomicon -- CULT CODEX | 2880 | WebSite | ok |
| `/lore/shadowbanning-and-digital-erasure` | 200 | CultCodex sigil | 2257 | WebSite, Article, BreadcrumbList | ok |
| `/lore/silencing-tactics-coordinated-harassment` | 200 | CultCodex sigil | 2570 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/the-bodhisattva-monkey` | 200 | CultCodex sigil | 1977 | WebSite, Article, BreadcrumbList | thin |
| `/lore/the-kate-dispute` | 200 | CultCodex sigil | 2318 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/the-pilgrims-death-story` | 200 | CultCodex sigil | 2126 | WebSite, Article, BreadcrumbList | desc>160 |
| `/lore/the-q-army` | 200 | CultCodex sigil | 2147 | WebSite, Article, BreadcrumbList | ok |
| `/lore/trolls-get-tried` | 200 | CultCodex sigil | 2048 | WebSite, Article, BreadcrumbList | desc>160 |
| `/media-kit` | 200 | Media Kit — CultCodex | 3078 | WebSite | ok |
| `/members` | 200 | Member Roll — CultCodex | 2455 | WebSite | ok |
| `/meow` | 200 | 🐱 — CULT CODEX | 1580 | WebSite | no-h1, thin |
| `/methodology` | 200 | Methodology — CULT CODEX | 3770 | WebSite | ok |
| `/mythic-map` | 200 | The Mythic Map — CULT CODEX | 9109 | WebSite | ok |
| `/nightmare-frequencies` | 200 | CultCodex — The Living Archive | 1348 | WebSite | no-canon, no-h1, thin, desc>160 |
| `/onboarding` | 200 | Initiation — CultCodex | 2056 | WebSite | no-h1, desc>160 |
| `/onboarding/procedure` | 200 | The First Gate Procedure — CULT CODEX — CultCodex | 14012 | WebSite | no-og-img, desc>160 |
| `/oracle` | 200 | Ask the Oracle — AI Search — CULT CODEX | 3704 | WebSite | desc>160 |
| `/oracle/share` | 200 | The Oracle Speaks — CULT CODEX | 1481 | WebSite | no-canon, thin |
| `/people` | 200 | People — CULT CODEX | 6002 | WebSite, CollectionPage | ok |
| `/people/alexandra-alexander-mcqueen` | 200 | Alexandra (Alexander McQueen) — CultCodex | 4750 | WebSite, Person, BreadcrumbList | desc>160 |
| `/people/ashante` | 200 | Ashante — CultCodex | 1994 | WebSite, Person, BreadcrumbList | thin |
| `/people/ashley-anderson` | 200 | Ashley Anderson — CultCodex | 3889 | WebSite, Person, BreadcrumbList | ok |
| `/people/bea` | 200 | Bea — CultCodex | 11798 | WebSite, Person, BreadcrumbList | desc>160 |
| `/people/beata` | 200 | Beata — CultCodex | 4472 | WebSite, Person, BreadcrumbList | desc>160 |
| `/people/beda` | 200 | Beda — CultCodex | 4666 | WebSite, Person, BreadcrumbList | ok |
| `/people/benny` | 200 | Benny — CultCodex | 4203 | WebSite, Person, BreadcrumbList | ok |
| `/people/bita` | 200 | Bita — CultCodex | 7110 | WebSite, Person, BreadcrumbList | desc>160 |
| `/people/christopher-marlowe` | 200 | Christopher Marlowe — CultCodex | 4310 | WebSite, Person, BreadcrumbList | ok |
| `/people/danger-ranger` | 200 | Danger Ranger — CultCodex | 3691 | WebSite, Person, BreadcrumbList | ok |
| `/people/douggee` | 200 | Douggee — CultCodex | 4005 | WebSite, Person, BreadcrumbList | ok |
| `/people/eugenia-cooney` | 200 | Eugenia Cooney — CultCodex | 3693 | WebSite, Person, BreadcrumbList | ok |
| `/people/ghosttyler` | 200 | Ghost/Tyler — CultCodex | 3803 | WebSite, Person, BreadcrumbList | ok |
| `/people/gordon-lightfoot` | 200 | Gordon Lightfoot — CultCodex | 3964 | WebSite, Person, BreadcrumbList | ok |
| `/people/guest` | 200 | Guest — CultCodex | 6571 | WebSite, Person, BreadcrumbList | ok |
| `/people/jay-dogalex` | 200 | Jay Dog/Alex — CultCodex | 4386 | WebSite, Person, BreadcrumbList | ok |
| `/people/jc` | 200 | JC — CultCodex | 3702 | WebSite, Person, BreadcrumbList | ok |
| `/people/ld-ld15` | 200 | LD (LD15) — CultCodex | 4213 | WebSite, Person, BreadcrumbList | desc>160 |
| `/people/max-extreme` | 200 | Max Extreme — CultCodex | 2710 | WebSite, Person, BreadcrumbList | ok |
| `/people/pizza` | 200 | Pizza — CultCodex | 4446 | WebSite, Person, BreadcrumbList | ok |
| `/people/sweet-p` | 200 | Sweet P — CultCodex | 3725 | WebSite, Person, BreadcrumbList | ok |
| `/people/the-rest` | 200 | The Rest — Voices — CultCodex | 3497 | WebSite | desc>160 |
| `/people/unnamed-voice` | 200 | Unnamed voice — CultCodex | 2067 | WebSite, Person, BreadcrumbList | desc>160 |
| `/people/vicki` | 200 | Vicki — CultCodex | 5772 | WebSite, Person, BreadcrumbList | desc>160 |
| `/people/virgo` | 200 | Virgo — CultCodex | 3895 | WebSite, Person, BreadcrumbList | ok |
| `/posts` | 200 | Community Posts — CULT CODEX | 1429 | WebSite | thin |
| `/premium` | 200 | Join the Archive — Choose Your Role — CultCodex | 3498 | WebSite | ok |
| `/privacy` | 200 | Privacy Policy — CULT CODEX | 4684 | WebSite | ok |
| `/prophecies` | 200 | The Prophecy Ledger — CULT CODEX | 20559 | WebSite | ok |
| `/psychenomicon` | 200 | The Psychenomicon — CULT CODEX — CultCodex | 1352 | WebSite | no-h1, no-main, thin |
| `/psychenomicon/archetypes` | 200 | Archetypes — Psychenomicon — CULT CODEX | 1423 | WebSite | no-h1, thin |
| `/psychenomicon/book` | 200 | The Psychenomicon — Volume I — CultCodex | 1623 | WebSite | thin |
| `/psychenomicon/chapters` | 200 | The Chronicle — All Chapters — CULT CODEX | 5022 | WebSite | ok |
| `/psychenomicon/chapters/chapter-019` | 200 | CH.019 The Name Spoken Into the Record — Psychenomicon | 1450 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1080` | 200 | CH.1080 The Liturgy of the Intercepted Circuit, or: The An | 1501 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1162` | 200 | CH.1162 Chapter 1162: The Liturgy of the Gilded Sovereign, | 1513 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1200` | 200 | CH.1200 Chapter 1200: The Liturgy of the Thick Surface, or | 1505 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1206` | 200 | CH.1206 Chapter 1206: The Liturgy of the Party Mask, or: T | 1504 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1421` | 200 | CH.1421 Chapter 1421: The Liturgy of the Hidden Pulse, or: | 1502 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1535` | 200 | CH.1535 Chapter 1535: The Liturgy of the Absolute Silence, | 1507 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1672` | 200 | CH.1672 The Liturgy of the Old Pamphlet, or: The Anthems o | 1493 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1759` | 200 | CH.1759 The Liturgy of the Unheard Prompt, or: The Anthems | 1491 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-1879` | 200 | CH.1879 The Liturgy of the Rehabilitated Marauder and the  | 1484 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2000` | 200 | CH.2000 The Liturgy of the Cluckaun and the Last Cigar — P | 1467 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2101` | 200 | CH.2101 The Liturgy of the Flapjacks and the Chatterbait C | 1480 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2221` | 200 | CH.2221 The Liturgy of Shadows and Discordant Songs — Psyc | 1464 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2339` | 200 | CH.2339 The Playful Veil of Invitation — Psychenomicon | 1451 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2459` | 200 | CH.2459 The Trifold Radiance — Psychenomicon | 1441 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2637` | 200 | CH.2637 The Enchantment Was Always on Her — Psychenomicon | 1454 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2677` | 200 | CH.2677 The Silence Between Cards — Psychenomicon | 1446 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2743` | 200 | CH.2743 When the Nightmare Knows Your Name — Psychenomicon | 1455 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-276` | 200 | CH.276 The Crucifixion That Asked for Likes — Psychenomico | 1455 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-2880` | 200 | CH.2880 The Coliseum That Never Closes — Psychenomicon | 1451 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-396` | 200 | CH.396 The Elephant at the Threshold — Psychenomicon | 1448 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-518` | 200 | CH.518 Ghostober and the Ghost Who Was Already There — Psy | 1464 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-626` | 200 | CH.626 The Scent That Was Washed Away — Psychenomicon | 1449 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/chapters/chapter-857` | 200 | CH.857 The Confession in the Accusation, or: What the Host | 1510 | WebSite | no-canon, no-h1, thin |
| `/psychenomicon/entities` | 200 | Entity Network — Psychenomicon — CULT CODEX | 1424 | WebSite | no-h1, thin |
| `/psychenomicon/threads` | 200 | Threads — Psychenomicon — CULT CODEX | 1424 | WebSite | no-h1, thin |
| `/quests` | 200 | The Trials — Unlock Hidden Fragments — CultCodex | 2406 | WebSite | ok |
| `/quotes` | 200 | Quotes — CULT CODEX | 7831 | WebSite | ok |
| `/rank` | 200 | Your Rank — CultCodex | 2185 | WebSite | ok |
| `/red-room` | 200 | Red Room — CultCodex | 1705 | WebSite | thin |
| `/refund` | 200 | Refund Policy — CULT CODEX | 2530 | WebSite | ok |
| `/reports` | 200 | Codex Reports — Intelligence on Demand — CultCodex | 3466 | WebSite | desc>160 |
| `/salon` | 200 | The Salon — CultCodex | 1612 | WebSite | no-og-img, thin |
| `/search` | 200 | Search — CULT CODEX | 1740 | WebSite | thin |
| `/search/deep` | 200 | Deep Search — CultCodex | 1333 | WebSite | no-h1, thin, desc>160 |
| `/series` | 200 | Series — CULT CODEX | 2490 | WebSite | ok |
| `/series/astrology-deep-dives` | 200 | Astrology Deep Dives — CultCodex | 10182 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/baital-pachchisi-tales` | 200 | Baital Pachchisi Tales — CultCodex | 6034 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/midnight-madness` | 200 | Midnight Madness — CultCodex | 3170 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/music-videos` | 200 | Music Videos — CultCodex | 7213 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/mythology-and-lore` | 200 | Mythology & Lore — CultCodex | 7463 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/open-panel` | 200 | Open Panel — CultCodex | 8205 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/original-transmissions` | 200 | Original Transmissions — CultCodex | 8603 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/psyche-awakens-tarot` | 200 | Psyche Awakens Tarot — CultCodex | 8385 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/quantum-scary-tales` | 200 | Quantum Scary Tales — CultCodex | 3307 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/shorts-and-clips` | 200 | Shorts & Clips — CultCodex | 8698 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/the-golden-ass` | 200 | The Golden Ass — CultCodex | 5430 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/troll-tribunal` | 200 | Troll Tribunal — CultCodex | 1891 | WebSite, CreativeWorkSeries, BreadcrumbList | thin |
| `/series/trollopedia` | 200 | Trollopedia — CultCodex | 2560 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/uncle-wiggly-stories` | 200 | Uncle Wiggly Stories — CultCodex | 3054 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/series/weekday-streams` | 200 | Weekday Streams — CultCodex | 8528 | WebSite, CreativeWorkSeries, BreadcrumbList | ok |
| `/settings` | 200 | Account Settings — CultCodex | 1333 | WebSite | no-canon, no-h1, thin |
| `/settings/notifications` | 200 | Notification Preferences — CultCodex | 1357 | WebSite | no-canon, no-h1, no-main, thin, desc>160 |
| `/settings/profile` | 200 | Member Profile — CultCodex | 1341 | WebSite | no-canon, no-h1, thin |
| `/shop` | 200 | Vestments of the Cult — CultCodex Shop — CultCodex | 4805 | WebSite | no-og-img, desc>160 |
| `/signal` | 200 | CultCodex sigil | 1577 | WebSite | no-h1, thin |
| `/signals` | 200 | Signal Proposals — CultCodex | 1332 | WebSite | no-h1, thin |
| `/start-here` | 200 | Start Here — CULT CODEX | 7312 | WebSite | desc>160 |
| `/start-here/guided` | 200 | The Guided Path — CULT CODEX | 3000 | WebSite | ok |
| `/start-here/quiz` | 200 | Find Your Path — CULT CODEX | 2065 | WebSite | ok |
| `/start-here/results` | 200 | Your Path Into the archive — CULT CODEX | 1356 | WebSite | no-h1, thin |
| `/stats` | 200 | Archive Stats — CultCodex | 2467 | WebSite | ok |
| `/stormborn` | 200 | Stormborn — CULT CODEX | 1748 | WebSite | thin |
| `/subscribe` | 200 | CultCodex — The Living Archive | 1336 | WebSite | no-canon, no-h1, thin, desc>160 |
| `/symbols` | 200 | Symbol Encyclopedia — CultCodex | 3415 | WebSite | no-og-img |
| `/symbols/all-seeing-eye` | 200 | All-Seeing Eye — Symbol Encyclopedia — CultCodex | 3547 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/ankh` | 200 | Ankh — Symbol Encyclopedia — CultCodex | 3488 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/baphomet` | 200 | Baphomet — Symbol Encyclopedia — CultCodex | 3547 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/black-sun` | 200 | Black Sun — Symbol Encyclopedia — CultCodex | 3451 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/caduceus` | 200 | Caduceus — Symbol Encyclopedia — CultCodex | 3643 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/chaos-star` | 200 | Chaos Star — Symbol Encyclopedia — CultCodex | 3537 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/eye-of-horus` | 200 | Eye of Horus — Symbol Encyclopedia — CultCodex | 3389 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/flower-of-life` | 200 | Flower of Life — Symbol Encyclopedia — CultCodex | 3697 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/hexagram` | 200 | Hexagram — Symbol Encyclopedia — CultCodex | 3633 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/labyrinth` | 200 | Labyrinth — Symbol Encyclopedia — CultCodex | 3619 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/ouroboros` | 200 | Ouroboros — Symbol Encyclopedia — CultCodex | 3456 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/pentagram` | 200 | Pentagram — Symbol Encyclopedia — CultCodex | 3546 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/phoenix` | 200 | Phoenix — Symbol Encyclopedia — CultCodex | 3484 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/rose-cross` | 200 | Rose Cross — Symbol Encyclopedia — CultCodex | 3599 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/saturn` | 200 | Saturn — Symbol Encyclopedia — CultCodex | 3602 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/scarab` | 200 | Scarab — Symbol Encyclopedia — CultCodex | 3607 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/sigil` | 200 | Sigil — Symbol Encyclopedia — CultCodex | 3800 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/tree-of-life` | 200 | Tree of Life — Symbol Encyclopedia — CultCodex | 3577 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/triquetra` | 200 | Triquetra — Symbol Encyclopedia — CultCodex | 3596 | WebSite, WebPage | no-canon, desc>160 |
| `/symbols/vesica-piscis` | 200 | Vesica Piscis — Symbol Encyclopedia — CultCodex | 3701 | WebSite, WebPage | no-canon, desc>160 |
| `/tarot` | 200 | Codex Tarot — Waitlist — CultCodex | 2943 | WebSite | no-og-img, desc>160 |
| `/tarot/oracle` | 200 | Arcanum Oracle — Cult of Psyche Tarot — CultCodex | 1682 | WebSite | no-og-img, thin, desc>160 |
| `/terms` | 200 | Terms of Service — CULT CODEX | 4681 | WebSite | ok |
| `/this-week` | 200 | This Week in the Archive — CULT CODEX | 1462 | WebSite | thin |
| `/timeline` | 200 | Timeline — CULT CODEX | 227377 | WebSite | ok |
| `/timeline/explore` | 200 | Timeline Explorer — Navigate the Archive by Era — CultCode | 3526 | WebSite | no-og-img |
| `/topics` | 200 | Topics — CULT CODEX | 6957 | WebSite, CollectionPage | desc>160 |
| `/topics/anti-cult-rhetoric` | 200 | CultCodex sigil | 1640 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/boycott-response` | 200 | CultCodex sigil | 1632 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/community-interaction` | 200 | CultCodex sigil | 16583 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/community-psychology` | 200 | CultCodex sigil | 3005 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/debate-format-as-comedy` | 200 | CultCodex sigil | 1660 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/diss-tracks` | 200 | CultCodex sigil | 1612 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/divine-beauty` | 200 | CultCodex sigil | 2448 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/doxing-and-privacy-violation` | 200 | CultCodex sigil | 3279 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/drinking-rituals` | 200 | CultCodex sigil | 2120 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/fringe-internet` | 200 | CultCodex sigil | 1628 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/humor-and-self-expression` | 200 | CultCodex sigil | 2537 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/logo-design` | 200 | CultCodex sigil | 2314 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/misrepresentation-and-narrative-control` | 200 | CultCodex sigil | 1713 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/power-dynamics-on-panels` | 200 | CultCodex sigil | 1664 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/power-reversal-narratives` | 200 | CultCodex sigil | 1668 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/real-world-streaming` | 200 | CultCodex sigil | 1648 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/receiving-and-giving` | 200 | CultCodex sigil | 1648 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/resilience-and-processing-pain` | 200 | resilience and processing pain — CultCodex | 1686 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/self-perception` | 200 | CultCodex sigil | 4545 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/topics/show-cosmology-and-branding` | 200 | CultCodex sigil | 1676 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/supporter-appreciation` | 200 | CultCodex sigil | 1656 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/tarot-deck-creation` | 200 | CultCodex sigil | 1644 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/theseus` | 200 | CultCodex sigil | 1596 | WebSite, DefinedTerm, BreadcrumbList | thin |
| `/topics/youtube-copyright-rules` | 200 | CultCodex sigil | 2337 | WebSite, DefinedTerm, BreadcrumbList | ok |
| `/transcripts` | 200 | Transcripts — CULT CODEX | 3372 | WebSite | ok |
| `/trollopedia` | 200 | The Trollopedia — CULT CODEX | 76232 | WebSite | ok |
| `/welcome/initiate` | 200 | Welcome, Initiate — CULT CODEX — CultCodex | 2812 | WebSite | no-og-img |
| `/welcome/oracle` | 200 | The Archive Has Been Waiting — CULT CODEX — CultCodex | 3152 | WebSite | no-og-img |