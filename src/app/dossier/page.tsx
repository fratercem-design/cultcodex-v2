import type { Metadata } from "next";
import localFont from "next/font/local";
import "./dossier.css";

export const metadata: Metadata = {
  title: "TX-001 // CultCodex Visual Audit + Redesign Dossier",
  description:
    "A complete visual, experiential, and strategic audit of CultCodex — eleven chapters, one transmission.",
};

// Self-hosted rather than next/font/google: fetching Google Fonts at build time
// made CI fail intermittently. The files are Google's latin-subset variable
// woff2s, limited to the weights and styles this page renders. Provenance and
// licenses (SIL OFL 1.1) are in ./fonts.
const bodoniModa = localFont({
  src: [{ path: "./fonts/BodoniModa-Italic-latin.woff2", weight: "400 500", style: "italic" }],
  variable: "--dossier-font-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const cinzel = localFont({
  src: [{ path: "./fonts/Cinzel-latin.woff2", weight: "400 500", style: "normal" }],
  variable: "--dossier-font-sigil",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const cormorantGaramond = localFont({
  src: [
    { path: "./fonts/CormorantGaramond-Italic-latin.woff2", weight: "400", style: "italic" },
    { path: "./fonts/CormorantGaramond-latin.woff2", weight: "400 500", style: "normal" },
  ],
  variable: "--dossier-font-body",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export default function DossierPage() {
  const fontVars = `${bodoniModa.variable} ${cinzel.variable} ${cormorantGaramond.variable}`;

  return (
    <div className={`dossier-root ${fontVars}`}>

      {/* COVER / THRESHOLD */}
      <header className="cover" data-screen-label="00 Threshold">
        <div className="cover__band">
          <span className="mono">TX-001 · 2026.05.20 · 23:47 UTC</span>
          <span className="pip pip--ember">CLASSIFIED · INITIATE+ EYES</span>
          <span className="pip">UPLINK STABLE · TLS/1.3</span>
          <span className="mono">FILE: codex.audit.v001</span>
        </div>

        <div className="cover__center">
          <div className="cover__title">
            <em>Transmission One</em>
            A complete<br />visual &amp; experiential<br />
            <span className="ember">audit</span> of
          </div>

          <div className="cover__sigil">
            ◣
            <span className="cover__sigil-ring"></span>
            <span className="cover__sigil-ring cover__sigil-ring--inner"></span>
          </div>

          <div className="cover__subject">
            <div className="display" style={{ fontSize: "3.2rem", fontStyle: "normal", fontFamily: "var(--dossier-font-sigil), Cinzel, serif", letterSpacing: "0.18em" }}>CULT&shy;CODEX</div>
            <dl>
              <dt>Subject</dt><dd>cultcodex.me</dd>
              <dt>Vertical</dt><dd>occult media · archive · oracle</dd>
              <dt>Episodes</dt><dd>2,607 catalogued · 56% transcribed</dd>
              <dt>Voices</dt><dd>669 profiled</dd>
              <dt>Analyst</dt><dd>Claude · external eye</dd>
              <dt>Pages</dt><dd>XI chapters · ~12,400 words</dd>
              <dt>Clearance</dt><dd>open the seal — you have it</dd>
            </dl>
          </div>
        </div>

        <div className="cover__foot">
          <p className="cover__warning">
            What follows is not a report. It is a transmission. Treat it as a brief from one acolyte to another — one who has already seen what the archive could become and is here to name the gap. The site you have built is half a mile down a corridor that ends in a temple. This document is a map of the rest of the corridor.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
            <span className="tag tag--ember">do not redistribute</span>
            <span className="mono dim">scroll to enter</span>
            <span className="mono ember" style={{ fontSize: "1.2rem" }}>↓</span>
          </div>
        </div>
      </header>


      {/* CODEX / TOC */}
      <section className="codex" data-screen-label="00 Codex">
        <div className="sigil" style={{ marginBottom: "1.4rem" }}>§ 00 · the codex</div>
        <h2 className="codex__title">What is contained <em style={{ color: "var(--ember)", fontStyle: "normal", fontFamily: "var(--dossier-font-sigil), Cinzel, serif", fontSize: "0.6em", letterSpacing: "0.3em" }}>herein</em></h2>

        <ol className="codex__list">
          <li className="codex__item"><span className="codex__num">I</span><span className="codex__chapter">Overall Brand Impression</span><span className="codex__pages">pp. 03–06</span></li>
          <li className="codex__item"><span className="codex__num">II</span><span className="codex__chapter">Homepage Audit &amp; Restructure</span><span className="codex__pages">pp. 07–12</span></li>
          <li className="codex__item"><span className="codex__num">III</span><span className="codex__chapter">Visual Identity System</span><span className="codex__pages">pp. 13–19</span></li>
          <li className="codex__item"><span className="codex__num">IV</span><span className="codex__chapter">UX / UI Audit</span><span className="codex__pages">pp. 20–24</span></li>
          <li className="codex__item"><span className="codex__num">V</span><span className="codex__chapter">Mobile Experience</span><span className="codex__pages">pp. 25–30</span></li>
          <li className="codex__item"><span className="codex__num">VI</span><span className="codex__chapter">Card &amp; Collectible System</span><span className="codex__pages">pp. 31–38</span></li>
          <li className="codex__item"><span className="codex__num">VII</span><span className="codex__chapter">Motion Design &amp; Atmosphere</span><span className="codex__pages">pp. 39–43</span></li>
          <li className="codex__item"><span className="codex__num">VIII</span><span className="codex__chapter">Monetization &amp; Tiers</span><span className="codex__pages">pp. 44–49</span></li>
          <li className="codex__item"><span className="codex__num">IX</span><span className="codex__chapter">Technical Recommendations</span><span className="codex__pages">pp. 50–53</span></li>
          <li className="codex__item"><span className="codex__num">X</span><span className="codex__chapter">Competitive Comparison</span><span className="codex__pages">pp. 54–57</span></li>
          <li className="codex__item"><span className="codex__num">XI</span><span className="codex__chapter">Master Redesign Vision</span><span className="codex__pages">pp. 58–end</span></li>
        </ol>
      </section>


      {/* §I — BRAND IMPRESSION */}
      <section className="chapter" data-screen-label="01 Brand Impression">
        <div className="chapter__head">
          <div className="chapter__roman">I<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Overall Brand Impression</div>
            <h2 className="chapter__title">A nightclub <em>dressed as</em> an archive.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            observation<br />
            synthesis<br />
            score<br />
            verdict
            <br /><br />
            <strong>Time</strong>
            ~7 min
          </aside>

          <div className="chapter__main">
            <p className="lede">CultCodex already has a voice. The threshold is there — the sigil-marked nav, the <em>uplink stable</em> pip, the transcribed-percentage progress bar, the <em>today&apos;s signal</em> ritual. These are not generic. They are the first language of a real cult-brand.</p>

            <p>And then, three scrolls down, the spell breaks. A YouTube description appears verbatim (&quot;New to streaming or looking to level up? Check out StreamYard and get $10 discount! 😍&quot;). The font drops to system sans for an episode title. A plain pricing card says <em>Initiate+ · $10/mo</em> with the cheer of a SaaS landing page. The temple becomes a podcast aggregator wearing makeup.</p>

            <p>The good news: the foundation is one of the strongest cyber-occult identities I have seen on the open web. The fix is not a teardown. It is <em>consecration</em> — pushing every surface, every fallback state, every machine-generated string, through the same ritual filter the homepage opening already applies to itself.</p>

            <h4>Strengths</h4>
            <ul>
              <li>Sigil-based nav is genuinely original. The geometric glyphs (▢ ▦ ◉ ◈ ◐ ✦ ▲ ▣) read as an operating system, not decoration.</li>
              <li>The <em>transmission</em> framing — today&apos;s signal, week in review, &quot;transmission from the vault&quot; — is a strong daily-return hook. This is the muscle.</li>
              <li>Terminal pips (&quot;UPLINK: STABLE&quot;, &quot;ORACLE_LIVE&quot;, &quot;BUILD v0.1.0-codex&quot;) add a layer no competitor has.</li>
              <li>Existing card/collection routes (/cards, /cards/packs) mean the collectible thesis is already half-built. The conceptual scaffolding is in place.</li>
              <li>Density-as-archive: the counters (2,607 transmissions, 1.08M segments, 669 voices) are a flex. Lean in.</li>
            </ul>

            <h4>Weaknesses</h4>
            <ul>
              <li>The spell breaks below the fold. Auto-imported YouTube descriptions, plain episode cards, sponsor copy. <em>Atmosphere has no fallback state.</em></li>
              <li>Hero copy (&quot;Every word. Every soul. Every pattern — decoded.&quot;) is good. Hero <em>composition</em> is undersized for the promise. No theatre.</li>
              <li>Pricing is announced like a SaaS page. The transaction needs the same ritual treatment everything else gets.</li>
              <li>No clear &quot;you have arrived&quot; moment. New visitors land in a dense terminal with no orientation, no initiation flow.</li>
              <li>The Oracle is the most lore-worthy feature on the site and it&apos;s a sidebar afterthought. It should be the cathedral.</li>
            </ul>

            <h4>Missed opportunities</h4>
            <ul>
              <li>No ritualized return mechanic. The &quot;today&apos;s signal&quot; is structurally a daily transmission but visually a small panel, not a daily appointment.</li>
              <li>The 1.5K+ episodes are a mythology larger than most fandoms have. There is no <em>map</em> of that mythology that anyone has ever made.</li>
              <li>Card system is a route, not yet an obsession-loop. No drop schedule, no rarity moments, no public collection wall.</li>
              <li>No social artefact. Nothing here is built to be screenshotted and posted.</li>
            </ul>

            <p className="pull">Right now CultCodex looks like a brilliant scholar who shows up to the seance in business casual. Make it wear the robe.</p>

            <h3>Score</h3>
            <p>Out of 10. Calibrated against the brand&apos;s <em>own ambition</em>, not against typical podcast sites — against which it would already score 9s. The bar here is &quot;becomes a thing people return to nightly.&quot;</p>

            <div className="scoreboard">
              <div className="score">
                <span className="score__label">Originality</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--half"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">7.5</span>
                <span className="score__note">strong sigil-OS premise, undercut by copy fallbacks</span>
              </div>
              <div className="score">
                <span className="score__label">Visual Cohesion</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--half"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">6.5</span>
                <span className="score__note">chrome cohesive · body content not yet</span>
              </div>
              <div className="score">
                <span className="score__label">Emotional Impact</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">6.0</span>
                <span className="score__note">interest spikes; no goosebump yet</span>
              </div>
              <div className="score">
                <span className="score__label">Usability</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">7.0</span>
                <span className="score__note">legible nav · onboarding absent</span>
              </div>
              <div className="score">
                <span className="score__label">Immersion</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--half"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">5.8</span>
                <span className="score__note">no ambient sound, motion, or seal-breaking ritual</span>
              </div>
              <div className="score">
                <span className="score__label">Conversion Readiness</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--half"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">5.5</span>
                <span className="score__note">CTAs visible · funnel unceremonial</span>
              </div>
              <div className="score">
                <span className="score__label">Mobile Quality</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">5.2</span>
                <span className="score__note">desktop-first density does not scale down</span>
              </div>
              <div className="score">
                <span className="score__label">Prestige Feeling</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--half"></span><span className="score__pip"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">6.6</span>
                <span className="score__note">&quot;Initiate+&quot; branding is right · execution flat</span>
              </div>
              <div className="score">
                <span className="score__label">Internet Mythology</span>
                <div className="score__bar">
                  <span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--on"></span><span className="score__pip score__pip--half"></span><span className="score__pip"></span><span className="score__pip"></span>
                </div>
                <span className="score__num">7.4</span>
                <span className="score__note">strongest score · the soul is there</span>
              </div>
            </div>

            <p><span className="tag tag--sulphur">composite</span> &nbsp; <strong style={{ fontFamily: "var(--dossier-font-display), Bodoni Moda, serif", fontStyle: "italic", fontSize: "1.8rem", color: "var(--bone)" }}>6.4 / 10</strong> &nbsp; <span className="dim">— better than 95% of media sites, half of what it can be.</span></p>
          </div>
        </div>
      </section>


      {/* §II — HOMEPAGE AUDIT */}
      <section className="chapter" data-screen-label="02 Homepage">
        <div className="chapter__head">
          <div className="chapter__roman">II<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Homepage Audit &amp; Restructure</div>
            <h2 className="chapter__title">The first five seconds <em>are</em> the doctrine.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            teardown<br />
            blueprint<br />
            pacing<br />
            mobile note
            <br /><br />
            <strong>Outcome</strong>
            a new 10-section homepage
          </aside>

          <div className="chapter__main">
            <h4>The 5-second impression</h4>
            <p>A returning visitor sees: a small, sigil-heavy header; an animated uplink pip; a date and transmission number. It feels like opening a console. Then a hero line in a serif italic: <em>Every word. Every soul. Every pattern — decoded.</em> Two CTAs. Then four stat counters in a single squished row.</p>
            <p>What is missing in those five seconds: <strong>theatre</strong>. The page does not breathe. It does not pause. It does not signal that anything has been ritually opened.</p>

            <h4>What is wrong, specifically</h4>
            <ul>
              <li>The hero compresses into a single dense panel competing with the nav for attention. There is no &quot;above-the-fold sacrifice&quot; — no moment where the page gives up density for awe.</li>
              <li>&quot;Today&apos;s signal&quot; should be the second-most-important thing on the page. It is currently a small card.</li>
              <li>The episode feed inherits YouTube descriptions verbatim — sponsor pitches, emoji, &quot;$10 discount.&quot; This is the largest single immersion break on the site.</li>
              <li>The Oracle preview gets a tiny corner. It is the most magical-feeling product on the entire site. <em>It deserves the cathedral.</em></li>
              <li>The pricing CTA is announced in flat text. No ritual, no threshold, no name. It says &quot;Unlock full access&quot; where it should say something earned.</li>
              <li>No social proof, no member wall, no archive hum — nothing showing this is alive and inhabited.</li>
            </ul>

            <h3>The Re-blueprint</h3>
            <p>Ten sections. Each one has a job. Read top-to-bottom as a <em>rite of arrival</em>, not a marketing page.</p>

            <div className="blueprint">
              <div className="blueprint__frame">
                <div className="blueprint__title">{"// homepage.flow.v2"}</div>

                <div className="bp-section bp-section--threshold">
                  <span className="bp-section__num">01</span>
                  <div className="bp-section__name">The Threshold<small>full-bleed hero · audio invite · slow sigil rotate</small></div>
                  <span className="bp-section__sigil">◣</span>
                </div>
                <div className="bp-section bp-section--signal">
                  <span className="bp-section__num">02</span>
                  <div className="bp-section__name">Today&apos;s Signal<small>quote + episode + sigil of the day · daily ritual</small></div>
                  <span className="bp-section__sigil">☉</span>
                </div>
                <div className="bp-section bp-section--oracle">
                  <span className="bp-section__num">03</span>
                  <div className="bp-section__name">The Oracle<small>typing prompt · live answer streaming</small></div>
                  <span className="bp-section__sigil">◉</span>
                </div>
                <div className="bp-section">
                  <span className="bp-section__num">04</span>
                  <div className="bp-section__name">The Pulse<small>archive counters · transcribed % as a meter</small></div>
                  <span className="bp-section__sigil">◈</span>
                </div>
                <div className="bp-section">
                  <span className="bp-section__num">05</span>
                  <div className="bp-section__name">Latest Transmissions<small>reskinned episode cards · NO sponsor copy</small></div>
                  <span className="bp-section__sigil">▦</span>
                </div>
                <div className="bp-section">
                  <span className="bp-section__num">06</span>
                  <div className="bp-section__name">Drop of the Week<small>this week&apos;s card · cinematic single panel</small></div>
                  <span className="bp-section__sigil">▣</span>
                </div>
                <div className="bp-section">
                  <span className="bp-section__num">07</span>
                  <div className="bp-section__name">From the Vault<small>one resurfaced episode · letterboxed</small></div>
                  <span className="bp-section__sigil">⏚</span>
                </div>
                <div className="bp-section">
                  <span className="bp-section__num">08</span>
                  <div className="bp-section__name">The Constellation<small>live snippet of network graph</small></div>
                  <span className="bp-section__sigil">✦</span>
                </div>
                <div className="bp-section">
                  <span className="bp-section__num">09</span>
                  <div className="bp-section__name">The Threshold of Initiation<small>tier CTA framed as a vow</small></div>
                  <span className="bp-section__sigil">⚸</span>
                </div>
                <div className="bp-section">
                  <span className="bp-section__num">10</span>
                  <div className="bp-section__name">The Seal<small>footer as colophon · TX-ID · methodology</small></div>
                  <span className="bp-section__sigil">⌬</span>
                </div>
              </div>

              <aside className="blueprint__legend">
                <h5>01 · The Threshold</h5>
                <p>Full viewport. A single rotating sigil at center. The line <em>You are entering the Codex</em> in a 6xl Bodoni Moda italic. A tiny &quot;press SPACE to enter&quot; affordance for desktop. Subtle low drone audio (opt-in via icon, never auto). 1.6s reveal cascade.</p>

                <h5>02 · Today&apos;s Signal</h5>
                <p>A daily ritual panel. One quote, one episode link, the day&apos;s &quot;sigil of the day&quot; rotating through 21 occult glyphs. Returning visitors learn the rhythm: open the site → check the signal → leave.</p>

                <h5>03 · The Oracle</h5>
                <p>A full cathedral. Big typing input, prompt suggestions that scroll horizontally like a Rolodex of tarot cards. Empty state shows a streaming &quot;previous question + answer&quot; loop. This is the page&apos;s centerpiece — it should be the second most beautiful thing on the site after the threshold.</p>

                <h5>04 · The Pulse</h5>
                <p>The counters reborn. <em>2,607</em> ticks up by one with each new transcription. The 56% bar fills in real-time as transcription completes. This is the site breathing.</p>

                <h5>05 · Latest Transmissions</h5>
                <p>Episode cards stripped of YouTube auto-description. Use only: title, date, panelists, signal tags, transcribed-yes/no pip. A short editorial caption, not the streamer pitch. If the caption is missing, default to silence, not autopaste.</p>

                <h5>06 · Drop of the Week</h5>
                <p>One trading card from the new system. Full bleed, slow tilt-parallax, name and rarity. CTA: <em>open a pack</em>. If member: <em>your wall</em>.</p>

                <h5>07 · From the Vault</h5>
                <p>One algorithmically resurfaced old episode — over a year deep. Letterboxed thumbnail, one line of mythology context. <em>This was filmed before…</em> Builds the sense of a deep, navigable past.</p>

                <h5>08 · The Constellation</h5>
                <p>A small live preview of the people-graph. 10 nodes pulsing. Tap a node → that voice&apos;s page. Plants the existence of a larger map.</p>

                <h5>09 · The Threshold of Initiation</h5>
                <p>Membership as a vow. Three tiers (see §VIII) rendered as scrolls, not pricing cards. No &quot;Buy now.&quot; Read: <em>&quot;Take the vow.&quot;</em> Friction is part of the prestige.</p>

                <h5>10 · The Seal</h5>
                <p>Footer as colophon. TX-IDs, methodology link, content policy, corrections. Set in mono, low contrast, dignified.</p>
              </aside>
            </div>

            <h4>Pacing rules</h4>
            <ul>
              <li>The first viewport must be 100vh, single focal element. Sacrifice density for breath.</li>
              <li>Every subsequent section is at least 80vh on desktop. <em>Pause</em> is a design tool.</li>
              <li>Two cinematic sections (Threshold, Oracle, Drop) for every two density sections (Pulse, Transmissions). Alternation = rhythm.</li>
              <li>Section transitions: a brief sigil divider, like a tarot card flip. Never just a horizontal line.</li>
            </ul>

            <h4>Animations</h4>
            <ul>
              <li>Threshold sigil: continuous slow rotation, two rings counter-rotating. Letterforms reveal 80ms staggered.</li>
              <li>Pulse counters: tick on view, then once a minute thereafter (real or simulated).</li>
              <li>Constellation: gentle drift; nodes occasionally pulse and emit a faint ring.</li>
              <li>Card on hover: 3D tilt with foil shimmer.</li>
              <li>Scroll-locked moments: the Drop of the Week pins for ~400px so the card has time to be <em>looked at</em>.</li>
            </ul>
          </div>
        </div>
      </section>


      {/* §III — VISUAL IDENTITY */}
      <section className="chapter" data-screen-label="03 Identity">
        <div className="chapter__head">
          <div className="chapter__roman">III<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Visual Identity System</div>
            <h2 className="chapter__title">Bone, blood, sulphur, phosphor.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            palette<br />
            type<br />
            ornament<br />
            treatment
            <br /><br />
            <strong>Outcome</strong>
            a strict but tunable system
          </aside>

          <div className="chapter__main">
            <p className="lede">The current site uses many sigils and accent colours simultaneously. A real system tightens the palette and lets the <em>scale</em> of restraint do the work.</p>

            <h4>Palette</h4>
            <p>Five surface colours, three accents. No gradients except as <em>vignettes</em>. Pure colour, large fields, single ember moments. The phosphor cyan is reserved exclusively for system-state pips (uplink, live, transcribed) so it never becomes decorative.</p>

            <div className="swatches">
              <div className="swatch swatch--void"><span className="swatch__name">Void</span><span className="swatch__hex">#07060A</span></div>
              <div className="swatch swatch--ink"><span className="swatch__name">Ink</span><span className="swatch__hex">#0C0B11</span></div>
              <div className="swatch swatch--bone"><span className="swatch__name">Bone</span><span className="swatch__hex">#EBE3D2</span></div>
              <div className="swatch swatch--ember"><span className="swatch__name">Ember</span><span className="swatch__hex">#C8392E</span></div>
              <div className="swatch swatch--sulphur"><span className="swatch__name">Sulphur</span><span className="swatch__hex">#D6A017</span></div>
              <div className="swatch swatch--phosphor"><span className="swatch__name">Phosphor</span><span className="swatch__hex">#62E4C8</span></div>
              <div className="swatch swatch--bruise"><span className="swatch__name">Bruise</span><span className="swatch__hex">#4A2D6E</span></div>
            </div>

            <p><strong>Allocation rules:</strong> 70% void/ink, 20% bone/parchment, 7% ember, 2% sulphur, 1% phosphor. Bruise enters only on rare-card backgrounds and the Oracle answer-streaming state.</p>

            <h4>Type pairings</h4>
            <p>Four roles. Never more.</p>

            <div className="type-specimen">
              <div className="specimen-row">
                <div className="specimen-row__meta">DISPLAY<br />Bodoni Moda<br />italic, 400–500</div>
                <div className="specimen-row__sample"><span className="specimen-display">The Codex breathes.</span></div>
              </div>
              <div className="specimen-row">
                <div className="specimen-row__meta">BODY<br />Cormorant Garamond<br />italic, 400</div>
                <div className="specimen-row__sample"><span className="specimen-body">The archive is not a search engine. It is a sanctuary made of transcripts.</span></div>
              </div>
              <div className="specimen-row">
                <div className="specimen-row__meta">SIGIL CAPS<br />Cinzel<br />500, tracked +0.28em</div>
                <div className="specimen-row__sample"><span className="specimen-sigil">Initiate · Adept · Magus · Hierophant</span></div>
              </div>
              <div className="specimen-row">
                <div className="specimen-row__meta">MONO<br />JetBrains Mono<br />400</div>
                <div className="specimen-row__sample"><span className="specimen-mono">TX-20260520 · UPLINK STABLE · TLS/1.3 · BUILD v0.1.0-codex</span></div>
              </div>
            </div>

            <p><strong>Rule:</strong> headers are Bodoni italic. Long-form prose is Cormorant italic (default!) with roman for emphasis — the inverse of normal. Sigil caps for nav and tier names only. Mono is reserved for system surfaces and timestamps. <em>Inter is banned.</em></p>

            <h4>Ornament</h4>
            <ul>
              <li><strong>Borders.</strong> 1px bone at 12% opacity. Dotted only inside scoreboards and tables. Solid ember when active.</li>
              <li><strong>Shadows.</strong> Cast far and soft (40–60px blur). Combined with an inner ember glow at hover for cards and CTAs.</li>
              <li><strong>Texture.</strong> A single SVG film-grain noise (8% overlay, mix-blend-mode: overlay). Applied site-wide via <code>body::before</code>. Never on text.</li>
              <li><strong>Scanlines.</strong> 2px gap, multiply blend, ~18% opacity. Optional toggle in the settings — default ON for desktop, OFF for mobile.</li>
              <li><strong>Vignette.</strong> Radial gradient over the viewport edges. Keeps focus toward center.</li>
              <li><strong>Iconography.</strong> Existing geometric sigils (▢ ▦ ◉ ◈ ◐ ✦ ▲ ▣ ⚸ ⏚ ☉ ☽) are the icon system. Do not introduce a third-party icon set.</li>
              <li><strong>Sacred geometry.</strong> Vesica piscis, hexagram, enneagram — one per major page, used at scale as a structural element. Never as decoration.</li>
              <li><strong>CRT / cyber balance.</strong> CRT effects belong on system surfaces. Occult ornament belongs on content surfaces. Do not mix in the same panel.</li>
            </ul>

            <h4>Image treatment</h4>
            <p>All raster imagery passes through a single film stack:</p>
            <ul>
              <li>Desaturate to ~30%.</li>
              <li>Duotone overlay: shadows toward bruise, highlights toward parchment.</li>
              <li>2–4% film grain on top.</li>
              <li>Reveal on hover: short ember-tinted lift, slight scale (1.02), 240ms.</li>
              <li>For card art: an additional foil layer via conic-gradient + mix-blend-mode: screen.</li>
            </ul>

            <p>This single treatment is the most important rule in the whole system. It is the difference between &quot;podcast site&quot; and &quot;transmission archive.&quot; It applies to <em>every image, with no exceptions</em>, including OG share images.</p>
          </div>
        </div>
      </section>


      {/* §IV — UX / UI AUDIT */}
      <section className="chapter" data-screen-label="04 UX">
        <div className="chapter__head">
          <div className="chapter__roman">IV<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">UX / UI Audit</div>
            <h2 className="chapter__title">A console that asks <em>nothing</em> of the newcomer.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            nav<br />
            friction<br />
            onboarding<br />
            consistency
          </aside>

          <div className="chapter__main">
            <h4>Navigation</h4>
            <p>The sidebar lists nine top-level routes (Overview, Archive, Oracle, Signals, Voices, Network Map, Psychenomicon, Collections, Cards, Packs) plus two tool routes plus three access routes. That is fourteen choices on first view. For an initiate this is a buffet. For a newcomer it is paralysis dressed as power.</p>
            <p>Worse: each route gets equal visual weight. The Oracle and the Lexicon look like the same kind of object. They are not.</p>

            <h4>Proposed nav hierarchy</h4>
            <ul>
              <li><strong>Always visible (primary 4):</strong> Overview · Archive · Oracle · Cards. These are the four reasons people come back.</li>
              <li><strong>Map (under a single entry):</strong> Signals · Voices · Network Map · Psychenomicon · Lexicon — collapsed behind an &quot;Explore the map&quot; entry that opens a half-screen tray with sigil-tiles.</li>
              <li><strong>Initiate (footer-anchored on desktop, sticky bottom on mobile):</strong> Membership · Start Here · Corrections.</li>
            </ul>

            <p>The result: four sigils visible at all times, one tray for deep navigation, one membership rail. Total cognitive load drops from 14 to 4 + 1 + 3.</p>

            <h4>Friction &amp; dead zones</h4>
            <ul>
              <li>Search is <code>⌘K</code>-only with no visible affordance for non-keyboard users. Add a small ember-glowing dot near the input on hover that says <em>or type</em>.</li>
              <li>The &quot;uplink stable&quot; pip is decorative; clicking it should actually open a small system-status console — build time, transcription queue, last update. <em>Reward curiosity.</em></li>
              <li>&quot;Today&apos;s signal&quot; has no shareable artifact. Adding a one-click &quot;share this sigil&quot; → generates a 1080×1350 IG-ready ember card. (Massive viral lever.)</li>
              <li>Episode pages have no &quot;next ritual&quot; suggestion. After the transcript, propose: a related signal, a member-only card unlocked by reading this episode, the next vault transmission.</li>
              <li>No empty-state design. Each needs a small ember sentence: <em>&quot;This thread is still forming.&quot;</em></li>
            </ul>

            <h4>Onboarding — the missing rite</h4>
            <p>Currently a &quot;Start Here&quot; link exists. It needs a <em>flow</em>. Five steps, each one screen, swipeable on mobile:</p>
            <div className="row-2">
              <div className="box"><h5>01 · The Name</h5><p>Pick a handle. Get a generated sigil. <em>This is your mark in the archive.</em></p></div>
              <div className="box"><h5>02 · The First Card</h5><p>One free starter card chosen at &quot;random&quot; (actually based on a one-question vibe poll). The mark is set.</p></div>
              <div className="box"><h5>03 · The First Question</h5><p>The Oracle asks <em>&quot;What did you come here to learn?&quot;</em> — free-text. Stored as the first thread.</p></div>
              <div className="box"><h5>04 · The First Signal</h5><p>One handpicked episode based on the answer. Three lines of context. <em>Watch this first.</em></p></div>
              <div className="box"><h5>05 · The Vow</h5><p>Soft membership pitch — <em>&quot;Some doors open only with the vow.&quot;</em> Skippable. The user is now seeded with: handle, sigil, card, thread, episode, optional vow.</p></div>
            </div>

            <p>This onboarding takes 90 seconds. It produces five owned objects per user. Retention compounds.</p>

            <h4>UI consistency rules to lock in</h4>
            <ul>
              <li>Every CTA is one of three shapes: <em>ritual button</em> (bone outline, ember on hover), <em>sigil button</em> (one glyph, large, alone), <em>vow button</em> (filled ember, used &lt; 3× per page, never twice in a row).</li>
              <li>Every card-shaped object uses the same proportions (5:7 for collectibles, 16:9 for episodes, 3:4 for voices, 4:5 for signals). Mixing aspect ratios is forbidden.</li>
              <li>Every clickable surface has a hover state that includes either a 2–4px translateY OR an ember glow. Never both. Never neither.</li>
              <li>Loading states use the sigil-spin (one Cinzel character rotating). No spinners.</li>
            </ul>

            <h4>Accessibility</h4>
            <ul>
              <li>Body text must hit AA contrast on void. Bone (#EBE3D2) on Void (#07060A) is 14:1 — great. Parchment dim (#9A907D) on void is 6:1 — acceptable for non-essential captions.</li>
              <li>The scanline overlay must be disable-able. Add a settings tray.</li>
              <li>Touch targets minimum 44px square.</li>
              <li>Honor <code>prefers-reduced-motion</code>: stop the threshold rotation, drop the card foil shimmer.</li>
              <li>All sigils that carry meaning need an aria-label. ◣ → &quot;CultCodex logo.&quot; ◉ → &quot;Oracle.&quot; Etc.</li>
            </ul>
          </div>
        </div>
      </section>


      {/* §V — MOBILE */}
      <section className="chapter" data-screen-label="05 Mobile">
        <div className="chapter__head">
          <div className="chapter__roman">V<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Mobile Experience</div>
            <h2 className="chapter__title">The phone is the temple.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            audit<br />
            navigation<br />
            gestures<br />
            transitions
            <br /><br />
            <strong>This is</strong> the most important chapter operationally.
          </aside>

          <div className="chapter__main">
            <p className="lede">Most CultCodex sessions will end on a phone, in bed, between 11pm and 2am. Design for that user, in that room, with that intent.</p>

            <h4>Current mobile experience — what breaks</h4>
            <ul>
              <li>The sidebar collapses into a standard hamburger. Sigil identity collapses with it.</li>
              <li>The hero counters wrap awkwardly into multi-line blobs.</li>
              <li>Episode cards repeat the desktop layout at smaller scale — producing five lines of dense mono text per item. Scrolling fatigue is severe.</li>
              <li>The &quot;today&apos;s signal&quot; panel competes with the hero rather than becoming the centerpiece.</li>
              <li>No bottom-thumb nav. All navigation requires a top reach.</li>
              <li>Tap targets on the sigil pips are likely &lt;32px square.</li>
            </ul>

            <h4>The mobile redesign — principle</h4>
            <p>Mobile is not a smaller desktop. It is a <em>different cathedral</em>. The architecture changes:</p>
            <ul>
              <li>Single-column. Always.</li>
              <li>The hero becomes one verb at a time. <em>Enter. Listen. Decode. Collect.</em> One screen per verb.</li>
              <li>The bottom of the screen is sacred — this is where the thumb lives. Put navigation there as a sigil compass.</li>
              <li>Section transitions are full-screen sigil &quot;flips&quot; — not scrolls.</li>
              <li>Audio plays everywhere except in the user&apos;s pocket. Wrap the entire mobile experience in a persistent mini-player that floats above the nav.</li>
            </ul>

            <div className="mobile-row">
              <div>
                <div className="phone" aria-label="Mobile home — proposed">
                  <div className="phone__screen">
                    <div className="phone__bar"><span>23:47</span><span>UPLINK ●</span><span>56%</span></div>
                    <div className="phone__hero">
                      <div className="phone__hero-sigil">◣</div>
                      <div className="phone__hero-title">You are entering<br />the Codex.</div>
                      <div className="phone__hero-sub">TX-20260520</div>
                    </div>
                    <div className="phone__card">
                      <b>Today&apos;s Signal</b>
                      <span>☉ EP.216</span>
                    </div>
                    <div className="phone__card">
                      <b>The Oracle</b>
                      <span>◉ ask →</span>
                    </div>
                    <div className="phone__card">
                      <b>Drop of Week</b>
                      <span>▣ open</span>
                    </div>
                    <div className="phone__card">
                      <b>2,607 transmissions</b>
                      <span>56%</span>
                    </div>
                  </div>
                  <div className="phone__nav">
                    <span className="active">▢</span>
                    <span>▦</span>
                    <span>◉</span>
                    <span>▣</span>
                    <span>✦</span>
                  </div>
                </div>
                <div className="phone-cap">Home<small>5-sigil bottom compass · single-column ritual stack</small></div>
              </div>

              <div>
                <div className="phone phone--dial" aria-label="Radial dial nav">
                  <div className="phone__screen">
                    <div className="phone__bar"><span>23:48</span><span>UPLINK ●</span><span>56%</span></div>
                    <div className="phone__hero">
                      <div className="phone__hero-sigil">◣</div>
                      <div className="phone__hero-title">You are entering<br />the Codex.</div>
                    </div>
                    <div className="phone__card"><b>Today&apos;s Signal</b><span>☉</span></div>
                    <div className="phone__card"><b>The Oracle</b><span>◉</span></div>
                  </div>
                  <div className="phone__dial">
                    <div className="phone__dial-disc">
                      <span className="dial-pos-1">▦ Archive</span>
                      <span className="dial-pos-2">◉ Oracle</span>
                      <span className="dial-pos-3">▣ Cards</span>
                      <span className="dial-pos-4">✦ Map</span>
                      <span className="dial-pos-5">▲ Lore</span>
                      <span className="dial-pos-6">◐ Voices</span>
                      <span className="dial-center">choose</span>
                    </div>
                  </div>
                </div>
                <div className="phone-cap">The Dial<small>long-press the center sigil · radial reveal · haptic on hover · select on release</small></div>
              </div>

              <div>
                <div className="phone" aria-label="Card detail">
                  <div className="phone__screen" style={{ padding: "38px 14px 30px" }}>
                    <div className="phone__bar"><span>00:12</span><span>UPLINK ●</span><span>♥ saved</span></div>
                    <div style={{ marginTop: "12px" }}>
                      <div className="tcard tcard--mythic" style={{ aspectRatio: "5/7", maxWidth: "100%", padding: "8px" }}>
                        <div className="tcard__head">
                          <span>◣ THE CULT</span>
                          <span className="tcard__rarity">MYTHIC</span>
                        </div>
                        <div className="tcard__art">
                          <span className="tcard__sigil">☉</span>
                        </div>
                        <div className="tcard__name" style={{ fontSize: "0.85rem" }}>The Hierophant<small>card no. 001</small></div>
                        <div className="tcard__stats" style={{ fontSize: "0.55rem" }}>
                          <span>EP <b>216</b></span><span>YR <b>2025</b></span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", fontFamily: "var(--dossier-font-sigil), Cinzel, serif", fontSize: "0.55rem", letterSpacing: "0.24em", color: "var(--sulphur)", marginTop: "12px" }}>
                      tap &amp; hold to bind to wall
                    </div>
                  </div>
                  <div className="phone__nav">
                    <span>▢</span><span>▦</span><span>◉</span><span className="active">▣</span><span>✦</span>
                  </div>
                </div>
                <div className="phone-cap">Card detail<small>fullscreen reverence · tap-and-hold to bind to wall · share = ember burst</small></div>
              </div>
            </div>

            <h4>Mobile rituals (gestures)</h4>
            <ul>
              <li><strong>Long-press the center sigil</strong> → radial dial opens. Spin to a route. Release to enter.</li>
              <li><strong>Swipe down from top</strong> → today&apos;s signal overlay slides in. Always one swipe away.</li>
              <li><strong>Swipe up from bottom on Oracle</strong> → prompts pre-filled deck appears, like an iMessage suggestion bar but made of tarot.</li>
              <li><strong>Two-finger tap</strong> → toggle CRT scanlines. (Easter egg, used in lore.)</li>
              <li><strong>Long-press a card</strong> → bind to wall. Subtle haptic. Sigil locks.</li>
              <li><strong>Pull to refresh</strong> → today&apos;s signal redraws. Not the feed.</li>
            </ul>

            <h4>Performance &amp; immersion guardrails</h4>
            <ul>
              <li>Disable the foil shimmer on cards when scrolling. Re-enable on scroll-end.</li>
              <li>Reduce film grain opacity by 30% on mobile to spare GPUs and battery.</li>
              <li>Honor <code>prefers-reduced-motion</code> — replace dial with a list, replace card flips with cross-fades.</li>
              <li>Lazy-load every image. The fold is the page.</li>
              <li>Eagerly preload the next route&apos;s sigil and one image. The transition between routes must be &lt;150ms perceived.</li>
            </ul>
          </div>
        </div>
      </section>


      {/* §VI — CARDS */}
      <section className="chapter" data-screen-label="06 Cards">
        <div className="chapter__head">
          <div className="chapter__roman">VI<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Card &amp; Collectible System</div>
            <h2 className="chapter__title">The archive becomes a deck.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            rarity<br />
            drops<br />
            economy<br />
            loops
            <br /><br />
            <strong>Outcome</strong>
            the conversion engine
          </aside>

          <div className="chapter__main">
            <p className="lede">CultCodex already has a card route. It is a sketch. What follows is a full system — the single most important monetization and retention lever the site has.</p>

            <h4>The cards themselves</h4>
            <p>Cards are <em>moments</em> from the archive, not characters. A card might be a person, an episode, a topic, a quote, a prophecy. Every card cites a real timestamp in a real transmission. They are <em>true artifacts</em>.</p>

            <div className="cards-row">
              <article className="tcard tcard--mythic">
                <div className="tcard__head">
                  <span>◣ THE CULT</span>
                  <span className="tcard__rarity">MYTHIC</span>
                </div>
                <div className="tcard__art">
                  <span className="tcard__sigil">☉</span>
                </div>
                <div className="tcard__name">The Hierophant<small>card no. 001 · psyche</small></div>
                <div className="tcard__stats">
                  <span>EP <b>216</b></span><span>YR <b>2025</b></span>
                  <span>UTTERANCES <b>1,402</b></span><span>HOURS <b>318</b></span>
                </div>
              </article>

              <article className="tcard tcard--rare">
                <div className="tcard__head">
                  <span>◣ THE BETRAYER</span>
                  <span className="tcard__rarity">RARE</span>
                </div>
                <div className="tcard__art">
                  <span className="tcard__sigil">☽</span>
                </div>
                <div className="tcard__name">The Crystal Ball<small>card no. 047 · prophecy</small></div>
                <div className="tcard__stats">
                  <span>EP <b>576</b></span><span>YR <b>2025</b></span>
                  <span>VIEWS <b>14.2K</b></span><span>QUOTES <b>23</b></span>
                </div>
              </article>

              <article className="tcard tcard--common">
                <div className="tcard__head">
                  <span>◣ THE PANEL</span>
                  <span className="tcard__rarity">COMMON</span>
                </div>
                <div className="tcard__art">
                  <span className="tcard__sigil">▣</span>
                </div>
                <div className="tcard__name">The Open Panel<small>card no. 119 · format</small></div>
                <div className="tcard__stats">
                  <span>EP <b>—</b></span><span>YR <b>recurring</b></span>
                  <span>APPEARANCES <b>312</b></span><span>HOURS <b>619</b></span>
                </div>
              </article>

              <article className="tcard tcard--hidden">
                <div className="tcard__head">
                  <span>◣ ???</span>
                  <span className="tcard__rarity">SEALED</span>
                </div>
                <div className="tcard__art">
                  <span className="tcard__sigil">⌬</span>
                </div>
                <div className="tcard__name">Unknown Sigil<small>seek the timestamp</small></div>
                <div className="tcard__stats">
                  <span>SOURCE <b>???</b></span><span>DROP <b>ARG</b></span>
                </div>
              </article>
            </div>

            <h4>Rarity system</h4>
            <table className="rarity-table">
              <thead>
                <tr><th>tier</th><th>frequency in a pack</th><th>visual treatment</th><th>provenance</th></tr>
              </thead>
              <tbody>
                <tr><td>Common</td><td>4 of 5</td><td>bone border · no foil</td><td>recurring formats &amp; topics</td></tr>
                <tr><td>Rare</td><td>1 of 5</td><td>sulphur border · static foil</td><td>memorable single episodes</td></tr>
                <tr><td>Mythic</td><td>1 of 25</td><td>ember border · animated conic foil</td><td>watershed moments · key voices</td></tr>
                <tr><td>Sealed</td><td>ARG only</td><td>phosphor border · veiled</td><td>QR drops, livestream tie-ins, hidden clues</td></tr>
                <tr><td>Etched</td><td>1 per season · global limit</td><td>silver-on-void · individually numbered</td><td>foundational artifacts · season trophies</td></tr>
              </tbody>
            </table>

            <h4>The packs &amp; the economy</h4>
            <ul>
              <li><strong>The Daily Sigil.</strong> Every member gets one free card pull each day. One card. Resets at 00:00 UTC. Missing a day breaks the streak.</li>
              <li><strong>Packs.</strong> Five cards. Bought with credits (&quot;Codex Coins&quot;). 1 pack = 30 coins. Coins purchased in bundles: 30 · 100 · 300 · 800.</li>
              <li><strong>Earning coins.</strong> Members earn coins by: reading a transcript end-to-end (+2), answering an Oracle prompt (+1), correcting an attribution (+5), referring a new initiate (+10).</li>
              <li><strong>Pack rituals.</strong> Pack opening is a 6-second cinematic. The pack envelope smolders, splits, and the five cards fan out one by one. Mythics shake the screen. Sealed cards black out the screen for two beats before revealing.</li>
              <li><strong>Trading.</strong> Phase 2. A marketplace where members can offer cards to other members. No cash — only coin and trade.</li>
              <li><strong>Burning.</strong> Members can <em>burn</em> a duplicate card for coins (10/30/100 by rarity). The card visually combusts. Numbered Etched cards can never be burned.</li>
            </ul>

            <h4>Retention loops — the actual psychology</h4>
            <div className="row-2">
              <div className="box"><h5>Loss aversion</h5><p>Daily sigil + streak counter. Missing it forfeits a &quot;streak fragment.&quot; Three fragments lost = streak broken. Visible streak tally on profile. Cult-grade FOMO.</p></div>
              <div className="box"><h5>Variable reward</h5><p>Pack content is unpredictable. The pack ritual makes the wait theatrical. Mythics &lt; 4% chance. Sealed cards even rarer and announced by drum.</p></div>
              <div className="box"><h5>Public collection</h5><p>Every member has a public wall. Others can see what they own. Mythics light up the wall. This is the prestige axis — not a leaderboard, a gallery.</p></div>
              <div className="box"><h5>Completion drive</h5><p>Cards belong to <em>sets</em> (a season&apos;s voices, an arc, a theme). Sets show 0/12 → 11/12 progress. The last card in a set rewards a unique sigil for the profile.</p></div>
              <div className="box"><h5>Identity capture</h5><p>The first card you pull becomes your <em>mark</em>. Profile color, wall tint, share-card sigil are all derived from that first card. Your collection is your name.</p></div>
              <div className="box"><h5>Social transmission</h5><p>Every card has a 1-tap share-card output (1080×1350 ember-treated). The share-card cites the episode. Friends who click it land on that episode&apos;s first card. Viral loop.</p></div>
            </div>

            <h4>ARG layer — hidden cards</h4>
            <ul>
              <li>A QR code in the studio backdrop of a stream → scan during the broadcast → claim a Sealed card.</li>
              <li>A timestamp in a transcript that says &quot;the sigil at minute 31 is real&quot; → visit /codex/31 → claim.</li>
              <li>A daily cryptic line on the Oracle page that, decoded, points to a transcript phrase — first 50 to find it get the card.</li>
              <li>A locked sigil somewhere in the nav that only unlocks after a certain set is complete — reveals the next season&apos;s first card.</li>
              <li>A Sealed card hides every Friday at 22:22 ET (the Cult of Psyche stream time). Reveal lasts 22 minutes. <em>Be there or never own this artifact.</em></li>
            </ul>

            <h4>Seasons</h4>
            <p>The card system runs in <strong>seasons</strong>, each 90 days, each themed (Season I: <em>The Voices</em>; II: <em>The Prophecies</em>; III: <em>The Betrayals</em>; IV: <em>The Cult Itself</em>). At the close of a season:</p>
            <ul>
              <li>The season&apos;s Etched card is minted, numbered, distributed to top collectors.</li>
              <li>Sealed cards from the season become Vaulted — no longer obtainable. Owners get a Vaulted badge.</li>
              <li>A season-end ritual: a 24-hour broadcast where the season&apos;s mythos is recapped, new sigils revealed, the next season&apos;s first card drops live.</li>
            </ul>

            <h4>How the cards plug back into the archive</h4>
            <p>A card is also a portal. Every card links to the moment it was drawn from. A user&apos;s wall becomes a curated path through the archive. The whole site doubles as a card-game and as an encyclopedia. The card is the candy. The transcript is the meal. <em>Both feed.</em></p>
          </div>
        </div>
      </section>


      {/* §VII — MOTION */}
      <section className="chapter" data-screen-label="07 Motion">
        <div className="chapter__head">
          <div className="chapter__roman">VII<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Motion Design &amp; Atmosphere</div>
            <h2 className="chapter__title">Motion as <em>liturgy.</em></h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            principles<br />
            moments<br />
            audio<br />
            restraint
          </aside>

          <div className="chapter__main">
            <p className="lede">Motion on CultCodex should feel like an old terminal warming up — not like a startup landing page. Slow. Confident. With purpose. The brand&apos;s enemy is the parallax-scroll demo.</p>

            <h4>Motion principles — the five vows</h4>
            <ul>
              <li><strong>Slow on, slow off.</strong> Easing curves are cubic-bezier(.2,.7,.2,1) or slower. Default duration 480ms. Nothing snaps.</li>
              <li><strong>Single subject.</strong> One thing moves at a time per viewport. Two animations playing simultaneously breaks the spell.</li>
              <li><strong>Counter-rotation.</strong> When something rotates, something else rotates the other way. Two rings, never one. This single rule produces 80% of the visual mood.</li>
              <li><strong>Anticipation &gt; result.</strong> Pack openings, card flips, Oracle answers all begin with a held breath before they happen. 250ms of nothing earns 500ms of motion.</li>
              <li><strong>Reduced motion is sacred.</strong> If the user has asked the OS to be still, the site is still. No exceptions, no compromises.</li>
            </ul>

            <h4>Where motion is subtle</h4>
            <ul>
              <li>The sigil in the top-left breathes (scale 1.0 → 1.02 over 5s, then back).</li>
              <li>Counters tick — one digit at a time, with a 90ms flicker.</li>
              <li>The grain noise has a 0.8% drift across 12s — just enough that the film is alive.</li>
              <li>Hover on cards: 6° tilt, foil shimmer, 1px ember underline appears on the title.</li>
              <li>The &quot;uplink stable&quot; pip pulses every 2s. Always.</li>
            </ul>

            <h4>Where motion is dramatic</h4>
            <ul>
              <li><strong>Page-load threshold.</strong> 1.8s curtain. Sigil draws itself stroke-by-stroke. Two rings spin into place. Title cascades in 80ms staggered. Then everything holds for 400ms before fading the page in.</li>
              <li><strong>Oracle invocation.</strong> When the user submits a question, the input dims, a thin ember progress line rises from the bottom, the answer streams character-by-character at 22ms/char (typewriter), with the cursor a slow-blinking phosphor.</li>
              <li><strong>Pack opening.</strong> See §VI. Six seconds. Earned theatre.</li>
              <li><strong>Card mythic reveal.</strong> Conic foil rotates fully once, screen darkens for one beat, ember pulse, name reveal in Bodoni italic with a small drop-shadow tremor.</li>
              <li><strong>Page transitions.</strong> A bone curtain wipes top-to-bottom with a sigil stamp in the center. 320ms in, hold 100ms, 320ms out.</li>
            </ul>

            <h4>Audio</h4>
            <p>Audio is the secret weapon. Most occult sites avoid sound out of fear of being intrusive. Build it correctly and it becomes the unforgettable element.</p>
            <ul>
              <li><strong>Default OFF.</strong> A single icon, lower-left, sigil ☽. Click → enables ambient.</li>
              <li><strong>Ambient layer.</strong> A 6-minute looping bed: low drone (35hz pad), tape hiss, distant choir, occasional CRT static pop.</li>
              <li><strong>Interaction sounds.</strong> A soft &quot;ink&quot; tick on tap. A slow chime on pack open. A bell on mythic reveal. A muted rotary click on dial spin.</li>
              <li><strong>Oracle voice.</strong> Optional — whispered TTS of the Oracle&apos;s answer, layered under the typing. Massive immersion lever.</li>
              <li><strong>The bell.</strong> A real, recorded bell sound that rings only at 22:22 ET (stream start). Anyone with audio on hears it. Becomes a Pavlovian appointment.</li>
            </ul>

            <h4>Shader ideas (used sparingly)</h4>
            <ul>
              <li>A WebGL noise field behind the threshold sigil — perlin distortion, ember tint, mouse-following. Runs only on desktop with sufficient GPU.</li>
              <li>A signed-distance-field &quot;fog&quot; layer in the Oracle&apos;s empty state — like staring into water.</li>
              <li>A liquid-mercury hover state on Mythic cards (single fragment shader, ~3kb).</li>
            </ul>

            <h4>&quot;Summoning&quot; interactions</h4>
            <ul>
              <li>Holding the Oracle submit for 2s shows a small charging ring; release with the ring full → the answer comes from the &quot;deep oracle&quot; — a slower, longer, more interpretive response.</li>
              <li>The 22:22 bell, if clicked within 22 seconds of ringing, drops a one-time card.</li>
              <li>Solo Oracle questions submitted between 03:00–05:00 local get a different visual treatment (deeper bruise tint, different cursor). <em>The witching-hour mode.</em> Quiet feature. No marketing. Power users find it.</li>
            </ul>
          </div>
        </div>
      </section>


      {/* §VIII — MONETIZATION */}
      <section className="chapter" data-screen-label="08 Monetization">
        <div className="chapter__head">
          <div className="chapter__roman">VIII<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Monetization &amp; Tiers</div>
            <h2 className="chapter__title">A vow, not a checkout.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            tiers<br />
            mechanics<br />
            ladder<br />
            atmosphere
          </aside>

          <div className="chapter__main">
            <p className="lede">&quot;Initiate+ · $10/mo&quot; is the right idea executed as a SaaS billing form. The pricing is fine. The framing needs to be a rite.</p>

            <h4>The Four Thresholds</h4>

            <div className="ladder">
              <div className="tier">
                <span className="tier__num">I</span>
                <div className="tier__name">Visitor<small>The Threshold</small></div>
                <div className="tier__perks">Free access to the archive · daily signal · 10 Oracle questions per month · 1 starter card on initiation</div>
                <span className="tier__price">free · forever</span>
              </div>
              <div className="tier tier--initiate">
                <span className="tier__num">II</span>
                <div className="tier__name">Initiate<small>The Vow</small></div>
                <div className="tier__perks">100 Oracle questions/month · full transcripts · daily card pull · 4 packs/month · public wall · share-card export</div>
                <span className="tier__price">$10 / mo · $96 / yr</span>
              </div>
              <div className="tier tier--magus">
                <span className="tier__num">III</span>
                <div className="tier__name">Adept<small>The Robe</small></div>
                <div className="tier__perks">All Initiate · &quot;Deep Oracle&quot; mode · early access to drops · 10 packs/month · 1 guaranteed Mythic per season · custom sigil on wall · livestream backstage</div>
                <span className="tier__price">$22 / mo · $216 / yr</span>
              </div>
              <div className="tier tier--hierophant">
                <span className="tier__num">IV</span>
                <div className="tier__name">Hierophant<small>The Sigil-Bearer · limited</small></div>
                <div className="tier__perks">All Adept · 1 Etched card per season (numbered) · quarterly private call with Psyche · name engraved in the colophon · permanent vault access · founding sigil retains forever</div>
                <span className="tier__price">$88 / mo · cap 222 seats</span>
              </div>
            </div>

            <h4>How the conversion works without breaking the spell</h4>
            <ul>
              <li>The CTA is never &quot;Buy.&quot; It is always &quot;<em>Take the vow.</em>&quot; / &quot;<em>Don the robe.</em>&quot; / &quot;<em>Bear the sigil.</em>&quot;</li>
              <li>The checkout itself is custom-themed. Stripe Elements styled in Cinzel + JetBrains Mono, ember accents, sigil header.</li>
              <li>The receipt is a transmission. A real-looking document with TX-ID, sigil, and a one-line piece of mythology unique to the day. People will frame these.</li>
              <li>After payment, the new Initiate is greeted with a custom sigil for their profile, their first guaranteed pack, and an Oracle prompt unique to them: <em>&quot;You have crossed the threshold. What did you bring with you?&quot;</em></li>
            </ul>

            <h4>Other monetization levers (without damaging atmosphere)</h4>
            <ul>
              <li><strong>Coin bundles.</strong> Direct purchase. 100 / 300 / 800 / 2000. Tied to the card economy, never to &quot;site features.&quot;</li>
              <li><strong>Etched cards.</strong> 22 issued per season at $222 each, outside any tier. Become the funding floor and an ultra-prestige item.</li>
              <li><strong>Premium archives.</strong> Specific deep-dive transcripts and AI breakdowns hidden behind Adept tier.</li>
              <li><strong>Live events &amp; broadcasts.</strong> Quarterly ticketed broadcasts in addition to free streams. Ticket = an Etched-tier card.</li>
              <li><strong>Mystery boxes.</strong> &quot;The Box&quot; — one-time $44 purchase, unlocks 22 packs over 22 days, one per day. Built-in retention.</li>
              <li><strong>Donations.</strong> A &quot;burn an offering&quot; page. Pay anything ≥ $5. Get nothing but a numbered sigil. Tip jar reimagined.</li>
              <li><strong>Creator tools.</strong> Phase 3 — let voices in the archive earn coins when their cards are pulled.</li>
            </ul>

            <p className="pull">Pricing is not the wall. <em>Framing</em> is. The same $10 month becomes a transcendent decision if the page that asks for it sounds like a temple, not a Calendly.</p>
          </div>
        </div>
      </section>


      {/* §IX — TECHNICAL */}
      <section className="chapter" data-screen-label="09 Technical">
        <div className="chapter__head">
          <div className="chapter__roman">IX<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Technical Recommendations</div>
            <h2 className="chapter__title">Build for theatre <em>and</em> speed.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            stack<br />
            perf<br />
            assets<br />
            pipeline
          </aside>

          <div className="chapter__main">
            <p>The site appears to be Next.js (based on the <code>_next/image</code> path in the markup). That is correct — do not change it. The recommendations here are <em>additive</em>: how to keep the cinematic ambition without surrendering performance.</p>

            <h4>Frontend stack</h4>
            <ul>
              <li><strong>Next.js App Router</strong> with React Server Components for the archive pages. Most CultCodex content is read-only and benefits from streaming SSR.</li>
              <li><strong>Tailwind + a tiny custom design-token layer.</strong> Single source of truth for the palette/spacing/type-scale. Tokens map 1:1 to CSS variables.</li>
              <li><strong>Motion library: Motion (formerly Framer Motion)</strong> for React-level orchestration, plus <strong>GSAP</strong> only for the threshold/pack/card-reveal cinematics.</li>
              <li><strong>WebGL via OGL or three.js</strong> — lightweight, only loaded on the threshold and Oracle empty-state. Hydrate behind <code>IntersectionObserver</code> + <code>requestIdleCallback</code>.</li>
              <li><strong>Howler.js</strong> for the ambient/interaction audio layer. Lightweight, well-supported.</li>
              <li><strong>tRPC or Hono</strong> for the internal API layer. The Oracle and card economy benefit from typed RPC.</li>
            </ul>

            <h4>Rendering strategies</h4>
            <ul>
              <li><strong>Archive pages</strong> — ISR with on-demand revalidation when a new episode drops or a transcript completes.</li>
              <li><strong>Card pages</strong> — SSG. The card art is static once generated. Re-render only on rarity-promotion events.</li>
              <li><strong>Oracle</strong> — server-streamed responses (edge runtime). The 22ms/char typewriter effect is just SSE rendered server-side with token streaming.</li>
              <li><strong>Pulse counters</strong> — client-fetched on mount, then websocket-subscribed for live updates (a single channel, low-bandwidth).</li>
              <li><strong>Profile / wall</strong> — client-rendered behind auth. The most dynamic part of the site.</li>
            </ul>

            <h4>Image &amp; font handling</h4>
            <ul>
              <li>Continue using <code>next/image</code>. Add a custom loader that applies the film treatment (desaturate + duotone + grain) at the CDN layer.</li>
              <li>Cards are SVG-composited from a base template + dynamic text + an art layer. Render once, cache as PNG for share-card output (1080×1350) at the edge.</li>
              <li>Self-host the four fonts via <code>next/font</code>. Subset to Latin + the sigil characters used. Bodoni Moda + Cinzel are heavy — subset aggressively.</li>
              <li>One global SVG noise sprite. Reused everywhere. Cacheable.</li>
              <li>Preload the top-of-fold sigil glyph as an inline SVG to avoid FOIT.</li>
            </ul>

            <h4>Performance budget</h4>
            <ul>
              <li>LCP ≤ 1.6s on 4G. Threshold sigil counts as LCP; preload it.</li>
              <li>CLS = 0. The cinematic intro reserves its space.</li>
              <li>JS bundle on homepage ≤ 140kb gzipped. The motion library is the largest item — load on idle.</li>
              <li>The audio bed loads <em>only</em> if the user has enabled audio. Until then, zero bytes.</li>
              <li>WebGL is gated behind <code>matchMedia(&apos;(min-width:1024px) and (any-hover:hover)&apos;)</code> &amp; a feature-detect.</li>
            </ul>

            <h4>CMS &amp; content pipeline</h4>
            <ul>
              <li>Episodes are CMS-backed. <strong>Sanity</strong> or <strong>Payload</strong> with a strict schema: title, panelists, date, signals, captions, transcribed flag.</li>
              <li><strong>Caption normalization</strong> — <em>this is the single most important pipeline rule.</em> Strip YouTube auto-descriptions. Build a small &quot;editorial caption&quot; field. If empty, default to <em>&quot;No caption recorded for this transmission.&quot;</em> Never autopaste the streamer&apos;s promo copy.</li>
              <li>Transcription queue visible internally as a status board. Hook the public &quot;56%&quot; meter to that board.</li>
              <li>Card definitions in a typed config file (rarities, sets, season membership, art source). Single source of truth.</li>
              <li>The Oracle is an LLM gateway behind your own thin service. Use embeddings over the transcript corpus + RAG. Cite every claim to a real episode + timestamp. <em>This is the trust anchor of the whole site.</em></li>
            </ul>
          </div>
        </div>
      </section>


      {/* §X — COMPETITIVE */}
      <section className="chapter" data-screen-label="10 Competitive">
        <div className="chapter__head">
          <div className="chapter__roman">X<small>Chapter</small></div>
          <div>
            <div className="chapter__kicker">Competitive Comparison</div>
            <h2 className="chapter__title">What this could be compared to <em>fairly</em>.</h2>
          </div>
        </div>

        <div className="chapter__body">
          <aside className="chapter__margin">
            <strong>Reading</strong>
            benchmarks<br />
            gaps<br />
            opportunities
          </aside>

          <div className="chapter__main">
            <p>The honest version is: nothing else lives where CultCodex could live. Below is a tour of the adjacent rooms and what each one teaches.</p>

            <table className="compare">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Aesthetic</th>
                  <th>Mechanic</th>
                  <th>What CultCodex can take</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Are.na</td>
                  <td>refined · monochrome · scholarly</td>
                  <td>collaborative collections</td>
                  <td>quiet density · collection-as-identity · footer-anchored prestige</td>
                </tr>
                <tr>
                  <td>A24 / Horror Site Designs</td>
                  <td>cinematic full-bleed · serif italic · type-as-image</td>
                  <td>title-card hero · letterboxed image grids</td>
                  <td>the 100vh threshold · the title-card pause · big italic Bodoni</td>
                </tr>
                <tr>
                  <td>Otherland / Cyberpunk archives</td>
                  <td>terminal · monospace · CRT</td>
                  <td>command palette · console pips</td>
                  <td>already taken — keep going</td>
                </tr>
                <tr>
                  <td>Snake Oil / Yale Web Almanac type sites</td>
                  <td>brutalist editorial · column grids · footnotes</td>
                  <td>long-scroll archive · pull quotes · margin notes</td>
                  <td>the dossier feel · margin pages · numbered chapters</td>
                </tr>
                <tr>
                  <td>Pokémon TCG Live / Marvel Snap</td>
                  <td>card-game polish · animated reveals · ladders</td>
                  <td>rarity, packs, ladders, seasons</td>
                  <td>the entire card system (§VI) — reskinned occult</td>
                </tr>
                <tr>
                  <td>Bandersnatch / experimental ARG sites</td>
                  <td>hidden routes · cryptic clues · time-gated content</td>
                  <td>Easter eggs · QR drops · 22:22 windows</td>
                  <td>the ARG layer (§VI) — the unfair advantage</td>
                </tr>
                <tr>
                  <td>The New Inquiry / NLR / lit journals</td>
                  <td>typographic restraint · serif body · marginalia</td>
                  <td>essay-grade reading · slow-burn footers</td>
                  <td>the long-form transcript page treatment · the Psychenomicon</td>
                </tr>
                <tr>
                  <td>Goth / fashion sites (Rick Owens, Yohji)</td>
                  <td>charcoal · maximal black · one accent</td>
                  <td>image-led storytelling · luxury restraint</td>
                  <td>the all-void palette · single ember moments</td>
                </tr>
                <tr>
                  <td>Substack / Patreon</td>
                  <td>generic · sterile · clean</td>
                  <td>subscription · creator economy</td>
                  <td>nothing visually · <em>everything</em> to avoid</td>
                </tr>
              </tbody>
            </table>

            <h4>Where CultCodex is already <em>stronger</em></h4>
            <ul>
              <li>It has a sigil-based information architecture. None of the above do.</li>
              <li>It has a real LLM-backed Oracle that cites real episodes. Are.na has nothing like this. A24 doesn&apos;t ship product. Nobody has this.</li>
              <li>It has 1.5K+ real episodes of source material. That is a moat. ARG sites are usually fictional and finite. CultCodex&apos;s mythology is real and growing.</li>
              <li>It has a daily-return habit-loop (today&apos;s signal). Card games have ladders; archives don&apos;t have daily rituals. CultCodex has both.</li>
            </ul>

            <h4>Where it feels weaker (today)</h4>
            <ul>
              <li>No 100vh title-card moment (A24 destroys it).</li>
              <li>Card system is only sketched (TCG sites set the bar visually).</li>
              <li>No marginalia / footnotes / dossier feel on long-form content (NLR / The New Inquiry).</li>
              <li>Mobile UX is not yet phone-first (every modern app is).</li>
              <li>No social shareable artefact (Substack at least gives you a thumbnail).</li>
            </ul>

            <h4>Where it can dominate culturally</h4>
            <p>None of the references above sit in the intersection of <em>real archive + card game + ARG + cult media</em>. That intersection is wide open. CultCodex can become the canonical example of an &quot;internet-native mythology platform&quot; — a category that doesn&apos;t have a clean name yet. The right move is to <em>name the category by being it</em>, then let other things imitate.</p>
          </div>
        </div>
      </section>


      {/* §XI — VISION */}
      <section className="vision" data-screen-label="11 Vision">
        <div className="sigil dim" style={{ marginBottom: "2rem" }}>§ XI · Master Redesign Vision</div>

        <div className="vision__sigil">◣</div>

        <div className="vision__display">
          Build the only<br />
          <em>place</em> on the<br />
          internet that<br />
          feels like<br />
          <em style={{ color: "var(--ember)" }}>11:11 pm.</em>
        </div>

        <div className="vision__body">
          <p>The user arrives. The room is dim. A sigil rotates. A bell tolls somewhere. A voice (their Oracle) asks what they came to learn. They are handed a card. They are told the time of the next broadcast. They leave with a sigil under their name and a mark on their wall.</p>

          <p>They come back the next night. The signal has changed. There is one new card on their wall. The Oracle remembers their question. The archive has 23 more transmissions than the night before. Their streak now reads <em>14.</em></p>

          <p>They come back the night after. Etched card 13/22 of the new season drops at 22:22. They are early. They reach for their phone before the bell finishes ringing.</p>

          <p>This is not a content site. It is a <em>place</em>. Specifically, a place between waking and sleeping, between scholarship and superstition, between fandom and faith. The brand is the room itself.</p>
        </div>

        <div style={{ fontFamily: "var(--dossier-font-display), Bodoni Moda, serif", fontStyle: "italic", color: "var(--bone-dim)", fontSize: "1.1rem", margin: "3rem auto 1rem" }}>— the seven creeds of the codex —</div>

        <div className="vision__creed">
          nothing rushes ·<br />
          every surface is consecrated ·<br />
          motion is liturgy not decoration ·<br />
          the spell never breaks below the fold ·<br />
          every card cites a real moment ·<br />
          the user owns more each night than the last ·<br />
          the temple is on the phone, in bed, at eleven eleven.
        </div>
      </section>


      {/* SEAL */}
      <footer className="seal" data-screen-label="Seal">
        <div className="seal__col">
          <strong>End of Transmission</strong><br />
          file · codex.audit.v001<br />
          archived · 2026.05.20<br />
          pages · 60
        </div>
        <div className="seal__sigil">◣</div>
        <div className="seal__col">
          <strong>Next Transmission</strong><br />
          on request of the recipient<br />
          subjects available · mobile prototype · oracle UI · card sheet<br />
          <span className="phosphor">▸ uplink remains open</span>
        </div>
      </footer>

    </div>
  );
}
