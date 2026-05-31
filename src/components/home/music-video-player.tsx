"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const PLAYLIST_ID = "PLvfZtruvrMTufahIz2Mx9GI_4SJP-ySMw";

// ── YouTube IFrame API types ──────────────────────────────────────────────────

interface YTPlayer {
  setShuffle(shuffle: boolean): void;
  setVolume(vol: number): void;
  unMute(): void;
  mute(): void;
  isMuted(): boolean;
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
  destroy(): void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MusicVideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let destroyed = false;

    function initPlayer() {
      if (destroyed || !containerRef.current) return;

      // Replace the div with the YT player
      const player = new window.YT.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: {
          listType: "playlist",
          list: PLAYLIST_ID,
          autoplay: 1,
          mute: 1,
          loop: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          iv_load_policy: 3, // hide annotations
        },
        events: {
          onReady(e) {
            if (destroyed) return;
            e.target.setShuffle(true);
            e.target.playVideo();
            playerRef.current = e.target;
            setReady(true);
            setPlaying(true);
          },
          onStateChange(e) {
            // 1 = PLAYING, 2 = PAUSED, -1 = UNSTARTED
            setPlaying(e.data === 1);
          },
        },
      });

      // onReady may not fire if YT is already loaded; keep a ref anyway
      if (!destroyed) playerRef.current = player;
    }

    if (window.YT?.Player) {
      initPlayer();
    } else {
      // Chain onto any existing callback
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore — player may already be gone
      }
      playerRef.current = null;
    };
  }, []);

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      p.setVolume(80);
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }

  const sectionStyle: CSSProperties = {
    position: "relative",
    background: "#07060a",
    borderTop: "1px solid var(--term-line)",
    borderBottom: "1px solid var(--term-line)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid var(--term-line)",
  };

  const muteBtn: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontFamily: "var(--font-mono), monospace",
    fontSize: 10,
    letterSpacing: "0.14em",
    color: muted ? "var(--term-fg-dim)" : "var(--neon)",
    background: "transparent",
    border: `1px solid ${muted ? "var(--term-line)" : "var(--neon)"}`,
    padding: "5px 12px",
    cursor: "pointer",
    textShadow: muted ? "none" : "var(--glow-neon)",
    transition: "all 150ms ease",
    borderRadius: 2,
  };

  return (
    <section style={sectionStyle} aria-label="Music video player">
      {/* Header bar */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            color: "var(--neon)",
            letterSpacing: "0.32em",
            textShadow: "var(--glow-neon)",
          }}>
            // MUSIC
          </span>
          {ready && (
            <span style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              color: playing ? "var(--neon)" : "var(--term-fg-faint)",
              letterSpacing: "0.1em",
            }}>
              <span style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: playing ? "var(--neon)" : "var(--term-fg-faint)",
                boxShadow: playing ? "var(--glow-neon)" : "none",
                animation: playing ? "termBlink 2s step-end infinite" : undefined,
                flexShrink: 0,
              }} />
              {playing ? "PLAYING" : "PAUSED"}
            </span>
          )}
        </div>

        <button
          onClick={toggleMute}
          disabled={!ready}
          style={{ ...muteBtn, opacity: ready ? 1 : 0.4, cursor: ready ? "pointer" : "default" }}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 3.5H3L6 1v8L3 6.5H1V3.5z" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                <line x1="7.5" y1="3" x2="9.5" y2="7" stroke="currentColor" strokeWidth="0.9"/>
                <line x1="7.5" y1="7" x2="9.5" y2="3" stroke="currentColor" strokeWidth="0.9"/>
              </svg>
              UNMUTE
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 3.5H3L6 1v8L3 6.5H1V3.5z" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                <path d="M7.5 3.5 C9 4 9 6 7.5 6.5" stroke="currentColor" strokeWidth="0.9" fill="none"/>
                <path d="M8 2 C10.5 3.5 10.5 6.5 8 8" stroke="currentColor" strokeWidth="0.9" fill="none"/>
              </svg>
              MUTE
            </>
          )}
        </button>
      </div>

      {/* Player */}
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
        <div
          ref={containerRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </section>
  );
}
