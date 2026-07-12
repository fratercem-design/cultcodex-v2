'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

const SECRET_LINKS = [
  { emoji: '\u{1F431}', label: 'The Cats', href: '/meow' },
  { emoji: '\u26A1', label: 'Stormborn', href: '/stormborn' },
  { emoji: '\u{1F52E}', label: 'The Oracle', href: '/oracle' },
];

export function KonamiEasterEgg() {
  const [unlocked, setUnlocked] = useState(false);
  const [visible, setVisible] = useState(false);
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetBuffer = useCallback(() => {
    bufferRef.current = [];
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Reset inactivity timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(resetBuffer, 2000);

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      bufferRef.current.push(key);

      // Keep buffer trimmed to code length
      if (bufferRef.current.length > KONAMI_CODE.length) {
        bufferRef.current = bufferRef.current.slice(-KONAMI_CODE.length);
      }

      // Check for match
      if (
        bufferRef.current.length === KONAMI_CODE.length &&
        bufferRef.current.every((k, i) => k === KONAMI_CODE[i])
      ) {
        setUnlocked(true);
        // Trigger fade-in on next frame
        requestAnimationFrame(() => setVisible(true));
        resetBuffer();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetBuffer]);

  function dismiss() {
    setVisible(false);
    // Wait for fade-out transition before unmounting
    setTimeout(() => setUnlocked(false), 400);
  }

  if (!unlocked) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-400 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Secret unlocked"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-void/90 konami-bg" />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center gap-8 px-6 py-12 max-w-lg text-center transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-accent-violet font-display text-3xl md:text-4xl font-bold tracking-wide">
          {'\u{1F52E}'} THE VOID WELCOMES YOU {'\u{1F52E}'}
        </h2>

        <p className="text-accent-gold font-display text-lg md:text-xl">
          You have unlocked the secret paths of the Codex.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {SECRET_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative px-6 py-3 rounded-lg border border-border bg-surface/80 font-mono text-text-primary hover:text-accent-cyan transition-all duration-300 hover:border-accent-cyan hover:shadow-[0_0_20px_rgba(98, 228, 200,0.25)]"
            >
              <span className="text-lg">
                {link.emoji} {link.label}
              </span>
            </Link>
          ))}
        </div>

        <button
          onClick={dismiss}
          className="mt-6 px-8 py-2 rounded border border-border text-text-muted font-mono text-sm hover:text-text-primary hover:border-accent-violet transition-colors duration-300"
        >
          Close
        </button>
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`
        .konami-bg {
          background:
            radial-gradient(ellipse at 20% 50%, rgba(110, 75, 174, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 50%, rgba(98, 228, 200, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 80%, rgba(200, 57, 46, 0.08) 0%, transparent 50%);
          animation: konami-drift 8s ease-in-out infinite alternate;
        }

        @keyframes konami-drift {
          0% {
            background-position: 0% 0%, 100% 0%, 50% 100%;
          }
          100% {
            background-position: 30% 20%, 70% 80%, 50% 0%;
          }
        }
      `}</style>
    </div>
  );
}
