"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { VaultCard as VaultCardType } from "./constants";
import { VAULT_RARITIES, VAULT_CARD_TYPES, TYPE_ORDER } from "./constants";
import { VaultCard } from "./card";

const SORT_OPTIONS = [
  ["num", "№"], ["rarity", "Rarity"], ["power", "Power"],
  ["sig", "Signal"], ["res", "Resonance"], ["ent", "Entropy"],
] as const;
type SortKey = typeof SORT_OPTIONS[number][0];

function ZoomModal({
  card,
  onClose,
  onPrev,
  onNext,
  idx,
  total,
}: {
  card: VaultCardType;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  idx: number;
  total: number;
}) {
  const R = VAULT_RARITIES[card.rarity] ?? VAULT_RARITIES.STATIC;
  return (
    <div
      className="zoom-back"
      onClick={onClose}
      style={{ "--accent-h": R.color, "--zc": R.color } as React.CSSProperties}
    >
      <button className="zoom-close" onClick={onClose}>✕</button>
      <button className="zoom-nav zoom-prev" onClick={e => { e.stopPropagation(); onPrev(); }}>‹</button>
      <div className="zoom-stage" onClick={e => e.stopPropagation()}>
        <div className="zoom-card-scale"><VaultCard card={card} mode="zoom" /></div>
        <div className="zoom-side">
          <div className="zoom-kicker">{card.cardType} · {R.label} · #{card.num}</div>
          <h2 className="zoom-h">{card.title}</h2>
          <div className="zoom-subh">{card.subtitle}</div>
          <div className="zoom-flav">{card.flavourText}</div>
          <div className="zoom-grid">
            <div className="zoom-cell"><div className="k">SIGNAL</div><div className="v" style={{ color: "#6fe3ff" }}>{card.statA}</div></div>
            <div className="zoom-cell"><div className="k">RESONANCE</div><div className="v" style={{ color: "#f0c451" }}>{card.statB}</div></div>
            <div className="zoom-cell"><div className="k">ENTROPY</div><div className="v" style={{ color: "#ff5a6a" }}>{card.statC}</div></div>
            <div className="zoom-cell">
              <div className="k">SUPPLY</div>
              <div className="v" style={{ color: card.maxSupply ? R.color : "#7e857c" }}>
                {card.maxSupply ? (card.maxSupply === 1 ? "1 / 1" : "/ " + card.maxSupply) : "OPEN"}
              </div>
            </div>
          </div>
          <div className="zoom-abils">
            {card.abilities.map((a, i) => (
              <span key={i} className="cc-chip ghost" style={{ "--accent": R.color } as React.CSSProperties}>{a}</span>
            ))}
          </div>
          <div className="zoom-hint">↤ ↦ browse · click card to flip · esc to close · {idx + 1}/{total}</div>
        </div>
      </div>
      <button className="zoom-nav zoom-next" onClick={e => { e.stopPropagation(); onNext(); }}>›</button>
    </div>
  );
}

function pickPack(cards: VaultCardType[]): VaultCardType[] {
  const lowTier = cards.filter(c => (VAULT_RARITIES[c.rarity]?.tier ?? 2) <= 4);
  const hiTier = cards.filter(c => (VAULT_RARITIES[c.rarity]?.tier ?? 2) >= 6);
  const pick = (arr: VaultCardType[]) => arr[Math.floor(Math.random() * arr.length)];
  const chosen: VaultCardType[] = [];
  const used = new Set<string>();
  const add = (c?: VaultCardType) => { if (c && !used.has(c.slug)) { used.add(c.slug); chosen.push(c); } };
  while (chosen.length < 4) add(pick(lowTier.length ? lowTier : cards));
  add(pick(hiTier.length ? hiTier : cards));
  while (chosen.length < 5) add(pick(cards));
  return chosen.slice(0, 5).sort((a, b) => (VAULT_RARITIES[a.rarity]?.tier ?? 2) - (VAULT_RARITIES[b.rarity]?.tier ?? 2));
}

function PackOpening({ cards, onClose }: { cards: VaultCardType[]; onClose: () => void }) {
  const [phase, setPhase] = useState<"sealed" | "opening" | "revealed">("sealed");
  const [pack, setPack] = useState<VaultCardType[]>(() => pickPack(cards));

  const rip = () => { setPhase("opening"); setTimeout(() => setPhase("revealed"), 650); };

  return (
    <div className="pack-back">
      <div className="pack-sky" />
      <div className="pack-title">{phase === "revealed" ? "◈ FIVE SIGNALS RECOVERED" : "◈ SEALED CODEX PACK"}</div>
      {phase === "sealed" && (
        <div className="pack-unopened" onClick={rip}>
          <span className="label2">CULTCODEX</span>
          <span className="seal">✦</span>
          <span className="label">TAP TO RIP · 5 CARDS</span>
        </div>
      )}
      {phase !== "sealed" && (
        <div className="pack-stage">
          {phase === "opening" && <div className="pack-burst" />}
          {pack.map((c, i) => (
            <div key={c.slug} className="pack-slot" style={{ animationDelay: (i * 0.16) + "s", "--cw": "182px", "--ch": "255px" } as React.CSSProperties}>
              <VaultCard card={c} mode="grid" />
            </div>
          ))}
        </div>
      )}
      <div className="pack-cta">
        {phase === "revealed" && <>
          <button className="pack-rip ghost" onClick={onClose}>← Back to Vault</button>
          <button className="pack-rip" onClick={() => { setPack(pickPack(cards)); setPhase("sealed"); }}>Open Another</button>
        </>}
        {phase === "sealed" && <button className="pack-rip ghost" onClick={onClose}>← Back to Vault</button>}
      </div>
    </div>
  );
}

export function VaultApp({ cards }: { cards: VaultCardType[] }) {
  const [type, setType] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [sort, setSort] = useState<SortKey>("num");
  const [q, setQ] = useState("");
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [packOpen, setPackOpen] = useState(false);

  const rarityKeys = useMemo(
    () => Object.keys(VAULT_RARITIES).sort((a, b) => VAULT_RARITIES[a].tier - VAULT_RARITIES[b].tier),
    []
  );

  const cardTypes = useMemo(
    () => [...new Set(cards.map(c => c.cardType))].sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b)),
    [cards]
  );

  const filtered = useMemo(() => {
    const list = cards.filter(c =>
      (type === "all" || c.cardType === type) &&
      (rarity === "all" || c.rarity === rarity) &&
      (!q || (c.title + " " + (c.subtitle ?? "") + " " + c.abilities.join(" ") + " " + (c.flavourText ?? "")).toLowerCase().includes(q.toLowerCase()))
    );
    const cmp: Record<SortKey, (a: VaultCardType, b: VaultCardType) => number> = {
      num:    (a, b) => parseInt(a.num) - parseInt(b.num),
      rarity: (a, b) => (VAULT_RARITIES[b.rarity]?.tier ?? 0) - (VAULT_RARITIES[a.rarity]?.tier ?? 0) || parseInt(a.num) - parseInt(b.num),
      sig:    (a, b) => b.statA - a.statA,
      res:    (a, b) => b.statB - a.statB,
      ent:    (a, b) => b.statC - a.statC,
      power:  (a, b) => (b.statA + b.statB + b.statC) - (a.statA + a.statB + a.statC),
    };
    return [...list].sort(cmp[sort]);
  }, [cards, type, rarity, sort, q]);

  const grouped = useMemo(() => {
    if (sort !== "num" || type !== "all") return [{ head: null as string | null, cards: filtered }];
    const by: Record<string, VaultCardType[]> = {};
    filtered.forEach(c => { (by[c.cardType] ||= []).push(c); });
    return TYPE_ORDER
      .filter(t => by[t])
      .map(t => ({ head: t, cards: by[t] }));
  }, [filtered, sort, type]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoomIdx == null) return;
      if (e.key === "Escape") setZoomIdx(null);
      if (e.key === "ArrowRight") setZoomIdx(i => ((i ?? 0) + 1) % filtered.length);
      if (e.key === "ArrowLeft") setZoomIdx(i => (((i ?? 0) - 1) + filtered.length) % filtered.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIdx, filtered.length]);

  const openZoom = useCallback((card: VaultCardType) => {
    const i = filtered.findIndex(c => c.slug === card.slug);
    setZoomIdx(i >= 0 ? i : 0);
  }, [filtered]);

  return (
    <div className="vault-root">
      <div className="static-bg" />

      <header className="masthead">
        <div className="brandline">
          <h1 className="wordmark">CULT<span className="dim">CODEX</span></h1>
          <span className="tagline">{'// Trading Card Vault'}</span>
        </div>
        <div className="sub-meta">
          <span className="rec"><span className="blip" /> SIGNAL LIVE</span>
          <span><b>{cards.length}</b> CARDS ARCHIVED</span>
          <span><b>{cardTypes.length}</b> TYPES</span>
          <span><b>8</b> RARITY TIERS</span>
          <Link href="/cards" style={{ color: "var(--ink-dim)", textDecoration: "none" }}>← My Collection</Link>
        </div>
      </header>

      <div className="controls">
        <div className="controls-in">
          <div className="ctl-group">
            <span className="ctl-label">Type</span>
            <button className={`pill ${type === "all" ? "active" : ""}`} onClick={() => setType("all")}>All</button>
            {cardTypes.map(t => (
              <button key={t} className={`pill ${type === t ? "active" : ""}`} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="ctl-group">
            <span className="ctl-label">Rarity</span>
            <button className={`pill ${rarity === "all" ? "active" : ""}`} onClick={() => setRarity("all")}>All</button>
            {rarityKeys.map(r => (
              <button key={r} className={`pill ${rarity === r ? "active" : ""}`} onClick={() => setRarity(r)}>
                <span className="sw" style={{ background: VAULT_RARITIES[r].color }} />{r}
              </button>
            ))}
          </div>
          <div className="ctl-group">
            <span className="ctl-label">Sort</span>
            {SORT_OPTIONS.map(([k, l]) => (
              <button key={k} className={`pill ${sort === k ? "active" : ""}`} onClick={() => setSort(k)}>{l}</button>
            ))}
          </div>
          <div className="search">
            <span style={{ color: "var(--ink-dim)", fontSize: 12 }}>⌕</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="search the archive…" />
          </div>
          <span className="count-tag"><b style={{ color: "#9fe6c0" }}>{filtered.length}</b> / {cards.length}</span>
          <button className="act-btn hot" onClick={() => setPackOpen(true)}>◈ Open Pack</button>
        </div>
      </div>

      <main className="grid-wrap">
        <div className="grid">
          {filtered.length === 0 && <div className="empty">— NO SIGNAL MATCHES THIS QUERY —</div>}
          {grouped.map((g, gi) => (
            <React.Fragment key={gi}>
              {g.head && (
                <div className="expansion-head">
                  <h2>{VAULT_CARD_TYPES[g.head]?.glyph} {g.head}</h2>
                  <div className="ln" />
                  <span className="ct">{g.cards.length} CARDS</span>
                </div>
              )}
              {g.cards.map(c => <VaultCard key={c.slug} card={c} mode="grid" onZoom={openZoom} />)}
            </React.Fragment>
          ))}
        </div>
      </main>

      {zoomIdx != null && filtered[zoomIdx] && (
        <ZoomModal
          card={filtered[zoomIdx]}
          onClose={() => setZoomIdx(null)}
          onPrev={() => setZoomIdx(i => (((i ?? 0) - 1) + filtered.length) % filtered.length)}
          onNext={() => setZoomIdx(i => (((i ?? 0) + 1)) % filtered.length)}
          idx={zoomIdx}
          total={filtered.length}
        />
      )}

      {packOpen && <PackOpening cards={cards} onClose={() => setPackOpen(false)} />}
    </div>
  );
}
