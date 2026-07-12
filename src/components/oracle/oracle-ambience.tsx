"use client";

import { useState, useRef, useEffect } from "react";

// A-minor pentatonic, upper register — ethereal bell territory
const NOTES = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];

function makeReverb(ctx: AudioContext): ConvolverNode {
  const conv = ctx.createConvolver();
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  }
  conv.buffer = buf;
  return conv;
}

function playBell(ctx: AudioContext, dest: AudioNode, freq: number) {
  const now = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.18, now + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 5);
  g.connect(dest);

  // Fundamental (triangle — warm bell body)
  const o1 = ctx.createOscillator();
  o1.type = "triangle";
  o1.frequency.value = freq;
  o1.connect(g);
  o1.start(now);
  o1.stop(now + 5.5);

  // Inharmonic overtone (singing bowl quality)
  const o2 = ctx.createOscillator();
  o2.type = "sine";
  o2.frequency.value = freq * 2.756;
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.07, now + 0.02);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 3);
  o2.connect(g2);
  g2.connect(dest);
  o2.start(now);
  o2.stop(now + 3.5);
}

export function OracleAmbience() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const oscRefs = useRef<OscillatorNode[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.9;
    masterRef.current = master;

    const reverb = makeReverb(ctx);
    const rvGain = ctx.createGain();
    rvGain.gain.value = 0.5;

    master.connect(reverb);
    reverb.connect(rvGain);
    rvGain.connect(ctx.destination);
    master.connect(ctx.destination);

    // Drone: A2 + E3 + A3
    [[110, 0.20], [164.81, 0.10], [220, 0.08], [55, 0.12]].forEach(([freq, vol]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol as number, ctx.currentTime + 4);
      osc.connect(g);
      g.connect(master);
      osc.start();
      oscRefs.current.push(osc);
    });

    // Bell melody loop
    function ring() {
      if (!ctxRef.current) return;
      const freq = NOTES[Math.floor(Math.random() * NOTES.length)];
      playBell(ctx, master, freq);
      if (Math.random() < 0.4) playBell(ctx, master, freq * 1.5); // perfect fifth
      timerRef.current = setTimeout(ring, 2000 + Math.random() * 5000);
    }
    timerRef.current = setTimeout(ring, 1000);

    setReady(true);
    setOn(true);
  }

  function toggle() {
    if (!ready) { start(); return; }
    const master = masterRef.current;
    const ctx = ctxRef.current;
    if (!master || !ctx) return;
    if (on) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setOn(false);
    } else {
      master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.5);
      setOn(true);
    }
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    oscRefs.current.forEach(o => { try { o.stop(); } catch {} });
    ctxRef.current?.close();
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label={on ? "Mute ambient music" : "Play ambient music"}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all duration-300 focus:outline-none border"
      style={{
        background: on
          ? "linear-gradient(135deg, rgba(74, 45, 110,0.3) 0%, rgba(98, 228, 200,0.15) 100%)"
          : "rgba(8, 0, 18, 0.85)",
        borderColor: on ? "rgba(74, 45, 110,0.7)" : "rgba(74, 45, 110,0.3)",
        color: on ? "#4A2D6E" : "rgba(74, 45, 110,0.5)",
        boxShadow: on ? "0 0 20px rgba(74, 45, 110,0.35)" : "none",
        backdropFilter: "blur(10px)",
      }}
    >
      <span className="text-base">{on ? "♫" : "♪"}</span>
      <span>{on ? "on" : "music"}</span>
    </button>
  );
}
