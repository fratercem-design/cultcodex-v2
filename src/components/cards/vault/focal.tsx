"use client";
import React from "react";
import type { VaultCard } from "./constants";
import { VAULT_RARITIES } from "./constants";

type FocalFn = (c: string, u: string) => React.ReactElement;

function FocalDefs({ uid, c }: { uid: string; c: string }) {
  return (<defs>
    <filter id={`${uid}-fd`} x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2.4" stdDeviation="2.6" floodColor="#000" floodOpacity="0.7" />
    </filter>
    <filter id={`${uid}-fg`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#e9eef0" /><stop offset="22%" stopColor="#9aa4a8" /><stop offset="55%" stopColor="#4a5256" /><stop offset="100%" stopColor="#1c2023" />
    </linearGradient>
    <linearGradient id={`${uid}-acc`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#fff" /><stop offset="30%" stopColor={c} /><stop offset="100%" stopColor="#000" stopOpacity="0.7" />
    </linearGradient>
    <radialGradient id={`${uid}-orb`} cx="38%" cy="32%" r="70%">
      <stop offset="0%" stopColor="#fff" /><stop offset="35%" stopColor={c} /><stop offset="100%" stopColor="#05070a" />
    </radialGradient>
    <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#fff4d0" /><stop offset="35%" stopColor="#f0c451" /><stop offset="100%" stopColor="#5a3f10" />
    </linearGradient>
  </defs>);
}

const M: Record<string, FocalFn> = {
  eye: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M18 50 Q50 24 82 50 Q50 76 18 50 Z" fill="#0c0e14" stroke={c} strokeWidth="2" /><circle cx="50" cy="50" r="15" fill={`url(#${u}-orb)`} /><circle cx="50" cy="50" r="6.5" fill="#05070a" /><circle cx="45" cy="45" r="2.4" fill="#fff" opacity="0.9" /><path d="M50 30 L53 22 L50 14 L47 22 Z" fill={c} filter={`url(#${u}-fg)`} /></g>),
  sri: (c, u) => (<g filter={`url(#${u}-fd)`} stroke={c} strokeWidth="1.6" fill="none"><circle cx="50" cy="50" r="30" stroke="#caa23a" /><path d="M50 24 L72 64 L28 64 Z" /><path d="M50 76 L72 38 L28 38 Z" /><path d="M50 34 L64 60 L36 60 Z" stroke="#caa23a" /><path d="M50 66 L64 42 L36 42 Z" stroke="#caa23a" /><circle cx="50" cy="50" r="3" fill={c} /></g>),
  cosmos: (c, u) => (<g filter={`url(#${u}-fd)`}><circle cx="50" cy="50" r="30" fill={`url(#${u}-orb)`} opacity="0.9" /><ellipse cx="50" cy="50" rx="38" ry="13" fill="none" stroke={c} strokeWidth="1.4" opacity="0.7" transform="rotate(-18 50 50)" /><ellipse cx="50" cy="50" rx="38" ry="13" fill="none" stroke="#9fb6ff" strokeWidth="1" opacity="0.5" transform="rotate(28 50 50)" /><circle cx="50" cy="50" r="6" fill="#6fa8ff" filter={`url(#${u}-fg)`} />{[...Array(14)].map((_, i) => <circle key={i} cx={50 + Math.cos(i) * (12 + i)} cy={50 + Math.sin(i * 1.6) * (10 + i * 0.6)} r="0.9" fill="#fff" opacity="0.8" />)}</g>),
  parrot: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M58 30 q16 6 12 30 q-3 20 -22 22 q10 -14 8 -30 q-2 -16 2 -22 Z" fill={`url(#${u}-acc)`} /><circle cx="60" cy="34" r="6" fill="#0c140e" stroke={c} strokeWidth="1.4" /><circle cx="61" cy="33" r="1.6" fill="#fff" /><path d="M54 36 L44 38 L54 41 Z" fill="#f0c451" /><path d="M40 50 L34 76 M44 52 L40 78" stroke="#6a5226" strokeWidth="2" /></g>),
  severed: (c, u) => (<g filter={`url(#${u}-fd)`}>{[-1, 0, 1].map((d, i) => <path key={i} d={`M${50 + d * 7} 46 C ${50 + d * 12} 30 ${50 + d * 16} 20 ${50 + d * 19} 12`} stroke="#e21b1b" strokeWidth={i === 1 ? 3 : 2} fill="none" filter={`url(#${u}-fg)`} />)}<ellipse cx="50" cy="58" rx="13" ry="15" fill="#120608" stroke="#e21b1b" strokeWidth="1.4" /><circle cx="44" cy="56" r="1.8" fill={c} /><circle cx="56" cy="56" r="1.8" fill={c} /><path d="M44 66 q6 3 12 0" stroke={c} strokeWidth="1" fill="none" /><circle cx="50" cy="46" r="3" fill="#1a0608" stroke={c} strokeWidth="1" /></g>),
  crow: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M30 52 Q50 40 70 52 Q60 50 50 54 Q40 50 30 52 Z" fill="#0a0a0c" /><ellipse cx="50" cy="58" rx="11" ry="16" fill="#08080a" /><circle cx="50" cy="44" r="8" fill="#0c0c0e" /><path d="M58 44 L70 46 L58 48 Z" fill="#caa23a" /><circle cx="53" cy="43" r="2.2" fill={c} /><circle cx="53.6" cy="42.4" r="0.7" fill="#fff" /><path d="M44 72 L42 82 M52 72 L52 82" stroke="#222" strokeWidth="1.6" /></g>),
  lotus: (c, u) => (<g filter={`url(#${u}-fd)`}>{[...Array(7)].map((_, i) => { const a = (i / 6 - 0.5) * 2.6; return <path key={i} d="M50 64 C 38 44 44 24 50 16 C 56 24 62 44 50 64 Z" fill={`url(#${u}-gold)`} opacity={0.92} transform={`rotate(${a * 26} 50 64) scale(${1 - Math.abs(a) * 0.1})`} style={{ transformOrigin: "50px 64px" }} />; })}<path d="M30 64 Q50 56 70 64 Q50 72 30 64 Z" fill="#e8638f" opacity="0.8" /></g>),
  flame: (c, u) => (<g filter={`url(#${u}-fg)`}><path d="M50 18 C 64 38 70 52 58 68 C 64 56 54 52 52 60 C 52 48 44 44 50 18 Z" fill="url(#flmg)" /><defs><linearGradient id="flmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff3c4" /><stop offset="40%" stopColor="#ff8a2a" /><stop offset="100%" stopColor="#b81b0a" /></linearGradient></defs><path d="M50 70 C 56 56 50 50 50 40 C 46 52 44 60 50 70 Z" fill="#8b5cf6" opacity="0.85" /></g>),
  monitorface: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="22" y="24" width="56" height="44" rx="3" fill="#0a1016" stroke="#2a3640" strokeWidth="1.6" /><rect x="26" y="28" width="48" height="36" rx="1.5" fill="#0c1822" /><rect x="34" y="40" width="12" height="7" rx="1" fill="#0a1016" stroke={c} strokeWidth="0.8" /><rect x="54" y="40" width="12" height="7" rx="1" fill="#0a1016" stroke={c} strokeWidth="0.8" /><path d="M35 45 L39 42 L42 44 L45 41" stroke="#5dff9b" strokeWidth="0.9" fill="none" /><path d="M55 45 L59 42 L62 44 L65 41" stroke="#5dff9b" strokeWidth="0.9" fill="none" /><path d="M42 56 q8 4 16 0" stroke={c} strokeWidth="1.2" fill="none" /><rect x="44" y="68" width="12" height="6" fill="#1a242c" /><rect x="34" y="74" width="32" height="3" rx="1.5" fill="#2a3640" /></g>),
  chatfig: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="24" y="20" width="52" height="40" rx="4" fill="#0a0f12" stroke={c} strokeWidth="1.4" /><path d="M40 60 L40 70 L52 60 Z" fill="#0a0f12" />{[...Array(4)].map((_, i) => <rect key={i} x="30" y={26 + i * 7} width={14 + (i * 9) % 30} height="3.4" rx="1.7" fill={i % 2 ? c : "#3a4a44"} />)}<circle cx="50" cy="42" r="9" fill="none" stroke={c} strokeWidth="1" opacity="0.6" /><text x="50" y="45" fontSize="7" fill={c} fontFamily="monospace" textAnchor="middle">14k</text></g>),
  shadowfig: (c, u) => (<g filter={`url(#${u}-fd)`}><ellipse cx="50" cy="36" rx="11" ry="12" fill="#05040a" /><path d="M32 78 C32 52 40 40 50 40 C60 40 68 52 68 78 Z" fill="#05040a" /><rect x="44" y="32" width="5" height="5" fill={`url(#${u}-orb)`} opacity="0.5" /><rect x="51" y="32" width="5" height="5" fill={`url(#${u}-orb)`} opacity="0.5" /><path d="M50 40 L50 78" stroke={c} strokeWidth="0.5" opacity="0.4" /></g>),
  badge: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M50 18 L78 30 V52 C78 68 64 78 50 84 C36 78 22 68 22 52 V30 Z" fill={`url(#${u}-acc)`} stroke="#fff" strokeOpacity="0.3" /><path d="M40 50 L47 58 L62 40" stroke="#08110b" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M50 18 L78 30 V40 C70 30 60 26 50 26 Z" fill="#fff" opacity="0.18" /></g>),
  crown: (c, u) => (<g filter={`url(#${u}-fd)`} transform="rotate(-10 50 50)"><path d="M26 64 L22 34 L36 48 L50 26 L64 48 L78 34 L74 64 Z" fill={`url(#${u}-gold)`} stroke="#5a3f10" strokeWidth="1" /><circle cx="50" cy="34" r="3" fill="#e21b1b" /><rect x="26" y="64" width="48" height="6" fill="#caa23a" /></g>),
  mic: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="40" y="16" width="20" height="40" rx="10" fill={`url(#${u}-metal)`} stroke="#0a0a0a" strokeWidth="0.6" />{[...Array(5)].map((_, i) => <line key={i} x1="40" y1={22 + i * 7} x2="60" y2={22 + i * 7} stroke="#0a0a0a" strokeWidth="0.7" opacity="0.5" />)}<path d="M32 50 a18 18 0 0 0 36 0" fill="none" stroke="#6a7278" strokeWidth="2.4" /><rect x="48" y="68" width="4" height="14" fill="#3a4248" /><rect x="40" y="82" width="20" height="4" rx="2" fill="#2a3036" /><circle cx="64" cy="22" r="4" fill="#ff2e2e" filter={`url(#${u}-fg)`} /></g>),
  headset: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M26 56 C26 30 74 30 74 56" fill="none" stroke="#6a7278" strokeWidth="4" /><rect x="20" y="52" width="13" height="22" rx="5" fill={`url(#${u}-metal)`} /><rect x="67" y="52" width="13" height="22" rx="5" fill={`url(#${u}-metal)`} /><rect x="23" y="56" width="7" height="14" rx="3" fill={c} opacity="0.6" /><path d="M74 70 q8 4 8 -6" stroke="#3a4248" strokeWidth="2.4" fill="none" /><circle cx="82" cy="60" r="2.2" fill={c} /></g>),
  folder: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M22 34 L44 34 L50 40 L78 40 L78 72 L22 72 Z" fill="#7a6a44" stroke="#4a3f24" strokeWidth="1" /><rect x="30" y="46" width="40" height="30" fill="#e8e2d0" transform="rotate(-3 50 60)" /><rect x="36" y="52" width="26" height="4" fill="#111" transform="rotate(-3 50 60)" /><rect x="36" y="60" width="18" height="4" fill="#111" transform="rotate(-3 50 60)" /><path d="M22 38 L44 38 L50 44 L78 44 L78 74 L22 74 Z" fill="#8a784e" opacity="0.85" /></g>),
  scroll: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="34" y="20" width="32" height="60" fill="#e4d8b4" /><rect x="34" y="20" width="32" height="60" fill={`url(#${u}-acc)`} opacity="0.12" />{[...Array(6)].map((_, i) => <rect key={i} x="39" y={28 + i * 8} width={22 - (i % 3) * 4} height="2.4" fill="#7a5a2a" opacity={0.5 + i * 0.07} />)}<rect x="30" y="16" width="40" height="7" rx="3.5" fill={`url(#${u}-metal)`} /><rect x="30" y="78" width="40" height="7" rx="3.5" fill={`url(#${u}-metal)`} /></g>),
  candle: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="42" y="40" width="16" height="42" rx="2" fill="#e8e2d0" /><path d="M42 44 q4 6 16 2 l0 -4 q-8 4 -16 0 Z" fill="#cfc8b4" /><rect x="49" y="32" width="2" height="9" fill="#3a2c18" /><path d="M50 16 C 58 26 58 32 50 32 C 42 32 44 24 50 16 Z" fill="url(#cflm)" filter={`url(#${u}-fg)`} /><defs><linearGradient id="cflm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff3c4" /><stop offset="100%" stopColor="#ff9a2a" /></linearGradient></defs><ellipse cx="50" cy="36" rx="14" ry="4" fill="#ff9a2a" opacity="0.2" /></g>),
  bowl: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M28 48 Q50 40 72 48 L64 72 Q50 80 36 72 Z" fill="#2a2620" stroke="#4a4236" strokeWidth="1.4" /><ellipse cx="50" cy="48" rx="22" ry="6" fill="#15120d" /><path d="M44 30 q-4 -8 2 -12 q4 4 2 8 q4 -2 2 6 Z" fill="#8a7a4a" opacity="0.6" filter={`url(#${u}-fg)`} /><path d="M58 50 q-3 -10 2 -14 q5 4 3 9 q4 -1 2 7 Z" fill="#e8638f" /></g>),
  mask: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M26 24 L50 30 L50 78 C40 72 28 56 26 40 Z" fill="#caa23a" opacity="0.9" /><path d="M74 24 L50 30 L50 78 C60 72 72 56 74 40 Z" fill="#3a4a52" /><circle cx="38" cy="44" r="3" fill="#0a0a0a" /><circle cx="62" cy="44" r="3" fill="#0a0a0a" /><path d="M50 30 L50 78" stroke="#fff" strokeWidth="0.6" opacity="0.4" /></g>),
  gears: (c, u) => (<g filter={`url(#${u}-fd)`}>{[[42, 44, 18], [66, 58, 13]].map(([cx, cy, r], gi) => <g key={gi}><circle cx={cx} cy={cy} r={r} fill={`url(#${u}-metal)`} />{[...Array(8)].map((_, i) => { const a = i / 8 * 6.283; return <rect key={i} x={cx - 2.4} y={cy - r - 4} width="4.8" height="6" fill="#5a6268" transform={`rotate(${a * 57} ${cx} ${cy})`} />; })}<circle cx={cx} cy={cy} r={r * 0.4} fill="#1c2023" /></g>)}</g>),
  spinner: (c, u) => (<g filter={`url(#${u}-fg)`}><circle cx="50" cy="50" r="22" fill="none" stroke="#2a3036" strokeWidth="5" /><path d="M50 28 a22 22 0 0 1 18 11" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.1s" repeatCount="indefinite" /></path><text x="50" y="54" fontSize="9" fill={c} fontFamily="monospace" textAnchor="middle">73%</text></g>),
  waveform: (c, u) => (<g filter={`url(#${u}-fd)`}>{[...Array(15)].map((_, i) => { const h = Math.abs(Math.sin(i * 0.8) * Math.cos(i * 0.4)) * 30 + 4; return <rect key={i} x={22 + i * 4} y={50 - h / 2} width="2.6" height={h} rx="1.3" fill={c} opacity="0.85" />; })}<line x1="20" y1="50" x2="82" y2="50" stroke={c} strokeWidth="0.5" opacity="0.4" /></g>),
  ouroboros: (c, u) => (<g filter={`url(#${u}-fg)`}>{[...Array(40)].map((_, i) => { const a = (i / 40) * 6.283; const r = 26 + Math.sin(i * 0.9) * 1.5; return <circle key={i} cx={50 + Math.cos(a) * r} cy={50 + Math.sin(a) * r} r={1 + (i / 40) * 1.6} fill={i > 35 ? "#0a0402" : "#ff5a1e"} opacity={i > 32 ? 0.4 : 0.9} />; })}<circle cx="50" cy="50" r="20" fill="#000" /></g>),
  progress: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="22" y="44" width="56" height="12" rx="2" fill="#0a0703" stroke="#3a2c18" strokeWidth="1" /><rect x="24" y="46" width="50" height="8" rx="1" fill={`url(#${u}-acc)`} /><rect x="71" y="46" width="3" height="8" fill="#0a0703" /><text x="50" y="68" fontSize="8" fill={c} fontFamily="monospace" textAnchor="middle">99%</text></g>),
  timeline: (c, u) => (<g filter={`url(#${u}-fd)`}>{[...Array(14)].map((_, i) => (i > 5 && i < 9) ? null : <rect key={i} x={22 + i * 4.2} y="42" width="3" height="16" fill={i % 3 ? "#3a4248" : c} />)}<rect x={22 + 6 * 4.2} y="40" width={3 * 4.2} height="20" fill="#000" /><rect x={22 + 6 * 4.2} y="40" width={3 * 4.2} height="20" fill="none" stroke={c} strokeWidth="0.6" strokeDasharray="2 2" /></g>),
  door: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="30" y="20" width="40" height="62" fill="#0a0c0e" stroke="#2a3036" strokeWidth="1.6" /><rect x="50" y="20" width="20" height="62" fill="#10141a" /><rect x="50" y="20" width="20" height="62" fill={`url(#${u}-acc)`} opacity="0.4" /><line x1="50" y1="20" x2="50" y2="82" stroke={c} strokeWidth="1.4" filter={`url(#${u}-fg)`} /><circle cx="46" cy="52" r="1.6" fill="#6a7278" /></g>),
  terminal: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="20" y="26" width="60" height="48" rx="3" fill="#04120a" stroke="#0e3a22" strokeWidth="1.4" /><text x="26" y="44" fontSize="7" fill="#3ee895" fontFamily="monospace">{`> EXECUTE`}</text><text x="26" y="56" fontSize="7" fill="#3ee895" fontFamily="monospace">PROTOCOL_</text><rect x="62" y="50" width="5" height="8" fill="#3ee895"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" /></rect></g>),
  handglass: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="24" y="18" width="52" height="64" rx="3" fill={c} opacity="0.12" stroke={c} strokeWidth="1" /><path d="M38 40 q-2 -12 4 -14 q4 1 3 8 q4 -2 3 6 q4 0 2 8 q-1 8 -8 8 q-7 0 -7 -16 Z" fill="#caa23a" opacity="0.5" /><path d="M62 44 q2 -12 -4 -14 q-4 1 -3 8 q-4 -2 -3 6 q-4 0 -2 8 q1 8 8 8 q7 0 7 -16 Z" fill="#6fa8ff" opacity="0.5" /></g>),
  balance: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="48" y="22" width="4" height="44" fill="#6a7278" /><path d="M22 36 L78 36" stroke="#6a7278" strokeWidth="2.4" /><path d="M22 36 L14 52 L30 52 Z" fill={`url(#${u}-acc)`} /><path d="M78 36 L70 48 L86 48 Z" fill="#3a4248" /><rect x="40" y="66" width="20" height="5" fill="#3a4248" /><circle cx="50" cy="34" r="3" fill="#caa23a" /></g>),
  tower: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M50 18 L42 78 L58 78 Z" fill={`url(#${u}-metal)`} /><path d="M50 24 L40 40 M50 24 L60 40 M44 52 L42 64 M56 52 L58 64" stroke="#3a4248" strokeWidth="1.4" /><circle cx="50" cy="20" r="3.4" fill={c} filter={`url(#${u}-fg)`} />{[...Array(3)].map((_, i) => <path key={i} d={`M50 20 m${-(10 + i * 8)} 0 a${10 + i * 8} ${10 + i * 8} 0 0 1 ${(10 + i * 8) * 2} 0`} fill="none" stroke={c} strokeWidth="0.8" opacity={0.5 - i * 0.13} />)}</g>),
  serverfire: (c, u) => (<g filter={`url(#${u}-fg)`}><rect x="32" y="30" width="36" height="50" rx="2" fill="#10141a" stroke="#2a3036" strokeWidth="1.2" />{[...Array(4)].map((_, i) => <rect key={i} x="36" y={36 + i * 11} width="28" height="6" fill="#0a0e12" stroke="#2a3036" strokeWidth="0.5" />)}<path d="M50 14 C 62 30 66 40 56 52 C 60 42 52 40 50 48 C 50 36 44 32 50 14 Z" fill="url(#srf)" /><defs><linearGradient id="srf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff3c4" /><stop offset="100%" stopColor="#d4540a" /></linearGradient></defs></g>),
  counter: (c, u) => (<g filter={`url(#${u}-fd)`}><rect x="24" y="34" width="52" height="32" rx="2" fill="#1a1c1e" stroke={`url(#${u}-metal)`} strokeWidth="2" />{[..."1000"].map((d, i) => <g key={i}><rect x={28 + i * 12} y="38" width="10" height="24" rx="1" fill="#0a0c0e" /><text x={33 + i * 12} y="55" fontSize="11" fill={c} fontFamily="monospace" textAnchor="middle">{d}</text></g>)}<rect x="24" y="66" width="52" height="5" fill="#3a4248" /></g>),
  refresh: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M50 28 a22 22 0 1 1 -20 12" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" /><path d="M50 20 L50 36 L62 28 Z" fill={c} />{[...Array(3)].map((_, i) => <circle key={i} cx="50" cy="50" r={22 + i * 5} fill="none" stroke={c} strokeWidth="0.6" opacity={0.3 - i * 0.08} />)}</g>),
  alert: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M50 20 L80 74 L20 74 Z" fill={`url(#${u}-acc)`} stroke="#fff" strokeOpacity="0.25" /><rect x="47" y="40" width="6" height="18" rx="3" fill="#08110b" /><circle cx="50" cy="66" r="3.4" fill="#08110b" /></g>),
  amulet: (c, u) => (<g filter={`url(#${u}-fd)`}><path d="M50 22 a14 8 0 0 0 0 16" fill="none" stroke="#6a7278" strokeWidth="2.4" /><path d="M50 38 L70 52 L50 82 L30 52 Z" fill={`url(#${u}-acc)`} stroke="#fff" strokeOpacity="0.25" /><circle cx="50" cy="56" r="7" fill="#05070a" /><circle cx="50" cy="56" r="3" fill={c} filter={`url(#${u}-fg)`} /></g>),
};

const FOCAL_FOR: Record<string, string> = {
  "tara-she-who-crosses": "eye", "chhinnamasta-the-self-beheaded": "severed", "dhumavati-the-widow": "crow",
  "kamala-the-lotus": "lotus", "bhairavi-the-terrible": "flame", "tripura-sundari-the-beautiful": "sri",
  "bhuvaneshvari-space-herself": "cosmos", "matangi-the-outcaste": "parrot",
  "the-chat-egregore": "chatfig", "psyches-shadow": "shadowfig", "the-algorithms-beloved": "monitorface",
  "the-parasitic-mod": "crown", "the-night-shift-viewer": "monitorface", "the-first-subscriber": "badge",
  "the-clip-farmer": "scroll", "the-dedicated-hater": "monitorface", "the-parasocial-confessor": "monitorface",
  "the-lurker-protocol": "badge", "the-refunded-subscription": "badge", "the-reformed-troll": "mask",
  "the-mirror-protocol": "mask", "archive-fever": "monitorface", "signal-debt": "tower",
  "the-parasocial-engine": "gears", "dead-chat": "monitorface", "the-stream-hole": "timeline",
  "the-tulpa-protocol": "cosmos", "the-ritual-upload": "progress", "signal-eaten": "ouroboros",
  "the-offering-bowl": "bowl", "psyches-headset": "headset",
  "the-compulsion-loop": "refresh", "parasocial-grief": "candle", "the-fourth-wall": "handglass",
  "the-authenticity-trap": "mask", "chronic-overshare": "waveform", "the-violence-of-kindness": "amulet",
  "the-persona-ratchet": "gears", "signal-hunger": "monitorface", "the-unmuted-microphone": "mic",
  "the-deleted-vod": "timeline", "psyches-first-camera": "monitorface", "the-doxxing-file": "folder",
  "the-super-chat-scroll": "scroll", "the-shrine-candle": "candle", "the-banned-word-list": "scroll",
  "the-first-goodbye-stream": "door", "the-swatting-night": "alert", "the-copyright-strike": "alert",
  "the-accidental-broadcast": "mic", "the-ban-wave": "badge", "the-midnight-confession": "monitorface",
  "the-final-transmission": "tower", "when-the-archive-burns": "serverfire", "the-return": "door",
  "protocol-omega": "terminal", "the-eternal-buffer": "spinner", "echo-chamber": "waveform",
  "frame-bleed": "timeline", "the-recursive-stream": "monitorface", "vod-gap": "timeline",
  "the-founding-cultist": "badge", "the-witness": "eye", "the-sacrifice": "badge",
  "parasocial-investment": "balance", "the-broadcast-wound": "waveform", "grief-frequency": "waveform",
  "the-open-channel": "tower", "the-unspoken-rule": "scroll", "the-thousand-hour-viewer": "counter",
};

const TYPE_FOCAL: Record<string, string> = {
  MAHAVIDYA: "eye", ENTITY: "monitorface", CIPHER: "mask", RELIC: "amulet",
  INCIDENT: "alert", PROPHECY: "door", GLITCH: "spinner", AVATAR: "badge",
  MEMBER: "counter", SIGNAL: "waveform", LORE: "scroll",
  VOICE: "monitorface", TRANSMISSION: "waveform", ORACLE: "door",
};

export function Focal({ card, uid }: { card: VaultCard; uid: string }) {
  const R = VAULT_RARITIES[card.rarity] ?? VAULT_RARITIES.STATIC;
  const c = R.color;
  const key = FOCAL_FOR[card.slug] || TYPE_FOCAL[card.cardType] || "amulet";
  const fn = M[key] || M.amulet;
  return (
    <svg className="cc-focal-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <FocalDefs uid={uid} c={c} />
      {fn(c, uid)}
    </svg>
  );
}
