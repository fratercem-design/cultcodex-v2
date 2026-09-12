"use client";
import React from "react";
import type { VaultCard } from "./constants";
import { VAULT_RARITIES, sin, cos } from "./constants";

type ArtFn = (c: string, uid: string) => React.ReactElement;
type SceneFn = (c: string, uid: string, rng: () => number) => React.ReactElement;

function ArtDefs({ uid, c }: { uid: string; c: string }) {
  return (
    <defs>
      <radialGradient id={`${uid}-vig`} cx="50%" cy="42%" r="75%">
        <stop offset="0%" stopColor="#000" stopOpacity="0" />
        <stop offset="78%" stopColor="#000" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.92" />
      </radialGradient>
      <filter id={`${uid}-grain`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.82  0 0 0 0 0.8  0 0 0 0.5 0" />
      </filter>
      <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="6" /></filter>
      <filter id={`${uid}-soft2`}><feGaussianBlur stdDeviation="2" /></filter>
      <filter id={`${uid}-warp`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves={2} seed={3} result="w" />
        <feDisplacementMap in="SourceGraphic" in2="w" scale={14} />
      </filter>
      <linearGradient id={`${uid}-acc`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={c} stopOpacity="0.95" />
        <stop offset="100%" stopColor={c} stopOpacity="0.25" />
      </linearGradient>
    </defs>
  );
}

const grain = (uid: string, o = 0.22) => (
  <rect x="0" y="0" width="300" height="420" filter={`url(#${uid}-grain)`} opacity={o} style={{ mixBlendMode: "overlay" }} />
);
const vignette = (uid: string) => <rect x="0" y="0" width="300" height="420" fill={`url(#${uid}-vig)`} />;

function figure(cx: number, cy: number, s: number, fill: string, opacity = 1, key?: number) {
  return (
    <g key={key} transform={`translate(${cx} ${cy}) scale(${s})`} fill={fill} opacity={opacity}>
      <ellipse cx="0" cy="-46" rx="15" ry="17" />
      <path d="M -26 60 C -26 8 -16 -26 0 -26 C 16 -26 26 8 26 60 Z" />
    </g>
  );
}
function rings(cx: number, cy: number, n: number, step: number, color: string, op = 0.5, sw = 1) {
  return [...Array(n)].map((_, i) => (
    <circle key={i} cx={cx} cy={cy} r={step * (i + 1)} fill="none" stroke={color} strokeWidth={sw} opacity={op * (1 - i / (n + 2))} />
  ));
}
function stars(seed: number, n: number, color: string) {
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return [...Array(n)].map((_, i) => (
    <circle key={i} cx={rnd() * 300} cy={rnd() * 250} r={rnd() * 1.4 + 0.3} fill={color} opacity={rnd() * 0.8 + 0.2} />
  ));
}
function scan(uid: string, y: number, h: number, color: string, op = 0.5) {
  return <rect x="0" y={y} width="300" height={h} fill={color} opacity={op} style={{ mixBlendMode: "screen" }} filter={`url(#${uid}-soft2)`} />;
}

const ART: Record<string, ArtFn> = {
  "tara-she-who-crosses": (c, uid) => (<g>
    <rect width="300" height="420" fill="#070b14" />
    <rect width="300" height="420" fill="#0a1830" opacity="0.6" />
    {stars(11, 60, "#dfe9ff")}
    {rings(150, 150, 5, 16, c, 0.35)}
    <g filter={`url(#${uid}-soft2)`}>
      <path d="M0 250 Q150 232 300 250 L300 420 L0 420 Z" fill="#03060d" />
      {[...Array(7)].map((_, i) => <path key={i} d={`M0 ${258 + i * 22} Q150 ${250 + i * 22} 300 ${258 + i * 22}`} stroke={c} strokeWidth="0.7" fill="none" opacity={0.3 - i * 0.03} />)}
    </g>
    {figure(150, 250, 1.7, "#02040a")}
    <g transform="translate(150 200)">
      <ellipse cx="0" cy="0" rx="6" ry="9" fill={c} filter={`url(#${uid}-soft2)`} />
      <circle cx="0" cy="0" r="2.2" fill="#eaf4ff" />
    </g>
    {[...Array(9)].map((_, i) => <path key={i} d={`M${130 + i * 5} 188 q${(i - 4) * 3} -34 ${(i - 4) * 6} -60`} stroke="#0c2548" strokeWidth="2" fill="none" opacity="0.7" />)}
    {vignette(uid)}{grain(uid)}
  </g>),

  "chhinnamasta-the-self-beheaded": (c, uid) => (<g>
    <rect width="300" height="420" fill="#0a0204" />
    <g transform="translate(150 175)">{rings(0, 0, 8, 13, "#ff2a2a", 0.32)}</g>
    {[-1, 0, 1].map((d, i) => <path key={i} d={`M${150 + d * 34} 168 C ${150 + d * 50} 110 ${150 + d * 70} 70 ${150 + d * 86} 36`} stroke="#e21b1b" strokeWidth={i === 1 ? 5 : 3.4} fill="none" opacity="0.92" filter={`url(#${uid}-soft2)`} />)}
    <g fill="#0b0305">
      <path d="M124 250 C124 196 134 168 150 168 C166 168 176 196 176 250 Z" />
      {figure(108, 210, 0.95, "#0b0305")}{figure(192, 210, 0.95, "#0b0305")}
    </g>
    <g transform="translate(150 150)">
      <circle r="3" fill="#1a0608" stroke={c} strokeWidth="1.2" />
      <ellipse cx="0" cy="-14" rx="14" ry="16" fill="#0d0406" stroke="#e21b1b" strokeWidth="1" />
      {[...Array(10)].map((_, i) => <line key={i} x1="0" y1="-14" x2={cos(i / 10 * 6.28) * 24} y2={-14 + sin(i / 10 * 6.28) * 24} stroke={c} strokeWidth="0.6" opacity="0.5" />)}
    </g>
    <rect x="210" y="0" width="90" height="420" fill={`url(#${uid}-grain)`} opacity="0.5" />
    <rect x="0" y="0" width="90" height="420" fill={`url(#${uid}-grain)`} opacity="0.5" />
    {vignette(uid)}{grain(uid, 0.18)}
  </g>),

  "dhumavati-the-widow": (c, uid) => (<g>
    <rect width="300" height="420" fill="#15171a" />
    {[...Array(40)].map((_, i) => <rect key={i} x="0" y={i * 11} width="300" height="4" fill="#1c1f22" opacity="0.6" />)}
    <ellipse cx="150" cy="300" rx="120" ry="30" fill="#0c0d0f" />
    {figure(150, 220, 1.55, "#0a0b0c")}
    <g filter={`url(#${uid}-soft)`} opacity="0.85">
      {[...Array(6)].map((_, i) => <ellipse key={i} cx={150 + (i - 3) * 14} cy={150 - i * 6} rx={20 - i * 2} ry={14 - i} fill="#3a3d40" opacity={0.5 - i * 0.06} />)}
    </g>
    <g fill="#050506">{[[70, 250], [230, 255], [120, 300], [200, 300]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y}) scale(0.9)`}><path d="M0 0 L18 -4 L30 4 L12 8 Z" /><path d="M0 0 L-6 -10 L4 -6 Z" /></g>))}</g>
    <circle cx="172" cy="196" r="2.4" fill={c} />
    <circle cx="143" cy="196" r="2.4" fill={c} />
    {vignette(uid)}{grain(uid, 0.3)}
  </g>),

  "kamala-the-lotus": (c, uid) => (<g>
    <rect width="300" height="420" fill="#04181b" />
    <rect y="210" width="300" height="210" fill="#06262b" />
    {[...Array(6)].map((_, i) => <path key={i} d={`M0 ${250 + i * 26} Q150 ${244 + i * 26} 300 ${250 + i * 26}`} stroke="#0c4148" strokeWidth="1.2" fill="none" opacity="0.6" />)}
    <g transform="translate(150 220)">{rings(0, 0, 5, 22, "#f6c453", 0.28)}</g>
    {[...Array(12)].map((_, i) => { const a = i / 12 * 6.283; return <ellipse key={i} cx={150 + cos(a) * 38} cy={250 + sin(a) * 22} rx="20" ry="9" fill="#e8638f" opacity="0.5" transform={`rotate(${a * 57} ${150 + cos(a) * 38} ${250 + sin(a) * 22})`} />; })}
    <g transform="translate(150 250)">{[...Array(9)].map((_, i) => { const a = (i / 9 - 0.5) * 3.6; return <path key={i} d="M0 0 C -10 -34 -5 -64 0 -70 C 5 -64 10 -34 0 0 Z" fill="#f3cf66" opacity={0.85} transform={`rotate(${a * 28}) scale(${1 - Math.abs(a) * 0.12})`} />; })}</g>
    {figure(150, 230, 1.15, "#caa23a")}
    <circle cx="150" cy="190" r="11" fill="#f6d780" filter={`url(#${uid}-soft2)`} opacity="0.9" />
    {vignette(uid)}{grain(uid, 0.16)}
  </g>),

  "bhairavi-the-terrible": (c, uid) => (<g>
    <rect width="300" height="420" fill="#140804" />
    <defs><radialGradient id={`${uid}-heat`} cx="50%" cy="58%" r="60%"><stop offset="0%" stopColor="#ff7a1a" stopOpacity="0.55" /><stop offset="100%" stopColor="#ff7a1a" stopOpacity="0" /></radialGradient></defs>
    <rect width="300" height="420" fill={`url(#${uid}-heat)`} />
    <g transform="translate(150 130)"><circle r="40" fill="none" stroke="#caa15a" strokeWidth="1.4" opacity="0.7" />
      <path d="M-40 -6 L-8 -16 L6 6 L34 -2 L40 12" stroke="#0c0603" strokeWidth="2" fill="none" /></g>
    <g filter={`url(#${uid}-warp)`}>{rings(150, 250, 6, 18, "#ff8a2a", 0.4, 2)}</g>
    {figure(150, 270, 1.45, "#1d0c05")}
    <g transform="translate(150 232)"><ellipse rx="5" ry="8" fill="#8b5cf6" filter={`url(#${uid}-soft2)`} /><circle r="2" fill="#e9ddff" /></g>
    {[...Array(12)].map((_, i) => <text key={i} x={50 + (i % 6) * 38} y={330 + Math.floor(i / 6) * 22} fontSize="9" fill="#3a1c0a" opacity="0.7" fontFamily="monospace">{["क", "ष", "म", "त", "र", "ह"][i % 6]}</text>)}
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  "the-chat-egregore": (c, uid) => (<g>
    <rect width="300" height="420" fill="#080a0c" />
    {figure(150, 230, 1.9, "#0e1316")}
    <clipPath id={`${uid}-fig`}><path d="M105 95 a45 51 0 0 1 90 0 v0 M97 130 C97 92 113 28 150 28 C187 28 203 92 203 130 L222 400 L78 400 Z" /></clipPath>
    <g clipPath={`url(#${uid}-fig)`}>
      {[...Array(26)].map((_, i) => <text key={i} x={70 + ((i * 53) % 150)} y={70 + i * 13} fontSize="8" fontFamily="monospace" fill={i % 3 === 0 ? c : i % 3 === 1 ? "#7be0ff" : "#f6c453"} opacity={0.75}>{["lmao", "what", "HE'S BACK", "no way", "KEKW", "based", "o7", "ratio", "real", "truth", "gg", "mods?"][i % 12]}</text>)}
    </g>
    <g transform="translate(150 150)" textAnchor="middle"><circle r="16" fill="#0a0d0f" stroke={c} strokeWidth="1" /><text y="-1" fontSize="6" fill={c} fontFamily="monospace" textAnchor="middle">LIVE</text><text y="9" fontSize="10" fill="#7be0ff" fontFamily="monospace" textAnchor="middle">14.2k</text></g>
    <rect x="64" y="32" width="8" height="6" fill={c} /><rect x="226" y="32" width="8" height="6" fill={c} />
    {[":)", ":(", "D:"].map((e, i) => <text key={i} x={130 + i * 22} y={300} fontSize="11" fill="#f6c453" fontFamily="monospace">{e}</text>)}
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  "psyches-shadow": (c, uid) => (<g>
    <rect width="300" height="420" fill="#0a0710" />
    <rect x="40" y="60" width="220" height="120" rx="4" fill="#140d1f" stroke="#2a1d3e" />
    {[...Array(6)].map((_, i) => <text key={i} x="52" y={82 + i * 18} fontSize="8" fontFamily="monospace" fill="#5b4a7a" opacity="0.8">{["EDOSIPE ##", "NRUTER EHT", "WOHS TSAL", "DROCER ON", "...", "HCAE"][i]}</text>)}
    {figure(150, 250, 1.8, "#020103")}
    <g transform="translate(150 175)"><rect x="-7" y="-6" width="6" height="6" fill={`url(#${uid}-grain)`} /><rect x="1" y="-6" width="6" height="6" fill={`url(#${uid}-grain)`} /><rect x="-7" y="-6" width="14" height="6" fill="none" stroke="#3a2d52" strokeWidth="0.5" /></g>
    <rect x="100" y="215" width="34" height="46" rx="6" fill="#16101f" /><rect x="113" y="200" width="8" height="20" rx="3" fill="#16101f" />
    <path d="M180 300 q-4 -30 4 -40 q10 -2 12 8 q8 -4 10 6 q8 -2 8 8 q6 0 4 12 q-2 14 -18 18 q-16 4 -20 -20 Z" fill="#241834" opacity="0.55" filter={`url(#${uid}-soft2)`} />
    {vignette(uid)}{grain(uid, 0.22)}
  </g>),

  "the-algorithms-beloved": (c, uid) => (<g>
    <rect width="300" height="420" fill="#0c1116" />
    <defs><radialGradient id={`${uid}-ring`} cx="50%" cy="40%" r="55%"><stop offset="0%" stopColor="#bfe6ff" stopOpacity="0.5" /><stop offset="100%" stopColor="#bfe6ff" stopOpacity="0" /></radialGradient></defs>
    <rect width="300" height="420" fill={`url(#${uid}-ring)`} />
    <circle cx="150" cy="150" r="78" fill="none" stroke="#9fd4ff" strokeWidth="3" opacity="0.7" />
    {figure(150, 250, 1.7, "#11202b")}
    <g clipPath={`url(#${uid}-bod)`}><clipPath id={`${uid}-bod`}><path d="M97 130 C97 92 113 28 150 28 C187 28 203 92 203 130 L222 400 L78 400 Z" /></clipPath>
      {[...Array(120)].map((_, i) => { const x = 80 + (i % 12) * 12, y = 120 + Math.floor(i / 12) * 26; const h = (i * 37) % 100; return <rect key={i} x={x} y={y} width="11" height="25" fill={h > 70 ? "#ff5d5d" : h > 40 ? "#ffb84d" : "#2e6b8f"} opacity="0.5" />; })}
    </g>
    <g transform="translate(132 150)"><rect width="16" height="10" fill="#0a141b" stroke={c} strokeWidth="0.6" /><path d="M1 8 L5 4 L9 6 L15 1" stroke="#5dff9b" strokeWidth="1" fill="none" /></g>
    <g transform="translate(152 150)"><rect width="16" height="10" fill="#0a141b" stroke={c} strokeWidth="0.6" /><path d="M1 8 L5 4 L9 6 L15 1" stroke="#5dff9b" strokeWidth="1" fill="none" /></g>
    <path d="M138 176 q12 7 24 0" stroke="#cfe9ff" strokeWidth="1.4" fill="none" />
    {vignette(uid)}{grain(uid, 0.14)}
  </g>),

  "the-parasitic-mod": (c, uid) => (<g>
    <rect width="300" height="420" fill="#0c100d" />
    <rect x="40" y="40" width="220" height="150" rx="3" fill="#11160f" stroke="#222a1f" />
    {[...Array(60)].map((_, i) => <rect key={i} x={48 + (i % 10) * 21} y={52 + Math.floor(i / 10) * 22} width="14" height="3" fill="#1c241a" />)}
    <g fill="#171c14">{[...Array(7)].map((_, i) => figure(60 + i * 30, 360, 0.9, "#171c14", 0.8, i))}</g>
    {figure(150, 250, 1.5, "#13180f")}
    <g transform="translate(150 138) rotate(-12)"><path d="M-26 8 L-26 -10 L-13 2 L0 -16 L13 2 L26 -10 L26 8 Z" fill="#caa23a" opacity="0.92" /><circle cx="0" cy="-2" r="3" fill="#0c100d" /></g>
    <circle cx="150" cy="175" r="20" fill="#0c100d" opacity="0.6" />
    <text x="150" y="178" fontSize="7" fill="#4a5340" fontFamily="monospace" textAnchor="middle">[no face]</text>
    {vignette(uid)}{grain(uid, 0.22)}
  </g>),

  "the-mirror-protocol": (c, uid) => (<g>
    <rect x="0" width="150" height="420" fill="#1a0e06" />
    <rect x="150" width="150" height="420" fill="#04121a" />
    <rect x="148" width="4" height="420" fill="#f4f4f4" opacity="0.85" />
    <defs>
      <radialGradient id={`${uid}-wl`} cx="0%" cy="40%" r="80%"><stop offset="0%" stopColor="#ff8a3a" stopOpacity="0.4" /><stop offset="100%" stopColor="#ff8a3a" stopOpacity="0" /></radialGradient>
      <radialGradient id={`${uid}-cl`} cx="100%" cy="40%" r="80%"><stop offset="0%" stopColor="#2ad6ff" stopOpacity="0.4" /><stop offset="100%" stopColor="#2ad6ff" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="300" height="420" fill={`url(#${uid}-wl)`} /><rect width="300" height="420" fill={`url(#${uid}-cl)`} />
    {figure(95, 250, 1.45, "#3a200d")}{figure(205, 250, 1.45, "#0a2733")}
    <line x1="118" y1="248" x2="150" y2="248" stroke="#ffb877" strokeWidth="1.4" />
    <line x1="182" y1="252" x2="150" y2="252" stroke="#7be7ff" strokeWidth="1.4" />
    <rect x="138" y="150" width="24" height="70" rx="2" fill="#0c0c0e" stroke="#f4f4f4" strokeWidth="0.6" opacity="0.9" />
    {figure(150, 200, 0.5, "#2a2a30", 0.7)}
    {vignette(uid)}{grain(uid, 0.18)}
  </g>),

  "archive-fever": (c, uid) => (<g>
    <rect width="300" height="420" fill="#171008" />
    {[...Array(5)].map((_, ci) => { const x = 30 + ci * 56, tilt = (ci - 2) * 2; return <g key={ci} transform={`rotate(${tilt} ${x} 420)`}>{[...Array(9)].map((_, i) => <rect key={i} x={x} y={400 - i * 30} width="44" height="26" fill={i % 2 ? "#2c2113" : "#37291660"} stroke="#4a371e" strokeWidth="0.6" />)}</g>; })}
    {figure(150, 240, 1.35, "#0e0a05")}
    <rect x="132" y="150" width="36" height="26" rx="3" fill="#0a0703" stroke="#5a4426" /><rect x="158" y="158" width="14" height="10" fill="#1a1209" stroke="#5a4426" />
    <circle cx="167" cy="155" r="2.6" fill="#ff2e2e"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" /></circle>
    <text x="150" y="120" fontSize="7" fill="#8a6a3a" fontFamily="monospace" textAnchor="middle">●REC 00:00:00</text>
    {vignette(uid)}{grain(uid, 0.26)}
  </g>),

  "signal-debt": (c, uid) => (<g>
    <rect width="300" height="420" fill="#120e1c" />
    <rect width="300" height="260" fill="#1a1430" opacity="0.7" />
    <ellipse cx="200" cy="70" rx="40" ry="16" fill="#0d0a16" />
    <g transform="translate(150 120)">{rings(0, 0, 6, 20, "#ffb04a", 0.4, 1.2)}</g>
    <path d="M150 90 L138 300 L162 300 Z" fill="#0a0810" stroke="#2a2340" />
    <path d="M150 100 L130 150 M150 100 L170 150 M138 200 L130 230 M162 200 L170 230" stroke="#2a2340" strokeWidth="1" />
    <circle cx="150" cy="92" r="4" fill="#ffcf7a" filter={`url(#${uid}-soft2)`} />
    {[[40, 330], [90, 360], [210, 355], [260, 335], [150, 380]].map(([x, y], i) => (<g key={i}><line x1="150" y1="160" x2={x} y2={y} stroke="#3a3358" strokeWidth="0.6" opacity="0.7" /><circle cx={x} cy={y} r="3" fill="#9fb6ff" opacity="0.8" filter={`url(#${uid}-soft2)`} /></g>))}
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  "the-parasocial-engine": (c, uid) => (<g>
    <rect width="300" height="420" fill="#140f0a" />
    {[...Array(5)].map((_, r) => [...Array(7)].map((_, ci) => <g key={`${r}-${ci}`}><rect x={36 + ci * 34} y={250 + r * 30} width="28" height="24" fill="#1b140c" stroke="#3a2c18" strokeWidth="0.5" /><rect x={45 + ci * 34} y={258 + r * 30} width="10" height="8" fill="#caa23a" opacity="0.5" /></g>))}
    <g stroke="#6a5226" strokeWidth="1.4" fill="#241a0e">
      <circle cx="110" cy="120" r="34" /><circle cx="180" cy="150" r="26" /><circle cx="150" cy="90" r="18" />
      {[...Array(12)].map((_, i) => <line key={i} x1="110" y1="120" x2={110 + cos(i / 12 * 6.28) * 34} y2={120 + sin(i / 12 * 6.28) * 34} />)}
    </g>
    <rect x="60" y="200" width="180" height="8" fill="#3a2c18" />
    {[...Array(6)].map((_, i) => <path key={i} d="M0 0 l6 -10 l6 10 l-3 4 l-6 0 z" fill={c} opacity="0.7" transform={`translate(${80 + i * 28} ${196})`} />)}
    {vignette(uid)}{grain(uid, 0.22)}
  </g>),

  "dead-chat": (c, uid) => (<g>
    <rect width="300" height="420" fill="#04070c" />
    {vignette(uid)}{grain(uid, 0.12)}
  </g>),

  "the-stream-hole": (c, uid) => (<g>
    <rect width="300" height="420" fill="#16191c" />
    {[...Array(60)].map((_, i) => { const inHole = i > 24 && i < 36; return inHole ? null : <rect key={i} x={i * 5} y="190" width="4" height="40" fill={i % 3 ? "#2a3034" : "#3a4248"} />; })}
    <g><circle cx="150" cy="210" r="44" fill="#000" /><circle cx="150" cy="210" r="44" fill={`url(#${uid}-grain)`} opacity="0.5" /><circle cx="150" cy="210" r="44" fill="none" stroke={c} strokeWidth="1" strokeDasharray="3 4" opacity="0.6" /></g>
    <text x="40" y="270" fontSize="8" fill="#5a646a" fontFamily="monospace">00:23</text>
    <text x="210" y="270" fontSize="8" fill="#5a646a" fontFamily="monospace">01:10</text>
    <text x="138" y="214" fontSize="8" fill="#2a3034" fontFamily="monospace">??:??</text>
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  "the-tulpa-protocol": (c, uid) => (<g>
    <rect width="300" height="420" fill="#060a12" />
    {[...Array(7)].map((_, i) => <rect key={i} x={20 + i * 38} y="40" width="22" height="340" fill="#0a1320" stroke="#13243a" strokeWidth="0.6" />)}
    {[...Array(7)].map((_, i) => [...Array(10)].map((_, j) => <circle key={`${i}-${j}`} cx={31 + i * 38} cy={60 + j * 32} r="1.4" fill="#1e88c4" opacity={(i * j) % 3 === 0 ? 0.9 : 0.2} />))}
    {[...Array(40)].map((_, i) => { const a = (i / 40) * 6.283; const r = 90 + (i % 5) * 8; return <line key={i} x1={150 + cos(a) * r} y1={210 + sin(a) * r} x2="150" y2="230" stroke="#f3cf66" strokeWidth="0.5" opacity="0.4" />; })}
    {figure(150, 250, 1.5, "#caa23a", 0.4)}
    <g filter={`url(#${uid}-soft2)`}>{figure(150, 250, 1.5, "#f3cf66", 0.18)}</g>
    {vignette(uid)}{grain(uid, 0.16)}
  </g>),

  "the-ritual-upload": (c, uid) => (<g>
    <rect width="300" height="420" fill="#100c06" />
    <rect x="200" y="40" width="80" height="110" fill="#000" /><rect x="200" y="40" width="80" height="110" fill="none" stroke="#3a2c18" />
    <text x="240" y="100" fontSize="7" fill="#2a2014" fontFamily="monospace" textAnchor="middle">[void]</text>
    <g transform="translate(70 90)"><circle r="26" fill="#1a1408" stroke="#5a4426" strokeWidth="1.4" /><line x1="0" y1="0" x2="0" y2="-18" stroke="#caa23a" strokeWidth="1.4" /><line x1="0" y1="0" x2="12" y2="6" stroke="#caa23a" strokeWidth="1.4" /></g>
    <rect x="40" y="230" width="220" height="18" rx="2" fill="#0a0703" stroke="#3a2c18" />
    <rect x="42" y="232" width="214" height="14" rx="1" fill={`url(#${uid}-acc)`} opacity="0.9" />
    <rect x="252" y="232" width="4" height="14" fill="#100c06" />
    <text x="150" y="270" fontSize="9" fill="#caa23a" fontFamily="monospace" textAnchor="middle">UPLOADING… 99%</text>
    <text x="150" y="300" fontSize="8" fill="#5a4426" fontFamily="monospace" textAnchor="middle">/archive/██-██-████</text>
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  "signal-eaten": (c, uid) => (<g>
    <rect width="300" height="420" fill="#0a0402" />
    <g transform="translate(150 200)">
      {[...Array(64)].map((_, i) => { const a = (i / 64) * 6.283; const wob = sin(i * 0.8) * 4; const r = 86 + wob; return <circle key={i} cx={cos(a) * r} cy={sin(a) * r} r={1.8 + (i / 64) * 2.4} fill={i > 56 ? "#0a0402" : "#ff5a1e"} opacity={i > 50 ? 0.4 : 0.9} />; })}
      <path d="M86 0 l-10 -8 l2 16 z" fill="#ff5a1e" />
      <circle r="74" fill="#000" />
      <circle r="74" fill={`url(#${uid}-grain)`} opacity="0.25" />
    </g>
    <g filter={`url(#${uid}-grain)`} opacity="0.9"><rect x="210" y="300" width="90" height="120" fill="#0a0402" /></g>
    {vignette(uid)}{grain(uid, 0.3)}
  </g>),

  "the-offering-bowl": (c, uid) => (<g>
    <rect width="300" height="420" fill="#0e0c0a" />
    <ellipse cx="150" cy="340" rx="120" ry="24" fill="#070605" />
    <path d="M88 240 Q150 215 212 240 L196 300 Q150 326 104 300 Z" fill="#23201c" stroke="#3a352e" strokeWidth="1.4" />
    <path d="M100 250 L120 290 M150 246 L150 300 M200 250 L182 288" stroke="#0e0c0a" strokeWidth="1" opacity="0.7" />
    <ellipse cx="150" cy="248" rx="58" ry="14" fill="#161310" />
    <rect x="138" y="228" width="22" height="18" fill="#2a2218" transform="rotate(-8 149 237)" stroke="#4a3e2a" strokeWidth="0.5" />
    <path d="M170 244 q-6 -16 0 -22 q8 2 6 12 q6 -2 4 8 q-4 8 -10 2 Z" fill="#e8638f" opacity="0.92" />
    <g filter={`url(#${uid}-soft)`} opacity="0.4">{[...Array(3)].map((_, i) => <ellipse key={i} cx={150 + (i - 1) * 10} cy={210 - i * 14} rx={10 - i * 2} ry="8" fill="#caa23a" opacity={0.3} />)}</g>
    {vignette(uid)}{grain(uid, 0.22)}
  </g>),

  "psyches-headset": (c, uid) => (<g>
    <rect width="300" height="420" fill="#070708" />
    <g transform="translate(150 180)">{rings(0, 0, 5, 26, c, 0.22)}</g>
    <path d="M104 200 C104 130 196 130 196 200" stroke="#2a2c30" strokeWidth="7" fill="none" />
    <g><rect x="92" y="195" width="26" height="46" rx="8" fill="#16181b" stroke="#3a3d42" /><rect x="182" y="195" width="26" height="46" rx="8" fill="#16181b" stroke="#3a3d42" />
      <rect x="98" y="203" width="14" height="30" rx="4" fill="#caa23a" opacity="0.6" /><rect x="188" y="203" width="14" height="30" rx="4" fill="#caa23a" opacity="0.6" /></g>
    <path d="M118 235 q-12 26 -18 50 q-8 30 6 60 q10 26 -4 40" stroke="#2a2c30" strokeWidth="2.4" fill="none" />
    <path d="M196 218 q14 8 16 -6" stroke="#2a2c30" strokeWidth="3" fill="none" />
    <g transform="translate(150 300)">{[...Array(30)].map((_, i) => { const x = (i - 15) * 8; const h = Math.abs(sin(i * 0.9)) * 22 + 2; return <rect key={i} x={x} y={-h / 2} width="3" height={h} fill="#3ee895" opacity="0.6" />; })}</g>
    {vignette(uid)}{grain(uid, 0.18)}
  </g>),
};

function mkRng(seed: number): () => number {
  let s = seed % 233280 || 7;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function monitor(x: number, y: number, w: number, h: number, fill: string, stroke: string) {
  return <g><rect x={x} y={y} width={w} height={h} rx="3" fill={fill} stroke={stroke} strokeWidth="1" /></g>;
}
function chatLines(x: number, y: number, n: number, c: string, rng: () => number, w = 90) {
  return [...Array(n)].map((_, i) => <rect key={i} x={x} y={y + i * 11} width={20 + (rng() * w)} height="4" rx="2" fill={i % 4 === 0 ? c : "#39413c"} opacity={0.6} />);
}
function waveform(cx: number, cy: number, n: number, amp: number, c: string, fn: (i: number) => number) {
  return [...Array(n)].map((_, i) => { const x = cx + (i - n / 2) * 7; const h = fn(i) * amp + 2; return <rect key={i} x={x} y={cy - h / 2} width="3.4" height={h} rx="1.5" fill={c} opacity="0.78" />; });
}

const SCENES: Record<string, SceneFn> = {
  MAHAVIDYA: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#0a0610" />
    <defs><radialGradient id={`${uid}-mg`} cx="50%" cy="42%" r="60%"><stop offset="0%" stopColor={c} stopOpacity="0.28" /><stop offset="100%" stopColor={c} stopOpacity="0" /></radialGradient></defs>
    <rect width="300" height="420" fill={`url(#${uid}-mg)`} />
    {stars(rng() * 9000, 26, "#e9e0ff")}
    <g transform="translate(150 170)">{rings(0, 0, 6, 15, c, 0.4)}
      {[...Array(12)].map((_, i) => { const a = i / 12 * 6.283; return <path key={i} d="M0 0 L0 -84" stroke={c} strokeWidth="0.5" opacity="0.25" transform={`rotate(${a * 57})`} />; })}
      <path d="M0 -22 L19 11 L-19 11 Z M0 22 L19 -11 L-19 -11 Z" fill="none" stroke={c} strokeWidth="0.8" opacity="0.5" />
    </g>
    {figure(150, 250, 1.55, "#070410")}
    <g transform="translate(150 205)"><ellipse rx="5" ry="8" fill={c} filter={`url(#${uid}-soft2)`} /><circle r="2" fill="#fff" /></g>
    {[...Array(6)].map((_, i) => <ellipse key={i} cx={108 + i * 17} cy={250} rx="3" ry="9" fill={c} opacity="0.3" transform={`rotate(${(i - 3) * 18} ${108 + i * 17} 250)`} />)}
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  ENTITY: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#080b0d" />
    {monitor(46, 56, 208, 124, "#0c1114", "#1d2730")}
    <g>{chatLines(58, 70, 9, c, rng, 150)}</g>
    {figure(150, 255, 1.7, "#0d1316")}
    <clipPath id={`${uid}-ec`}><path d="M105 130 C105 96 120 56 150 56 C180 56 195 96 195 130 L214 400 L86 400 Z" /></clipPath>
    <g clipPath={`url(#${uid}-ec)`} opacity="0.5">{[...Array(16)].map((_, i) => <rect key={i} x="80" y={150 + i * 16} width={40 + rng() * 100} height="5" fill={i % 3 ? "#2a332e" : c} opacity="0.7" />)}</g>
    <rect x={140 + rng() * 6} y="150" width="7" height="6" fill={c} /><rect x="155" y="150" width="7" height="6" fill={c} />
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  CIPHER: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#0b0c10" />
    <g transform="translate(150 200)" stroke={c} fill="none">
      {[...Array(5)].map((_, i) => <rect key={i} x={-70 + i * 6} y={-70 + i * 6} width={140 - i * 12} height={140 - i * 12} strokeWidth="0.7" opacity={0.5 - i * 0.06} transform={`rotate(${i * 9})`} />)}
      <circle r="46" strokeWidth="1" opacity="0.6" /><circle r="20" strokeWidth="1" opacity="0.8" />
      {[...Array(8)].map((_, i) => { const a = i / 8 * 6.283; return <line key={i} x1={cos(a) * 20} y1={sin(a) * 20} x2={cos(a) * 46} y2={sin(a) * 46} strokeWidth="0.6" opacity="0.5" />; })}
    </g>
    {figure(150, 250, 1.1, "#11141a", 0.85)}
    <circle cx="150" cy="200" r="4" fill={c} filter={`url(#${uid}-soft2)`} />
    {[...Array(20)].map((_, i) => <circle key={i} cx={rng() * 300} cy={300 + rng() * 110} r={rng() * 1.4} fill={c} opacity={rng() * 0.5} />)}
    {vignette(uid)}{grain(uid, 0.22)}
  </g>),

  RELIC: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#0a0908" />
    <path d="M70 0 L150 0 L230 420 L60 420 Z" fill={c} opacity="0.07" />
    <ellipse cx="150" cy="320" rx="110" ry="22" fill="#050403" />
    <g transform="translate(150 250)">
      <rect x="-34" y="-44" width="68" height="92" rx="6" fill="#17140f" stroke="#33291b" strokeWidth="1.2" transform={`rotate(${(rng() - 0.5) * 10})`} />
      <rect x="-20" y="-26" width="40" height="56" rx="3" fill="#0c0a07" stroke={c} strokeWidth="0.6" opacity="0.8" />
      <circle cx="0" cy="-2" r="9" fill="none" stroke={c} strokeWidth="1.2" opacity="0.7" />
    </g>
    <circle cx="150" cy="248" r="2.6" fill={c} filter={`url(#${uid}-soft2)`} />
    {vignette(uid)}{grain(uid, 0.24)}
  </g>),

  INCIDENT: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#0b0d0f" />
    {monitor(36, 66, 228, 150, "#0e1417", "#202b32")}
    <rect x="36" y="66" width="228" height="150" fill={`url(#${uid}-acc)`} opacity="0.12" />
    {figure(150, 210, 1.1, "#12191d")}
    <circle cx="58" cy="84" r="4" fill="#ff2e2e" /><text x="70" y="88" fontSize="8" fill="#c7d0c8" fontFamily="monospace">LIVE</text>
    <text x="226" y="88" fontSize="8" fill={c} fontFamily="monospace">▲ {Math.floor(rng() * 90 + 10)}.{Math.floor(rng() * 9)}k</text>
    <rect x="36" y="244" width="228" height="8" rx="2" fill="#161c1f" />
    {[...Array(40)].map((_, i) => (i > 17 && i < 24) ? null : <rect key={i} x={38 + i * 5.6} y="245" width="4" height="6" fill={i % 3 ? "#2a3338" : c} opacity="0.7" />)}
    <rect x={38 + 18 * 5.6} y="244" width={6 * 5.6} height="8" fill="#000" />
    <text x="36" y="272" fontSize="8" fill="#5a646a" fontFamily="monospace">1:47:23</text>
    <text x="220" y="272" fontSize="8" fill="#5a646a" fontFamily="monospace">2:49:01</text>
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  PROPHECY: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#070809" />
    <rect x="96" y="40" width="108" height="300" fill="#0b0d0f" stroke="#1a1f22" strokeWidth="1.4" />
    <rect x="150" y="40" width="54" height="300" fill="#101417" opacity="0.9" />
    <defs><radialGradient id={`${uid}-pg`} cx="78%" cy="40%" r="50%"><stop offset="0%" stopColor={c} stopOpacity="0.5" /><stop offset="100%" stopColor={c} stopOpacity="0" /></radialGradient></defs>
    <rect x="150" y="40" width="120" height="300" fill={`url(#${uid}-pg)`} />
    <line x1="150" y1="40" x2="150" y2="340" stroke={c} strokeWidth="1.4" opacity="0.7" />
    <circle cx="172" cy="200" r="3" fill={c} filter={`url(#${uid}-soft2)`} />
    {[...Array(14)].map((_, i) => <circle key={i} cx={150 + rng() * 110} cy={60 + rng() * 260} r={rng() * 1.2} fill={c} opacity={rng() * 0.4} />)}
    {vignette(uid)}{grain(uid, 0.26)}
  </g>),

  GLITCH: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#101316" />
    {[...Array(46)].map((_, i) => <rect key={i} x="0" y={i * 9.2} width="300" height={rng() > 0.85 ? 3 : 1.4} fill={rng() > 0.9 ? c : "#181c1f"} opacity="0.6" />)}
    <g transform="translate(150 200)"><circle r="46" fill="#06080a" stroke={c} strokeWidth="1.2" strokeDasharray={`${60 + rng() * 80} 200`} opacity="0.85" />
      <circle r="46" fill={`url(#${uid}-grain)`} opacity="0.3" /></g>
    <rect x="118" y="300" width="64" height="6" rx="3" fill="#1c2226" /><rect x="118" y="300" width={20 + rng() * 40} height="6" rx="3" fill={c} opacity="0.8" />
    <text x="150" y="332" fontSize="8" fill="#5a646a" fontFamily="monospace" textAnchor="middle">{Math.floor(rng() * 40 + 50)}%</text>
    {vignette(uid)}{grain(uid, 0.26)}
  </g>),

  AVATAR: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#0a0c0a" />
    <g transform="translate(150 160)">{rings(0, 0, 5, 18, c, 0.3)}</g>
    {figure(150, 240, 1.7, "#0f1410")}
    <g>{[...Array(5)].map((_, i) => <g key={i} transform={`translate(${110 + i * 20} 312)`}><rect x="-7" y="-7" width="14" height="14" rx="3" fill="#14180f" stroke={c} strokeWidth="0.7" opacity={0.5 + i * 0.1} /><circle r="3" fill={c} opacity={0.4 + i * 0.12} /></g>)}</g>
    <circle cx="150" cy="190" r="5" fill={c} filter={`url(#${uid}-soft2)`} opacity="0.7" />
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),

  SIGNAL: (c, uid, rng) => (<g>
    <rect width="300" height="420" fill="#0a0b0f" />
    <g transform="translate(150 150)">{rings(0, 0, 6, 19, c, 0.32, 1)}</g>
    <line x1="20" y1="220" x2="280" y2="220" stroke="#1c2330" strokeWidth="1" />
    {waveform(150, 220, 30, 70, c, (i) => Math.abs(sin(i * 0.7 + rng()) * cos(i * 0.3)) + 0.1)}
    <text x="150" y="300" fontSize="8" fill="#566" fontFamily="monospace" textAnchor="middle">{`0${Math.floor(rng() * 2 + 1)}:${Math.floor(rng() * 50 + 10)}:${Math.floor(rng() * 50 + 10)}`}</text>
    {vignette(uid)}{grain(uid, 0.2)}
  </g>),
};
SCENES.MEMBER = SCENES.AVATAR;
SCENES.LORE = SCENES.CIPHER;
SCENES.VOICE = SCENES.ENTITY;
SCENES.TRANSMISSION = SCENES.SIGNAL;
SCENES.ORACLE = SCENES.PROPHECY;

function fallbackArt(card: VaultCard, c: string, uid: string): React.ReactElement {
  const rng = mkRng(card.slug.length * 71 + card.statA * 7 + card.statC);
  const scene = SCENES[card.cardType] || SCENES.CIPHER;
  return scene(c, uid, rng);
}

export function ArtScene({ card, uid }: { card: VaultCard; uid: string }) {
  const R = VAULT_RARITIES[card.rarity] ?? VAULT_RARITIES.STATIC;
  const c = R.color;
  const fn = ART[card.slug];
  return (
    <svg viewBox="0 0 300 420" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <ArtDefs uid={uid} c={c} />
      {fn ? fn(c, uid) : fallbackArt(card, c, uid)}
    </svg>
  );
}
