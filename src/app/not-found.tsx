"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { VoidSigil } from "@/components/graphics/void-sigil";
import { OrnamentalBreak } from "@/components/graphics/mystical-divider";

const lostTransmissions = [
  "The Oracle saw this coming... but said nothing.",
  "Even the cards couldn't predict this dead end.",
  "This panel was gonged before it even started.",
  "The cat walked across the keyboard and deleted this page.",
  "This transmission was intercepted by a rogue mod.",
  "The Trollipedia has no entry for this URL.",
];

export default function NotFound() {
  const [quote, setQuote] = useState(lostTransmissions[0]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuote(lostTransmissions[Math.floor(Math.random() * lostTransmissions.length)]);
  }, []);

  return (
    <main className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center overflow-hidden">
      {/* Floating particles - CSS only */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(30px); opacity: 0; }
        }
        @keyframes float-up-alt {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(-10vh) translateX(-20px); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.3); }
          50% { text-shadow: 0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.2); }
        }
        @keyframes sigil-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          pointer-events: none;
        }
        .particle-gold { background: rgba(255,215,0,0.4); }
        .particle-cyan { background: rgba(0,217,255,0.3); }
        .particle-purple { background: rgba(147,51,234,0.3); }
      `}</style>

      {/* Floating particles */}
      <div className="particle particle-gold" style={{ left: "10%", animation: "float-up 8s linear infinite", animationDelay: "0s" }} />
      <div className="particle particle-cyan" style={{ left: "25%", animation: "float-up-alt 10s linear infinite", animationDelay: "1s" }} />
      <div className="particle particle-purple" style={{ left: "40%", animation: "float-up 12s linear infinite", animationDelay: "2s" }} />
      <div className="particle particle-gold" style={{ left: "55%", animation: "float-up-alt 9s linear infinite", animationDelay: "0.5s" }} />
      <div className="particle particle-cyan" style={{ left: "70%", animation: "float-up 11s linear infinite", animationDelay: "3s" }} />
      <div className="particle particle-purple" style={{ left: "85%", animation: "float-up-alt 7s linear infinite", animationDelay: "1.5s" }} />
      <div className="particle particle-gold" style={{ left: "15%", animation: "float-up 13s linear infinite", animationDelay: "4s" }} />
      <div className="particle particle-cyan" style={{ left: "60%", animation: "float-up-alt 8s linear infinite", animationDelay: "2.5s" }} />
      <div className="particle particle-purple" style={{ left: "90%", animation: "float-up 10s linear infinite", animationDelay: "5s" }} />
      <div className="particle particle-gold" style={{ left: "35%", animation: "float-up-alt 14s linear infinite", animationDelay: "3.5s" }} />
      <div className="particle particle-cyan" style={{ left: "5%", animation: "float-up 9s linear infinite", animationDelay: "6s" }} />
      <div className="particle particle-purple" style={{ left: "75%", animation: "float-up 11s linear infinite", animationDelay: "1.2s" }} />

      {/* Sigil with float animation */}
      <div style={{ animation: "sigil-float 4s ease-in-out infinite" }}>
        <VoidSigil size={140} />
      </div>

      <h1
        className="mt-6 font-display text-5xl font-bold text-accent-gold"
        style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
      >
        404
      </h1>

      <p className="mt-2 font-display text-lg text-accent-gold-text/70">
        Lost in the Void
      </p>

      <OrnamentalBreak className="my-3" />

      {/* Random lost transmission quote */}
      <p className="font-mono text-sm text-accent-cyan italic">
        &ldquo;{quote}&rdquo;
      </p>

      <p className="mt-3 font-mono text-xs text-text-muted">
        The page you seek has slipped between dimensions.
        <br />
        Perhaps it never existed. Perhaps it existed too much.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg border border-accent-gold bg-accent-gold/10 px-4 py-2 font-mono text-xs text-accent-gold-text transition-all hover:bg-accent-gold/20 hover:shadow-lg hover:shadow-accent-gold/10"
        >
          Return Home
        </Link>
        <Link
          href="/episodes"
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-muted transition-all hover:border-accent-gold/30 hover:text-text-primary hover:shadow-lg hover:shadow-accent-gold/5"
        >
          Browse Episodes
        </Link>
      </div>

      {/* Easter egg hint */}
      <p className="mt-12 font-mono text-[9px] text-text-muted/30 tracking-widest">
        Psst... have you tried /oracle?
      </p>
    </main>
  );
}
