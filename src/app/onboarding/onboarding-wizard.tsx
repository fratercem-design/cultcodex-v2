"use client";

import { trustedSummary } from "@/lib/format/speculative-summary";
import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeOnboarding, type OnboardingResult } from "./actions";

// ─── Sigil ───────────────────────────────────────────────────────────────────

const SIGILS = [
  "⊕","⊗","⊘","⊙","⊛","⊚","◈","◎","◉","◐",
  "◑","◒","◓","☿","♆","♇","⚶","⚷","⚸","⚺",
  "✦","✧","✶","✷","✸","✹",
];

function computeSigil(handle: string): string {
  if (!handle) return "◉";
  let sum = 0;
  for (let i = 0; i < handle.length; i++) sum += handle.charCodeAt(i);
  return SIGILS[sum % SIGILS.length];
}

// ─── Vibe options ────────────────────────────────────────────────────────────

const VIBES = [
  {
    key: "consciousness",
    glyph: "◐",
    label: "CONSCIOUSNESS",
    desc: "The inner world — psyche, altered states, the architecture of mind",
  },
  {
    key: "synthetic",
    glyph: "⊗",
    label: "SYNTHETIC",
    desc: "AI, technology, digital consciousness — the machine that thinks",
  },
  {
    key: "esoteric",
    glyph: "✦",
    label: "THE ESOTERIC",
    desc: "Occult, ritual, hidden knowledge — what the uninitiated cannot see",
  },
  {
    key: "human",
    glyph: "◉",
    label: "THE HUMAN",
    desc: "Behavior, society, patterns — the species examining itself",
  },
  {
    key: "unknown",
    glyph: "⊕",
    label: "THE UNKNOWN",
    desc: "Wild, unexpected, unclassified — whatever finds you",
  },
] as const;

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  void: "#07060a",
  ink: "#0c0b11",
  bone: "#ebe3d2",
  ember: "#c8392e",
  sulphur: "#d6a017",
  muted: "#6b6070",
  line: "#2a2535",
} as const;

// ─── Shared style helpers ─────────────────────────────────────────────────────

const mono: CSSProperties = { fontFamily: "var(--font-mono), monospace" };

function label(text: string, extra?: CSSProperties): CSSProperties {
  return {
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: C.muted,
    ...extra,
  };
}

function heading(extra?: CSSProperties): CSSProperties {
  return {
    fontSize: "clamp(22px, 5vw, 36px)",
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: C.bone,
    margin: 0,
    lineHeight: 1.1,
    ...extra,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

type CompletedResult = Extract<OnboardingResult, { success: true }>;

interface WizardProps {
  displayName: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OnboardingWizard({ displayName }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState(true);

  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");
  const [vibeChoice, setVibeChoice] = useState("");
  const [firstQuestion, setFirstQuestion] = useState("");
  const [result, setResult] = useState<CompletedResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();

  const sigil = computeSigil(handle.toLowerCase());

  // ── Transitions ─────────────────────────────────────────────────────────

  function goTo(next: number) {
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
    }, 280);
  }

  // ── Step handlers ────────────────────────────────────────────────────────

  function submitStep1() {
    const h = handle.toLowerCase().trim();
    if (!h) { setHandleError("Choose a handle to continue"); return; }
    if (h.length < 2) { setHandleError("Must be at least 2 characters"); return; }
    if (h.length > 20) { setHandleError("Must be 20 characters or fewer"); return; }
    if (!/^[a-z0-9_]+$/.test(h)) { setHandleError("Letters, numbers, and underscores only"); return; }
    setHandleError("");
    goTo(2);
  }

  function submitStep2() {
    if (!vibeChoice) return;
    goTo(3);
  }

  function submitStep3() {
    setSubmitError("");
    startTransition(async () => {
      const res = await completeOnboarding({ handle: handle.toLowerCase().trim(), vibeChoice, firstQuestion });
      if ("error" in res) {
        if (res.error.toLowerCase().includes("handle")) {
          setHandleError(res.error);
          setVisible(false);
          setTimeout(() => { setStep(1); setVisible(true); }, 280);
        } else {
          setSubmitError(res.error);
        }
        return;
      }
      setResult(res);
      goTo(4);
    });
  }

  // ── Layout shells ────────────────────────────────────────────────────────

  const overlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    backgroundColor: C.void,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ...mono,
    color: C.bone,
    padding: "24px 20px",
    overflowY: "auto",
  };

  const panel: CSSProperties = {
    maxWidth: 520,
    width: "100%",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
    transition: "opacity 280ms ease, transform 280ms ease",
  };

  const cornerBase: CSSProperties = {
    position: "absolute",
    width: 20,
    height: 20,
    pointerEvents: "none",
  };

  const btnPrimary: CSSProperties = {
    background: C.ember,
    color: C.bone,
    border: "none",
    padding: "12px 32px",
    fontSize: 11,
    letterSpacing: "0.14em",
    fontFamily: "inherit",
    cursor: "pointer",
    fontWeight: 600,
  };

  const btnGhost: CSSProperties = {
    background: "transparent",
    color: C.muted,
    border: `1px solid ${C.line}`,
    padding: "10px 24px",
    fontSize: 11,
    letterSpacing: "0.12em",
    fontFamily: "inherit",
    cursor: "pointer",
  };

  // ── Step indicator ───────────────────────────────────────────────────────

  const stepDots = (
    <div style={{ position: "absolute", top: 24, right: 28, display: "flex", gap: 7, alignItems: "center" }}>
      {[1,2,3,4,5].map((n) => (
        <div
          key={n}
          style={{
            width: n === step ? 8 : 5,
            height: n === step ? 8 : 5,
            borderRadius: "50%",
            backgroundColor: n === step ? C.ember : n < step ? C.sulphur : C.muted,
            transition: "all 280ms ease",
          }}
        />
      ))}
    </div>
  );

  const corners = (
    <>
      <div style={{ ...cornerBase, top: 16, left: 16, borderTop: `1px solid ${C.ember}30`, borderLeft: `1px solid ${C.ember}30` }} />
      <div style={{ ...cornerBase, top: 16, right: 16, borderTop: `1px solid ${C.ember}30`, borderRight: `1px solid ${C.ember}30` }} />
      <div style={{ ...cornerBase, bottom: 16, left: 16, borderBottom: `1px solid ${C.ember}30`, borderLeft: `1px solid ${C.ember}30` }} />
      <div style={{ ...cornerBase, bottom: 16, right: 16, borderBottom: `1px solid ${C.ember}30`, borderRight: `1px solid ${C.ember}30` }} />
    </>
  );

  // ── Step content ─────────────────────────────────────────────────────────

  const content = (() => {
    // ── 01 · The Name ──────────────────────────────────────────────────
    if (step === 1) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <div style={label("", { marginBottom: 10 })}>01 · THE NAME</div>
          <h1 style={heading()}>What are you called<br />in the Codex?</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
            {displayName ? `Welcome, ${displayName}. ` : ""}
            Choose a handle that will identify you inside the archive. It cannot be changed later.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                border: `1px solid ${C.ember}60`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                color: C.sulphur,
                flexShrink: 0,
                transition: "all 200ms",
              }}
            >
              {sigil}
            </div>
            <input
              type="text"
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20));
                setHandleError("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") submitStep1(); }}
              placeholder="your_handle"
              maxLength={20}
              autoFocus
              style={{
                flex: 1,
                background: C.ink,
                border: `1px solid ${handleError ? C.ember : C.line}`,
                color: C.bone,
                padding: "12px 14px",
                fontSize: 14,
                letterSpacing: "0.06em",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          {handleError && (
            <div style={{ fontSize: 11, color: C.ember, letterSpacing: "0.06em" }}>{handleError}</div>
          )}
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.06em" }}>
            {handle
              ? `Your sigil: ${sigil} · handle: ${handle.toLowerCase()}`
              : "2–20 characters · letters, numbers, underscores"}
          </div>
        </div>

        <button style={btnPrimary} onClick={submitStep1}>
          BIND THE NAME →
        </button>
      </div>
    );

    // ── 02 · The First Card ────────────────────────────────────────────
    if (step === 2) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <div style={label("", { marginBottom: 10 })}>02 · THE FIRST CARD</div>
          <h1 style={heading()}>What draws you<br />to the stream?</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
            Your answer determines your first card. Choose honestly.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {VIBES.map((v) => (
            <button
              key={v.key}
              onClick={() => setVibeChoice(v.key)}
              style={{
                background: vibeChoice === v.key ? `${C.ember}18` : "transparent",
                border: `1px solid ${vibeChoice === v.key ? C.ember : C.line}`,
                color: vibeChoice === v.key ? C.bone : C.muted,
                padding: "14px 16px",
                fontFamily: "inherit",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                transition: "all 150ms ease",
              }}
            >
              <span style={{ fontSize: 18, color: vibeChoice === v.key ? C.sulphur : C.muted, flexShrink: 0, lineHeight: 1.2 }}>
                {v.glyph}
              </span>
              <span>
                <div style={{ fontSize: 11, letterSpacing: "0.12em", marginBottom: 4, fontWeight: 600 }}>{v.label}</div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: C.muted }}>{v.desc}</div>
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button style={btnGhost} onClick={() => goTo(1)}>← BACK</button>
          <button
            style={{ ...btnPrimary, opacity: vibeChoice ? 1 : 0.4, cursor: vibeChoice ? "pointer" : "default" }}
            onClick={submitStep2}
            disabled={!vibeChoice}
          >
            GRANT THE CARD →
          </button>
        </div>
      </div>
    );

    // ── 03 · The First Question ────────────────────────────────────────
    if (step === 3) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <div style={label("", { marginBottom: 10 })}>03 · THE FIRST QUESTION</div>
          <h1 style={heading()}>What did you come<br />here to learn?</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 12, lineHeight: 1.6 }}>
            Your question is sealed into the archive. It may surface again — in Oracle, in the signal, in the stream.
          </p>
        </div>

        <textarea
          value={firstQuestion}
          onChange={(e) => setFirstQuestion(e.target.value)}
          placeholder="Ask anything. Or say nothing."
          rows={4}
          style={{
            background: C.ink,
            border: `1px solid ${C.line}`,
            color: C.bone,
            padding: "14px",
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
          }}
        />

        {submitError && (
          <div style={{ fontSize: 11, color: C.ember, letterSpacing: "0.06em" }}>{submitError}</div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button style={btnGhost} onClick={() => goTo(2)}>← BACK</button>
          <button
            style={{ ...btnPrimary, opacity: isPending ? 0.6 : 1 }}
            onClick={submitStep3}
            disabled={isPending}
          >
            {isPending ? "SEALING..." : "SEAL THE QUESTION →"}
          </button>
        </div>
      </div>
    );

    // ── 04 · The First Signal ──────────────────────────────────────────
    if (step === 4 && result) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <div style={label("", { marginBottom: 10 })}>04 · THE FIRST SIGNAL</div>
          <h1 style={heading()}>Your transmission<br />awaits</h1>
          {result.starterCard && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 16px",
                border: `1px solid ${C.sulphur}40`,
                background: `${C.sulphur}0a`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20, color: C.sulphur }}>◈</span>
              <div>
                <div style={{ fontSize: 10, color: C.sulphur, letterSpacing: "0.14em", marginBottom: 2 }}>
                  STARTER CARD GRANTED
                </div>
                <div style={{ fontSize: 13, color: C.bone }}>
                  {result.starterCard.title}
                  <span style={{ marginLeft: 8, fontSize: 10, color: C.muted }}>
                    [{result.starterCard.rarity}]
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {result.firstEpisode ? (
          <Link
            href={`/episodes/${result.firstEpisode.slug}`}
            style={{
              display: "block",
              border: `1px solid ${C.line}`,
              overflow: "hidden",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 150ms",
            }}
          >
            {result.firstEpisode.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.firstEpisode.thumbnailUrl}
                alt=""
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
              />
            )}
            <div style={{ padding: "14px 16px", background: C.ink }}>
              {result.firstEpisode.episodeNumber && (
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.14em", marginBottom: 6 }}>
                  TX-{String(result.firstEpisode.episodeNumber).padStart(4, "0")}
                </div>
              )}
              <div style={{ fontSize: 14, color: C.bone, marginBottom: 6, fontWeight: 500 }}>
                {result.firstEpisode.title}
              </div>
              {trustedSummary(result.firstEpisode.summaryShort) && (
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                  {trustedSummary(result.firstEpisode.summaryShort)?.slice(0, 120)}…
                </div>
              )}
            </div>
          </Link>
        ) : (
          <Link
            href="/episodes"
            style={{
              display: "block",
              padding: "20px",
              border: `1px solid ${C.line}`,
              textAlign: "center",
              color: C.muted,
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            Browse the full archive →
          </Link>
        )}

        <button style={btnPrimary} onClick={() => goTo(5)}>
          CONTINUE →
        </button>
      </div>
    );

    // ── 05 · The Vow ──────────────────────────────────────────────────
    if (step === 5 && result) return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 52,
              color: C.sulphur,
              marginBottom: 16,
              lineHeight: 1,
              textShadow: `0 0 30px ${C.sulphur}60`,
            }}
          >
            {result.sigilGlyph}
          </div>
          <div style={label("", { marginBottom: 8, textAlign: "center" })}>05 · THE VOW</div>
          <h1 style={{ ...heading({ textAlign: "center" }) }}>
            Welcome to the archive,<br />
            <span style={{ color: C.sulphur }}>{result.handle}</span>
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 12, lineHeight: 1.7 }}>
            The Codex is open to you. Every transmission, every signal, every thread of the stream.
            Initiates carry the archive forward.
          </p>
        </div>

        <div
          style={{
            border: `1px solid ${C.ember}40`,
            padding: "20px 24px",
            background: `${C.ember}08`,
          }}
        >
          <div style={{ fontSize: 11, color: C.ember, letterSpacing: "0.14em", marginBottom: 8 }}>
            INITIATE+ · UNLOCK THE FULL ARCHIVE
          </div>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: "0 0 16px" }}>
            Oracle AI search across nearly 3,000 transmissions. The Psychenomicon. Personal codex page.
            Priority access to new features.
          </p>
          <button
            style={{ ...btnPrimary, width: "100%" }}
            onClick={() => router.push("/premium")}
          >
            TAKE THE VOW
          </button>
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            style={{ ...btnGhost, fontSize: 11 }}
            onClick={() => router.push("/")}
          >
            CONTINUE AS ACOLYTE
          </button>
        </div>
      </div>
    );

    return null;
  })();

  return (
    <div style={overlay}>
      {corners}
      {stepDots}
      <div style={panel}>{content}</div>
    </div>
  );
}
