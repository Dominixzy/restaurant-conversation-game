// Kitchen sound effects, synthesised with the Web Audio API (no audio files to load or license).
// Short sounds fire and forget; ongoing ones (sizzling, pouring) return a function that stops them early.

type Stop = () => void;
const NONE: Stop = () => {};

const MUTE_KEY = "sfx-muted";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = (() => {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
})();

export const isMuted = () => muted;
export function setMuted(value: boolean) {
  muted = value;
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    // storage blocked: the setting just won't be remembered
  }
}

// The audio context can only start after a user gesture; every sound here follows a click.
function audio() {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, out: master! };
}

let noiseBuffer: AudioBuffer | null = null;
function noiseSource(ac: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  return src;
}

// A single pitched note with a quick attack and exponential fade.
function tone(freq: number, length: number, { type = "sine" as OscillatorType, gain = 0.3, to = 0, delay = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + delay;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + length);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(g).connect(a.out);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

// Filtered noise: swishes, chops, sizzles. `wobble` makes the level flutter (crackle, pouring).
function noise(length: number, { filter = "bandpass" as BiquadFilterType, freq = 1000, to = 0, q = 1, gain = 0.3, attack = 0.01, wobble = 0, delay = 0 } = {}): Stop {
  const a = audio();
  if (!a) return NONE;
  const t = a.ctx.currentTime + delay;
  const src = noiseSource(a.ctx);
  const f = a.ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + length);
  f.Q.value = q;
  const g = a.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + Math.max(attack, length - 0.08));
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(f).connect(g);
  if (wobble) {
    const lfo = a.ctx.createOscillator();
    const depth = a.ctx.createGain();
    const shaped = a.ctx.createGain();
    lfo.frequency.value = wobble;
    depth.gain.value = 0.5;
    shaped.gain.value = 0.5;
    lfo.connect(depth).connect(shaped.gain);
    g.connect(shaped).connect(a.out);
    lfo.start(t);
    lfo.stop(t + length + 0.05);
  } else {
    g.connect(a.out);
  }
  src.start(t);
  src.stop(t + length + 0.05);
  return () => {
    const now = a.ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    src.stop(now + 0.1);
  };
}

// Several random pitched blips over a stretch of time (bubbling water or oil).
function blips(length: number, { low = 250, high = 650, every = 0.07, gain = 0.08 } = {}): Stop {
  const a = audio();
  if (!a) return NONE;
  const timers: number[] = [];
  for (let t = 0; t < length; t += every * (0.5 + Math.random())) {
    timers.push(window.setTimeout(() => tone(low + Math.random() * (high - low), 0.06, { gain, to: high * 1.4 }), t * 1000));
  }
  return () => timers.forEach((id) => window.clearTimeout(id));
}

const both = (...stops: Stop[]): Stop => () => stops.forEach((s) => s());

export const sfx = {
  // Something placed on the plate.
  pop: () => tone(520, 0.12, { to: 880, gain: 0.25 }),
  // Knife through food onto the board.
  chop: () => {
    noise(0.07, { filter: "highpass", freq: 2500, gain: 0.35 });
    tone(170, 0.08, { to: 90, gain: 0.3, type: "triangle", delay: 0.03 });
  },
  // Pestle into the mortar.
  thud: () => {
    tone(130, 0.14, { to: 55, gain: 0.5 });
    noise(0.06, { filter: "lowpass", freq: 600, gain: 0.25 });
  },
  // Spoon, hands or rolling pin moving through food.
  swish: (length = 0.25) => noise(length, { freq: 500, to: 1400, q: 2, gain: 0.18, attack: length / 2 }),
  flip: () => noise(0.22, { freq: 300, to: 2000, q: 3, gain: 0.25, attack: 0.1 }),
  // Done: a little bell.
  ding: () => {
    tone(1318, 0.5, { gain: 0.18 });
    tone(1976, 0.4, { gain: 0.08, delay: 0.02 });
  },
  // A step the order didn't ask for.
  buzz: () => tone(150, 0.22, { type: "square", gain: 0.08, to: 120 }),
  // Dish served: a happy arpeggio, or a sad slide when it was wrong.
  success: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, { gain: 0.2, type: "triangle", delay: i * 0.09 })),
  fail: () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, { gain: 0.18, type: "triangle", delay: i * 0.14 })),

  // Ongoing sounds, `length` seconds long.
  sizzle: (length: number) => noise(length, { filter: "highpass", freq: 3500, gain: 0.12, attack: 0.2, wobble: 13 }),
  boil: (length: number) => both(noise(length, { filter: "lowpass", freq: 400, gain: 0.08, attack: 0.3 }), blips(length)),
  fry: (length: number) => both(noise(length, { filter: "highpass", freq: 2500, gain: 0.14, attack: 0.15, wobble: 19 }), blips(length, { low: 700, high: 1400, every: 0.05, gain: 0.04 })),
  oven: (length: number) => noise(length, { filter: "lowpass", freq: 250, gain: 0.25, attack: 0.3, wobble: 3 }),
  pour: (length: number, delay = 0) => noise(length, { freq: 900, q: 3, gain: 0.2, attack: 0.1, wobble: 9, delay }),
  shake: (length: number) => noise(length, { filter: "highpass", freq: 5000, gain: 0.15, attack: 0.05, wobble: 11 }),
  brush: (length: number) => noise(length, { freq: 1500, q: 0.8, gain: 0.1, attack: 0.15, wobble: 4 }),
  roll: (length: number) => noise(length, { freq: 350, to: 900, q: 1.5, gain: 0.2, attack: 0.2, wobble: 6 }),
};
