"use client";
import React, { useState, useRef, useEffect } from "react";
import type { VaultCard } from "./constants";
import { VAULT_RARITIES, VAULT_CARD_TYPES } from "./constants";
import { ArtScene } from "./art";
import { Focal } from "./focal";

const STAT_COLOR: Record<string, string> = { statA: "#6fe3ff", statB: "#f0c451", statC: "#ff5a6a" };

function Gem({ color }: { color: string }) {
  return (
    <svg className="cc-gem" viewBox="0 0 24 28" width="17" height="20" aria-hidden="true">
      <defs><linearGradient id="gemsh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.9" /><stop offset="40%" stopColor={color} /><stop offset="100%" stopColor="#000" stopOpacity="0.6" />
      </linearGradient></defs>
      <path d="M12 1 L23 9 L12 27 L1 9 Z" fill="url(#gemsh)" stroke={color} strokeWidth="1" />
      <path d="M1 9 L23 9 M12 1 L7 9 L12 27 M12 1 L17 9 L12 27" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="0.7" />
      <path d="M12 1 L7 9 L12 12 L17 9 Z" fill="#fff" fillOpacity="0.35" />
    </svg>
  );
}

function StatRow({ statKey, label, value, active }: { statKey: string; label: string; value: number; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = (active ? value : 0) + "%"; }));
  }, [active, value]);
  return (
    <div className="cc-stat">
      <span className="cc-stat-label">{label}</span>
      <div className="cc-stat-track"><div ref={ref} className="cc-stat-fill" style={{ background: STAT_COLOR[statKey] }} /></div>
      <span className="cc-stat-val" style={{ color: STAT_COLOR[statKey] }}>{String(value).padStart(2, "0")}</span>
    </div>
  );
}

function DeadChatOverlay({ card }: { card: VaultCard }) {
  return (
    <div className="cc-bottom deadchat">
      <div className="cc-type">{card.cardType} · DEAD CHANNEL</div>
      <h3 className="cc-title">{card.title}</h3>
      <div className="cc-deadchat-ui">
        <div className="dc-head"><span className="dc-dot" /> 0 watching</div>
        <div className="dc-body"><span className="dc-empty">— chat is empty —</span><span className="dc-cursor">▮</span></div>
      </div>
      <div className="cc-abilities"><span className="cc-chip">{card.abilities[0]}</span></div>
    </div>
  );
}

export interface OwnedInfo { quantity: number; isFoil: boolean; isNew: boolean }

export function VaultCard({
  card,
  mode = "grid",
  onZoom,
  owned,
}: {
  card: VaultCard;
  mode?: "grid" | "zoom";
  onZoom?: (card: VaultCard) => void;
  // undefined = guest (no ownership UI); null = logged-in but not owned; {...} = owned
  owned?: OwnedInfo | null;
}) {
  const R = VAULT_RARITIES[card.rarity] ?? VAULT_RARITIES.STATIC;
  const T = VAULT_CARD_TYPES[card.cardType] ?? { glyph: "◇", note: card.cardType };
  const uid = "u_" + card.slug.replace(/[^a-z0-9]/gi, "");
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, px: 0, py: 0, on: false });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(mode === "zoom");

  useEffect(() => {
    if (mode !== "grid" || !wrapRef.current) return;
    const io = new IntersectionObserver((es) => es.forEach(e => e.isIntersecting && setSeen(true)), { threshold: 0.25 });
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, [mode]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    setTilt({ rx: (0.5 - py) * 16, ry: (px - 0.5) * 16, mx: px * 100, my: py * 100, px: px - 0.5, py: py - 0.5, on: true });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50, px: 0, py: 0, on: false });
  const onClick = () => {
    if (mode === "grid") onZoom?.(card);
    else setFlipped(f => !f);
  };

  const rot = `rotateX(${tilt.rx}deg) rotateY(${tilt.ry + (flipped ? 180 : 0)}deg)`;
  const isSpecial = card.special;

  return (
    <div
      className={`cc-wrap ${mode}`}
      ref={wrapRef}
      style={{
        position: "relative",
        "--accent": R.color,
        "--glow": R.glow,
        "--mx": tilt.mx + "%",
        "--my": tilt.my + "%",
        "--px": tilt.px,
        "--py": tilt.py,
      } as React.CSSProperties}
    >
      <div
        className={`cc-card ${tilt.on ? "lift" : ""} ${isSpecial ? "sp-" + card.special : ""}`}
        data-rarity={card.rarity}
        data-foil={R.foil}
        style={{ transform: rot }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        {/* FRONT */}
        <div className="cc-face cc-front">
          <div className="cc-art"><ArtScene card={card} uid={uid} /></div>
          <div className="cc-scan" />
          <div className="cc-scrim" />
          {card.special !== "deadchat" && <div className="cc-focal"><Focal card={card} uid={uid + "f"} /></div>}
          <div className="cc-foil" />
          <div className="cc-frame" />

          <div className="cc-top">
            <div className="cc-rarity"><Gem color={R.color} /><span>{R.label}</span></div>
            <div className="cc-id">
              <span className="cc-glyph">{T.glyph}</span>
              <span className="cc-num">#{card.num}</span>
            </div>
          </div>

          {card.special === "deadchat" ? <DeadChatOverlay card={card} /> : (
            <div className="cc-bottom">
              <div className="cc-type">{card.cardType} · {T.note}</div>
              <h3 className={"cc-title" + (card.special === "signaleaten" ? " redact" : "")}>
                {card.special === "signaleaten"
                  ? <span>SIGNAL<span className="blk">█████</span></span>
                  : card.title}
              </h3>
              <div className="cc-sub">{card.subtitle}</div>
              <div className="cc-stats">
                <StatRow statKey="statA" label="SIG" value={card.statA} active={seen} />
                <StatRow statKey="statB" label="RES" value={card.statB} active={seen} />
                <StatRow statKey="statC" label="ENT" value={card.statC} active={seen} />
              </div>
              <div className="cc-abilities">
                {card.abilities.map((a, i) => <span key={i} className="cc-chip">{a}</span>)}
              </div>
            </div>
          )}

          {card.maxSupply && (
            <div className="cc-supply">◈ {card.maxSupply === 1 ? "1 OF 1" : "/ " + card.maxSupply}</div>
          )}
          {card.special === "signaleaten" && <div className="cc-disintegrate" />}
        </div>

        {/* BACK */}
        <div className="cc-face cc-back">
          <div className="cc-back-inner">
            <div className="cc-back-top">
              <div className="cc-rarity"><Gem color={R.color} /><span>{R.label}</span></div>
              <span className="cc-num">#{card.num}</span>
            </div>
            <div className="cc-back-glyph">{T.glyph}</div>
            <h3 className="cc-back-title">{card.title}</h3>
            <div className="cc-back-sub">{card.subtitle}</div>
            <div className="cc-flavour">&ldquo;{card.flavourText}&rdquo;</div>
            <div className="cc-back-meta">
              <div className="cc-meta-row"><span>TYPE</span><b>{card.cardType}</b></div>
              <div className="cc-meta-row"><span>PERSONA</span><b>{card.personality || "—"}</b></div>
              <div className="cc-meta-row"><span>SUPPLY</span><b>{card.maxSupply ? (card.maxSupply === 1 ? "1 / 1" : String(card.maxSupply)) : "OPEN"}</b></div>
            </div>
            <div className="cc-back-abil">
              {card.abilities.map((a, i) => <span key={i} className="cc-chip ghost">{a}</span>)}
            </div>
            <div className="cc-slug">{card.slug}</div>
          </div>
          <div className="cc-foil back" />
          <div className="cc-frame" />
        </div>
      </div>

      {/* Ownership overlays — grid mode only */}
      {mode === "grid" && owned !== undefined && (
        <>
          {owned ? (
            <>
              {owned.quantity > 1 && (
                <div style={{ position: "absolute", bottom: 6, left: 6, fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.5)", background: "rgba(0,0,0,0.82)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, padding: "1px 5px", zIndex: 20, pointerEvents: "none" }}>
                  ×{owned.quantity}
                </div>
              )}
              {owned.isFoil && (
                <div style={{ position: "absolute", bottom: 6, right: 6, fontFamily: "monospace", fontSize: 8, color: R.color, textShadow: `0 0 6px ${R.color}`, letterSpacing: "0.08em", zIndex: 20, pointerEvents: "none" }}>
                  ✦
                </div>
              )}
              {owned.isNew && (
                <div style={{ position: "absolute", top: 6, right: 6, fontFamily: "monospace", fontSize: 8, color: "#00ff9c", background: "rgba(0,255,156,0.15)", border: "1px solid rgba(0,255,156,0.45)", borderRadius: 2, padding: "1px 5px", letterSpacing: "0.1em", zIndex: 20, pointerEvents: "none" }}>
                  NEW
                </div>
              )}
            </>
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 5, borderRadius: 2, pointerEvents: "none" }} />
          )}
        </>
      )}
    </div>
  );
}
