"use client";

import { useState } from "react";
import Link from "next/link";

interface PsychBreakdown {
  speaker: string;
  traits: string[];
  drivers: string[];
  signals: string[];
}

interface PowerDynamics {
  dominant: string;
  evidence: string[];
  shifts: string[];
}

interface ManipulationSignal {
  tactic: string;
  who: string;
  evidence: string;
}

interface Archetype {
  speaker: string;
  archetype: string;
  supporting: string;
}

interface DecodeData {
  psychological_breakdown?: PsychBreakdown[];
  power_dynamics?: PowerDynamics;
  manipulation_signals?: ManipulationSignal[];
  archetypes?: Archetype[];
  key_patterns?: string[];
  generated_at?: string;
}

interface DecodeModeLockedProps {
  isAuthenticated: boolean;
}

function DecodeModeLocked({ isAuthenticated }: DecodeModeLockedProps) {
  return (
    <div className="rounded-lg border border-accent-violet/30 bg-accent-violet/5 p-8 text-center space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet">
        /// initiate_only
      </p>
      <h3 className="font-display text-lg font-bold text-accent-violet">
        Decode Mode — Initiates see this.
      </h3>
      <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
        AI psychological analysis of every panel. Power dynamics, manipulation signals, archetypes, and patterns — mapped and structured.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        {!isAuthenticated && (
          <Link
            href="/api/auth/signin"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2 font-mono text-xs text-text-muted hover:text-text-primary hover:border-text-muted/40 transition-colors"
          >
            Sign in first
          </Link>
        )}
        <Link
          href="/premium#access"
          className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/40 bg-accent-violet/10 hover:bg-accent-violet/20 px-5 py-2 font-mono text-xs font-bold text-accent-violet transition-colors"
        >
          Become Initiate+ — $10/mo <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function DecodeSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-elevated transition-colors"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-violet">{title}</span>
        <span className="font-mono text-xs text-text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Tag({ label, variant = "default" }: { label: string; variant?: "default" | "red" | "violet" }) {
  const cls =
    variant === "red"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : variant === "violet"
      ? "border-accent-violet/30 bg-accent-violet/10 text-accent-violet"
      : "border-border bg-elevated text-text-primary";
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] ${cls}`}>
      {label}
    </span>
  );
}

interface DecodeModeProps {
  decodeData: DecodeData | null;
  isUnlocked: boolean;
  isAuthenticated: boolean;
}

export function DecodeModePanel({ decodeData, isUnlocked, isAuthenticated }: DecodeModeProps) {
  if (!isUnlocked) {
    return <DecodeModeLocked isAuthenticated={isAuthenticated} />;
  }

  if (!decodeData) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">/// decode_pending</p>
        <p className="text-sm text-text-muted">Analysis not yet generated for this episode.</p>
      </div>
    );
  }

  const { psychological_breakdown, power_dynamics, manipulation_signals, archetypes, key_patterns, generated_at } = decodeData;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet">/// decode_mode</p>
        {generated_at && (
          <p className="font-mono text-[9px] text-text-muted">
            Generated {new Date(generated_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Psychological Breakdown */}
      {psychological_breakdown && psychological_breakdown.length > 0 && (
        <DecodeSection title="Psychological Breakdown">
          <div className="space-y-4">
            {psychological_breakdown.map((p, i) => (
              <div key={i} className="space-y-2">
                <p className="font-mono text-xs font-semibold text-text-primary">{p.speaker}</p>
                {p.traits.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1">Traits</p>
                    <div className="flex flex-wrap gap-1">
                      {p.traits.map((t) => <Tag key={t} label={t} variant="violet" />)}
                    </div>
                  </div>
                )}
                {p.drivers.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1">Drivers</p>
                    <ul className="space-y-1">
                      {p.drivers.map((d) => (
                        <li key={d} className="text-xs text-text-muted leading-relaxed pl-3 border-l border-accent-violet/30">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.signals.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1">Observable Signals</p>
                    <ul className="space-y-1">
                      {p.signals.map((s) => (
                        <li key={s} className="text-xs text-text-muted leading-relaxed pl-3 border-l border-border">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DecodeSection>
      )}

      {/* Power Dynamics */}
      {power_dynamics && (
        <DecodeSection title="Power Dynamics">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Dominant</span>
              <Tag label={power_dynamics.dominant} variant="violet" />
            </div>
            {power_dynamics.evidence.length > 0 && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1">Evidence</p>
                <ul className="space-y-1.5">
                  {power_dynamics.evidence.map((e) => (
                    <li key={e} className="text-xs text-text-muted leading-relaxed pl-3 border-l border-accent-violet/30">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {power_dynamics.shifts.length > 0 && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1">Power Shifts</p>
                <ul className="space-y-1.5">
                  {power_dynamics.shifts.map((s) => (
                    <li key={s} className="text-xs text-text-muted leading-relaxed pl-3 border-l border-amber-500/30">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DecodeSection>
      )}

      {/* Manipulation Signals */}
      {manipulation_signals && manipulation_signals.length > 0 && (
        <DecodeSection title="Manipulation Signals">
          <div className="space-y-3">
            {manipulation_signals.map((m, i) => (
              <div key={i} className="rounded border border-red-500/20 bg-red-500/5 p-3 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag label={m.tactic} variant="red" />
                  <span className="font-mono text-[9px] text-text-muted">by {m.who}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed italic">"{m.evidence}"</p>
              </div>
            ))}
          </div>
        </DecodeSection>
      )}

      {/* Archetypes */}
      {archetypes && archetypes.length > 0 && (
        <DecodeSection title="Archetypes">
          <div className="grid gap-3 sm:grid-cols-2">
            {archetypes.map((a, i) => (
              <div key={i} className="rounded border border-border bg-elevated p-3 space-y-1">
                <p className="font-mono text-xs font-semibold text-text-primary">{a.speaker}</p>
                <Tag label={a.archetype} variant="violet" />
                <p className="text-xs text-text-muted leading-relaxed">{a.supporting}</p>
              </div>
            ))}
          </div>
        </DecodeSection>
      )}

      {/* Key Patterns */}
      {key_patterns && key_patterns.length > 0 && (
        <DecodeSection title="Key Patterns">
          <ul className="space-y-2">
            {key_patterns.map((p) => (
              <li key={p} className="flex items-start gap-2 text-xs text-text-muted leading-relaxed">
                <span className="text-accent-violet mt-0.5 flex-shrink-0">✦</span>
                {p}
              </li>
            ))}
          </ul>
        </DecodeSection>
      )}
    </div>
  );
}
