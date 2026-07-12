"use client";

/**
 * The dossier's ambient audio layer (Ch. VII), built from oscillators and
 * filtered noise instead of licensed/recorded assets — there's nothing to
 * source, nothing to clear rights on, and it fits the site's own "Sacred
 * Terminal" identity better than a stock drone loop would. Everything here
 * is Web Audio API synthesis only.
 *
 * Never plays without an explicit user gesture: the browser's autoplay
 * policy already enforces that (an AudioContext starts "suspended" until
 * resumed inside a click/keydown handler), which happens to be exactly the
 * dossier's own rule ("default OFF... click to enable").
 */

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let drone: { stop: () => void } | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);
  return ctx;
}

function noiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Sub-bass pad (two slightly detuned sines) + a slow breathing LFO + filtered
 * noise standing in for tape hiss — the dossier's "low drone, tape hiss". */
function startDrone(context: AudioContext, destination: AudioNode) {
  const osc1 = context.createOscillator();
  const osc2 = context.createOscillator();
  osc1.type = "sine";
  osc2.type = "sine";
  osc1.frequency.value = 42;
  osc2.frequency.value = 42 * 1.008;

  const droneGain = context.createGain();
  droneGain.gain.value = 0.5;

  const lfo = context.createOscillator();
  lfo.frequency.value = 0.06; // ~16s breathing cycle
  const lfoGain = context.createGain();
  lfoGain.gain.value = 0.15;
  lfo.connect(lfoGain);
  lfoGain.connect(droneGain.gain);

  osc1.connect(droneGain);
  osc2.connect(droneGain);

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer(context, 4);
  noise.loop = true;
  const hissFilter = context.createBiquadFilter();
  hissFilter.type = "highpass";
  hissFilter.frequency.value = 3000;
  const hissGain = context.createGain();
  hissGain.gain.value = 0.02;
  noise.connect(hissFilter);
  hissFilter.connect(hissGain);

  droneGain.connect(destination);
  hissGain.connect(destination);

  osc1.start();
  osc2.start();
  lfo.start();
  noise.start();

  return {
    stop() {
      osc1.stop();
      osc2.stop();
      lfo.stop();
      noise.stop();
      osc1.disconnect();
      osc2.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
      droneGain.disconnect();
      noise.disconnect();
      hissFilter.disconnect();
      hissGain.disconnect();
    },
  };
}

export function enableAmbient(): void {
  const context = getContext();
  if (!context || !masterGain) return;
  if (context.state === "suspended") void context.resume();
  if (!drone) drone = startDrone(context, masterGain);
  const now = context.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0.35, now + 1.2);
}

export function disableAmbient(): void {
  if (!ctx || !masterGain) return;
  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0, now + 0.8);
}

// ── One-shot interaction SFX ── independent of the ambient bed's gain node,
// so they still play immediately even before the drone has faded in.

function pluck(
  context: AudioContext,
  freq: number,
  type: OscillatorType,
  attack: number,
  decay: number,
  peak: number,
  destination: AudioNode
): void {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = context.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(now);
  osc.stop(now + attack + decay + 0.05);
}

export function playChime(): void {
  const context = getContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    pluck(context, freq, "sine", 0.01 + i * 0.03, 0.9, 0.09, context.destination);
  });
}

/** Bell partials — inharmonic overtone ratios off a fundamental, the classic
 * struck-bell synthesis trick — for the mythic/legendary/forbidden reveal. */
export function playBell(): void {
  const context = getContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();
  const fundamental = 220;
  [1, 2.41, 3.12, 4.47].forEach((ratio, i) => {
    pluck(context, fundamental * ratio, "sine", 0.005, 1.8 - i * 0.3, 0.14 / (i + 1), context.destination);
  });
}

export function isAudioSupported(): boolean {
  return !!getAudioContextCtor();
}
