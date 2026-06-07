"use client";

/**
 * OracleAmbience
 *
 * Procedurally synthesized temple / new-age ambient music using the Web Audio API.
 * No external audio files — everything is generated:
 *   • A-minor pentatonic drone  (layered sine waves + slow LFO tremolo)
 *   • Singing-bowl bell melody  (triangle + detuned sine, long decay)
 *   • Cathedral reverb          (synthesized impulse response)
 *   • Soft delay echo           (for spaciousness)
 *
 * Floats fixed at bottom-left of the page.
 * First click unlocks the AudioContext (required by browser autoplay policy).
 */

import { useState, useRef, useEffect } from "react";

// A-minor pentatonic: A C D E G across several octaves
const PENTATONIC_FREQS = [
  55.0, 65.41, 73.42, 82.41, 98.0,       // A1 C2 D2 E2 G2
  110.0, 130.81, 146.83, 164.81, 196.0,  // A2 C3 D3 E3 G3
  220.0, 261.63, 293.66, 329.63, 392.0,  // A3 C4 D4 E4 G4
  440.0, 523.25, 587.33, 659.25, 783.99, // A4 C5 D5 E5 G5
  880.0, 1046.5,                          // A5 C6
];

// Melody pool: upper 60% of the scale — keeps it ethereal
const MELODY_POOL = PENTATONIC_FREQS.slice(8);

// Build a synthetic reverb impulse response (decaying white noise)
function buildReverb(ctx: AudioContext, duration = 3.5, decay = 3.0): ConvolverNode {
  const conv = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  conv.buffer = buf;
  return conv;
}

// Play one singing-bowl note: triangle osc + detuned overtone, long exponential decay
function playBell(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  peakGain = 0.07,
  decaySec = 4.5
) {
  const now = ctx.currentTime;

  // Fundamental — triangle for warmth
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = "triangle";
  osc1.frequency.value = freq;
  g1.gain.setValueAtTime(0, now);
  g1.gain.linearRampToValueAtTime(peakGain, now + 0.04);
  g1.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);
  osc1.connect(g1);
  g1.connect(dest);
  osc1.start(now);
  osc1.stop(now + decaySec + 0.1);

  // Overtone (2.756× — inharmonic, like a real bowl)
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = freq * 2.756;
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(peakGain * 0.35, now + 0.02);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + decaySec * 0.6);
  osc2.connect(g2);
  g2.connect(dest);
  osc2.start(now);
  osc2.stop(now + decaySec * 0.7);
}

export function OracleAmbience() {
  const [active, setActive] = useState(false);
  const [started, setStarted] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const droneOscsRef = useRef<OscillatorNode[]>([]);
  const droneGainsRef = useRef<GainNode[]>([]);
  const lfoOscsRef = useRef<OscillatorNode[]>([]);
  const melodyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Build and start the audio graph ──────────────────────────────
  function initAudio() {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Master gain (fades in/out)
    const master = ctx.createGain();
    master.gain.value = 0;
    masterRef.current = master;

    // Reverb chain
    const reverb = buildReverb(ctx);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.55;

    // Delay echo (1/3 sec, feedback 0.35)
    const delay = ctx.createDelay(2.0);
    delay.delayTime.value = 0.33;
    const delayFb = ctx.createGain();
    delayFb.gain.value = 0.32;
    const delayOut = ctx.createGain();
    delayOut.gain.value = 0.3;

    delay.connect(delayFb);
    delayFb.connect(delay);
    delay.connect(delayOut);
    delayOut.connect(ctx.destination);

    // Routing: master → reverb → out + delay
    //          master → dry out
    master.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(ctx.destination);
    reverbGain.connect(delay);
    master.connect(ctx.destination);

    // ── Drone oscillators ──
    // A minor: A2 + E3 + A3 (perfect fifth + octave)
    const droneDefs: [number, OscillatorType, number][] = [
      [110.0, "sine", 0.18],  // A2 — fundamental
      [164.81, "sine", 0.09], // E3 — perfect fifth
      [220.0, "sine", 0.07],  // A3 — octave
      [55.0, "sine", 0.10],   // A1 — sub bass
    ];

    droneDefs.forEach(([freq, type, vol], i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0;

      // Slow LFO tremolo
      const lfo = ctx.createOscillator();
      const lfoAmt = ctx.createGain();
      lfo.frequency.value = 0.25 + i * 0.06;
      lfoAmt.gain.value = vol * 0.25;
      lfo.connect(lfoAmt);
      lfoAmt.connect(gain.gain);
      lfo.start();

      osc.connect(gain);
      gain.connect(master);
      osc.start();

      // Fade drone in slowly
      gain.gain.setTargetAtTime(vol, ctx.currentTime, 3.0);

      droneOscsRef.current.push(osc, lfo);
      droneGainsRef.current.push(gain);
    });

    // ── Melody loop ──
    function scheduleNext() {
      if (!ctxRef.current) return;

      // Pick a random note, weighted toward mid-range
      const idx = Math.floor(Math.random() * MELODY_POOL.length);
      const freq = MELODY_POOL[idx];

      // Occasionally play a chord interval (minor third above)
      playBell(ctx, master, freq, 0.065, 5.0);
      if (Math.random() < 0.35) {
        playBell(ctx, master, freq * 1.189, 0.03, 4.0); // minor third
      }

      // Gap: 2–7 seconds
      const gap = 2200 + Math.random() * 4800;
      melodyTimerRef.current = setTimeout(scheduleNext, gap);
    }

    // First note after 2s delay so drone establishes first
    melodyTimerRef.current = setTimeout(scheduleNext, 2000);

    // Fade master in
    master.gain.setTargetAtTime(1.0, ctx.currentTime, 2.0);

    setStarted(true);
    setActive(true);
  }

  // ── Toggle mute / unmute ──────────────────────────────────────────
  function toggle() {
    if (!started) {
      initAudio();
      return;
    }

    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    if (active) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.8);
      setActive(false);
    } else {
      master.gain.setTargetAtTime(1.0, ctx.currentTime, 0.8);
      setActive(true);
    }
  }

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (melodyTimerRef.current) clearTimeout(melodyTimerRef.current);
      droneOscsRef.current.forEach((o) => { try { o.stop(); } catch {} });
      ctxRef.current?.close();
    };
  }, []);

  return (
    <button
      onClick={toggle}
      title={active ? "Mute ambient music" : "Play ambient temple music"}
      className="group fixed bottom-6 left-6 z-50 flex items-center gap-2.5 rounded-full border px-4 py-2.5 transition-all duration-500 focus:outline-none"
      style={{
        background: active
          ? "radial-gradient(ellipse at 30% 40%, rgba(155,110,208,0.4) 0%, rgba(93,183,216,0.18) 60%, rgba(10,0,20,0.85) 100%)"
          : "rgba(10, 0, 20, 0.85)",
        borderColor: active ? "rgba(155,110,208,0.7)" : "rgba(155,110,208,0.35)",
        boxShadow: active
          ? "0 0 16px rgba(155,110,208,0.4), 0 0 40px rgba(93,183,216,0.15)"
          : "0 0 6px rgba(155,110,208,0.1)",
        backdropFilter: "blur(12px)",
      }}
      aria-label={active ? "Mute ambient music" : "Play ambient temple music"}
    >
      {/* Pulsing ring when active */}
      {active && (
        <span
          className="absolute inset-0 rounded-full animate-ping pointer-events-none"
          style={{ border: "1px solid rgba(155,110,208,0.3)", animationDuration: "2.5s" }}
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <span
        className="relative text-lg leading-none transition-colors duration-300"
        style={{ color: active ? "#9B6ED0" : "rgba(155,110,208,0.6)" }}
        aria-hidden="true"
      >
        {active ? "♫" : "♪"}
      </span>

      {/* Label — always visible */}
      <span
        className="relative font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300"
        style={{ color: active ? "rgba(155,110,208,0.9)" : "rgba(155,110,208,0.45)" }}
      >
        {active ? "ambient on" : "ambient"}
      </span>
    </button>
  );
}
