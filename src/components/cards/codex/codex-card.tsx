"use client";

/**
 * The one CultCodex card frame. Every card on the site (Codex, pack openings,
 * decks, member pages) renders through this so they read as one set.
 *
 * Sizing comes from the parent: the card fills its container's width at a
 * 5:7 ratio and all type is in container units, so it scales cleanly.
 */
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { CardType, Rarity } from "@/generated/prisma/client";
import { CARD_TYPE_GLYPH, STAT_LABELS } from "@/lib/cards/rarity";
import { catalogEntry, getSeason, OBTAIN_LABEL } from "@/lib/cards/codex/catalog";
import type { Motif, ObtainMethod, Palette } from "@/lib/cards/codex/types";
import { ArtScene } from "@/components/cards/vault/art";
import type { VaultCard } from "@/components/cards/vault/constants";
import { CodexArt } from "./codex-art";
import "./codex.css";

export const RARITY_COLOR: Record<Rarity, string> = {
  STATIC:       "#c7d0c8",
  SIGNAL:       "#ffab36",
  TRANSMISSION: "#3ee895",
  ANOMALY:      "#ff4d8d",
  ORACLE:       "#34d6ff",
  LEGENDARY:    "#f6c453",
  MYTHIC:       "#b27bff",
  FORBIDDEN:    "#ff2e2e",
};

export interface CodexCardData {
  slug: string;
  title: string;
  subtitle?: string | null;
  cardType: CardType;
  rarity: Rarity;
  flavourText?: string | null;
  statA: number;
  statB: number;
  statC: number;
  abilities?: string[];
  artUrl?: string | null;
  season?: number;
  collectorNo?: number | null;
  maxSupply?: number | null;
  obtainMethod?: string | null;
}

export interface CodexCardProps {
  card: CodexCardData;
  /** "sealed" hides the card behind a silhouette and shows its clue. */
  state?: "owned" | "sealed";
  isFoil?: boolean;
  isNew?: boolean;
  quantity?: number;
  clue?: string;
  progress?: { current: number; target: number } | null;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

// Legacy (season 0) cards with no hand-made scene get a motif by type.
const TYPE_MOTIF: Partial<Record<CardType, Motif>> = {
  VOICE: "wave", TRANSMISSION: "antenna", LORE: "book", SIGNAL: "radio", ORACLE: "mask", CIPHER: "key",
  RELIC: "chalice", ENTITY: "eyes", PROPHECY: "comet", MEMBER: "crown", GLITCH: "bars", MAHAVIDYA: "lotus",
  AVATAR: "hand", INCIDENT: "skull", QUOTE: "wave", EPISODE: "tower", DEITY: "sun", LOCATION: "door",
  RITUAL: "candle", SYMBOL: "pyramid", EVENT: "star",
};
const RARITY_PALETTE: Record<Rarity, Palette> = {
  STATIC: "void", SIGNAL: "dusk", TRANSMISSION: "verdant", ANOMALY: "rose",
  ORACLE: "abyss", LEGENDARY: "gold", MYTHIC: "violet", FORBIDDEN: "blood",
};

function CardArt({ card, sealed }: { card: CodexCardData; sealed: boolean }) {
  const entry = catalogEntry(card.slug);
  if (card.artUrl && !sealed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={card.artUrl} alt="" className="cx-art-img" loading="lazy" />;
  }
  if (entry) {
    return <CodexArt slug={card.slug} motif={entry.def.art.motif} palette={entry.def.art.palette} rarity={card.rarity} silhouette={sealed} />;
  }
  if (!sealed && (card.season ?? 0) === 0) {
    // Salvaged archive art: the legacy scenes are full-card 300×420 paintings.
    const legacy = { slug: card.slug, cardType: card.cardType, rarity: card.rarity, statA: card.statA, statC: card.statC } as VaultCard;
    return <div className="cx-art-legacy"><ArtScene card={legacy} uid={"lg_" + card.slug.replace(/[^a-z0-9]/gi, "")} /></div>;
  }
  return <CodexArt slug={card.slug} motif={TYPE_MOTIF[card.cardType] ?? "eye"} palette={RARITY_PALETTE[card.rarity]} rarity={card.rarity} silhouette={sealed} />;
}

function Gem({ color }: { color: string }) {
  return (
    <svg className="cx-gem" viewBox="0 0 24 28" aria-hidden="true">
      <path d="M12 1 L23 9 L12 27 L1 9 Z" fill={color} stroke="#000" strokeOpacity="0.4" strokeWidth="1" />
      <path d="M1 9 L23 9 M12 1 L7 9 L12 27 M12 1 L17 9 L12 27" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
      <path d="M12 1 L7 9 L12 12 L17 9 Z" fill="#fff" fillOpacity="0.45" />
    </svg>
  );
}

export function CodexCard({
  card,
  state = "owned",
  isFoil = false,
  isNew = false,
  quantity,
  clue,
  progress,
  interactive = true,
  onClick,
  className,
}: CodexCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; mx: number; my: number } | null>(null);
  const sealed = state === "sealed";
  const color = RARITY_COLOR[card.rarity];
  const season = card.season ? getSeason(card.season) : undefined;
  const entry = catalogEntry(card.slug);
  const seasonTotal = season?.cards.length;
  const obtain = (card.obtainMethod ?? entry?.def.obtain ?? "pack") as ObtainMethod;
  const labels = STAT_LABELS[card.cardType] ?? ["SIG", "RES", "ENT"];
  const numLabel = season
    ? `S·${season.numeral} ${String(card.collectorNo ?? 0).padStart(3, "0")}/${String(seasonTotal).padStart(3, "0")}`
    : "ARCHIVE";

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: (0.5 - py) * 14, ry: (px - 0.5) * 14, mx: px * 100, my: py * 100 });
  };

  const style = {
    "--cx-accent": color,
    "--mx": `${tilt?.mx ?? 50}%`,
    "--my": `${tilt?.my ?? 50}%`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`cx-card ${className ?? ""}`}
      data-rarity={card.rarity}
      data-state={state}
      data-foil={isFoil && !sealed ? "true" : undefined}
      data-hover={tilt ? "true" : undefined}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt(null)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      aria-label={sealed ? `Sealed card: ${clue ?? "unknown"}` : `${card.title}, ${card.rarity.toLowerCase()} ${card.cardType.toLowerCase()} card`}
    >
      <div className="cx-inner" style={tilt ? { transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` } : undefined}>
        <div className="cx-bezel">
          <header className="cx-head">
            <span className="cx-rarity"><Gem color={color} />{card.rarity}</span>
            <span className="cx-no">{numLabel}</span>
          </header>

          <div className="cx-art">
            <CardArt card={card} sealed={sealed} />
            {sealed && <div className="cx-seal" aria-hidden="true">✶</div>}
            <span className="cx-obtain" data-obtain={obtain}>{OBTAIN_LABEL[obtain]}</span>
            {card.maxSupply && !sealed ? <span className="cx-supply">/{card.maxSupply}</span> : null}
          </div>

          <div className="cx-plate">
            <div className="cx-type">
              <span className="cx-glyph">{CARD_TYPE_GLYPH[card.cardType] ?? "◇"}</span>
              {card.cardType}
              {!sealed && card.subtitle ? <span className="cx-sub"> · {card.subtitle}</span> : null}
            </div>
            <h3 className="cx-title">{sealed ? "? ? ?" : card.title}</h3>
            {sealed ? (
              <>
                <p className="cx-clue">{clue}</p>
                {progress && progress.target > 1 && (
                  <div className="cx-progress" aria-label={`${progress.current} of ${progress.target}`}>
                    <div className="cx-progress-bar" style={{ width: `${Math.round((progress.current / progress.target) * 100)}%` }} />
                    <span>{progress.current}/{progress.target}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="cx-stats">
                  {[card.statA, card.statB, card.statC].map((v, i) => (
                    <div key={i} className="cx-stat">
                      <span className="cx-stat-label">{labels[i]}</span>
                      <span className="cx-stat-val">{v}</span>
                    </div>
                  ))}
                </div>
                {card.flavourText && <p className="cx-flavour">{card.flavourText}</p>}
              </>
            )}
          </div>

          <footer className="cx-foot">
            <span>CULTCODEX{season ? ` · SEASON ${season.numeral}` : ""}</span>
            <span>{isFoil && !sealed ? "✦ FOIL" : ""}</span>
          </footer>
        </div>
        <div className="cx-holo" aria-hidden="true" />
        <div className="cx-glare" aria-hidden="true" />
      </div>

      {isNew && !sealed && <span className="cx-badge cx-badge-new">NEW</span>}
      {quantity && quantity > 1 && !sealed ? <span className="cx-badge cx-badge-qty">×{quantity}</span> : null}
    </div>
  );
}

/** Card back — used face-down in pack openings. Same frame, same proportions. */
export function CodexCardBack({ glow, onClick }: { glow?: string; onClick?: () => void }) {
  return (
    <div
      className="cx-card cx-back"
      style={{ "--cx-accent": glow ?? "#f6c453" } as CSSProperties}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      aria-label={onClick ? "Reveal card" : undefined}
    >
      <div className="cx-inner">
        <div className="cx-bezel cx-back-face">
          <svg viewBox="0 0 100 140" className="cx-back-art" aria-hidden="true">
            <defs>
              <radialGradient id="cxBackGlow">
                <stop offset="0%" stopColor="var(--cx-accent)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--cx-accent)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100" height="140" fill="#08080b" />
            <circle cx="50" cy="70" r="46" fill="url(#cxBackGlow)" />
            <g fill="none" stroke="var(--cx-accent)" strokeWidth="0.6" opacity="0.8">
              <circle cx="50" cy="70" r="34" />
              <circle cx="50" cy="70" r="30" strokeDasharray="1 2" />
              <path d="M50 36 L79 87 L21 87 Z" />
              <path d="M50 104 L21 53 L79 53 Z" />
              <circle cx="50" cy="70" r="9" />
            </g>
            <path d="M42 70 Q50 62 58 70 Q50 78 42 70 Z" fill="var(--cx-accent)" />
            <circle cx="50" cy="70" r="2.2" fill="#000" />
            <text x="50" y="126" textAnchor="middle" fontSize="6" letterSpacing="2.4" fill="var(--cx-accent)" fontFamily="monospace">CULTCODEX</text>
            <text x="50" y="18" textAnchor="middle" fontSize="4" letterSpacing="2" fill="var(--cx-accent)" opacity="0.7" fontFamily="monospace">✶ THE SIGNAL ARCHIVE ✶</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
