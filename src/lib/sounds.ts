// Quirky audio feedback. Web Audio API only — zero asset files, fully offline.
// All synthesized live; bound by per-call gain envelopes so nothing screams.
// Default OFF (App Store hates surprise audio); gate every call on settings.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterVol = 0.5;
let enabled = false;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = masterVol;
    masterGain.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

// ─── public toggles, called from settings store ──────────────────────────
export function setSoundEnabled(on: boolean) {
  enabled = on;
}
export function setSoundVolume(v: number) {
  masterVol = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = masterVol;
}
export function isSoundReady(): boolean {
  return enabled && getCtx() !== null;
}

// ─── primitives ──────────────────────────────────────────────────────────
interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  decay?: number;
  detune?: number;
  filterFreq?: number;
}

function tone(freq: number, when: number, dur: number, opts: ToneOpts = {}) {
  if (!isSoundReady()) return;
  const ac = ctx!;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.value = freq;
  if (opts.detune) osc.detune.value = opts.detune;
  const peak = opts.gain ?? 0.1;
  const attack = opts.attack ?? 0.005;
  const decay = opts.decay ?? dur;
  const start = ac.currentTime + when;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  let node: AudioNode = g;
  if (opts.filterFreq) {
    const filt = ac.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = opts.filterFreq;
    osc.connect(filt);
    filt.connect(g);
  } else {
    osc.connect(g);
  }
  node.connect(masterGain!);
  osc.start(start);
  osc.stop(start + attack + decay + 0.05);
}

function noiseBurst(when: number, dur: number, opts: { gain?: number; filterFreq?: number } = {}) {
  if (!isSoundReady()) return;
  const ac = ctx!;
  const bufSize = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  const peak = opts.gain ?? 0.05;
  const start = ac.currentTime + when;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  const filt = ac.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = opts.filterFreq ?? 1200;
  filt.Q.value = 0.7;
  src.connect(filt);
  filt.connect(g);
  g.connect(masterGain!);
  src.start(start);
  src.stop(start + dur + 0.05);
}

// ─── public sound effects ────────────────────────────────────────────────

/** Bright ascending C5→E5 — correct answer. */
export function soundCorrect() {
  tone(523, 0,    0.10, { gain: 0.08 });
  tone(659, 0.07, 0.16, { gain: 0.08 });
}

/** Short low buzz — wrong answer. */
export function soundWrong() {
  tone(200, 0, 0.18, { type: 'triangle', gain: 0.07 });
}

/** Soft selection tap — option highlighted. */
export function soundTap() {
  tone(880, 0, 0.05, { gain: 0.04 });
}

/** NYSE opening bell — multi-harmonic strike + decay. */
export function soundBell() {
  // Three harmonics of A5/C#6/E6 with noise transient to mimic clapper.
  noiseBurst(0, 0.05, { gain: 0.12, filterFreq: 3200 });
  tone(880,  0,    0.9, { gain: 0.10, decay: 0.9 });
  tone(1109, 0,    0.7, { gain: 0.06, decay: 0.7 });
  tone(1318, 0,    0.5, { gain: 0.04, decay: 0.5 });
  tone(440,  0.05, 1.2, { gain: 0.07, decay: 1.2 }); // sub-octave shimmer
}

/** Cash register "ka-ching" — XP earned / streak preserved. */
export function soundKaching() {
  // Click + bright bell ding
  noiseBurst(0, 0.04, { gain: 0.10, filterFreq: 5000 });
  tone(1568, 0.04, 0.18, { gain: 0.10, type: 'triangle' }); // G6
  tone(2093, 0.06, 0.25, { gain: 0.07, type: 'triangle' }); // C7
  tone(1318, 0.18, 0.20, { gain: 0.06, type: 'sine' });     // E6
}

/** Trader-floor phone — two-pulse warble. */
export function soundPhone() {
  tone(620,  0,    0.13, { gain: 0.07, type: 'square', filterFreq: 1800 });
  tone(440,  0.13, 0.13, { gain: 0.07, type: 'square', filterFreq: 1800 });
  tone(620,  0.30, 0.13, { gain: 0.07, type: 'square', filterFreq: 1800 });
  tone(440,  0.43, 0.13, { gain: 0.07, type: 'square', filterFreq: 1800 });
}

/** Closing-bell mini-jingle — descending pentatonic + bronze tap. */
export function soundClosingBell() {
  const pent = [880, 784, 659, 587, 523]; // A5 G5 E5 D5 C5
  pent.forEach((f, i) => tone(f, i * 0.10, 0.18, { gain: 0.08, type: 'sine' }));
  noiseBurst(0.55, 0.06, { gain: 0.08, filterFreq: 4000 });
}

/** Rising 3-tone fanfare — streak milestone / level up. */
export function soundFanfare() {
  tone(523, 0,    0.12, { gain: 0.08 }); // C5
  tone(659, 0.10, 0.12, { gain: 0.08 }); // E5
  tone(784, 0.20, 0.30, { gain: 0.10 }); // G5
  tone(1046, 0.20, 0.30, { gain: 0.05 }); // C6 octave
}

/** Big triumphant chord — title earned / promotion. */
export function soundPromotion() {
  // C major 7 chord arpeggio + sustained
  const chord = [523, 659, 784, 988]; // C E G B
  chord.forEach((f, i) => tone(f, i * 0.04, 0.6, { gain: 0.06, type: 'sine' }));
  // sustained pad
  tone(261, 0.0, 0.9, { gain: 0.04, type: 'triangle' }); // C4 pad
}

/** Deep distant gong — Black Swan day. Single ominous hit. */
export function soundBlackSwan() {
  tone(98,  0,    2.0, { gain: 0.16, type: 'sine', decay: 2.0 });
  tone(130, 0.02, 1.8, { gain: 0.08, type: 'triangle', decay: 1.8 });
  tone(196, 0.05, 1.5, { gain: 0.04, type: 'sine', decay: 1.5 });
  noiseBurst(0, 0.2, { gain: 0.03, filterFreq: 200 });
}

/** Diamond Hands — 10 hard streak — brass-flavored ascent. */
export function soundDiamondHands() {
  const notes = [392, 523, 659, 784, 1046]; // G4 C5 E5 G5 C6
  notes.forEach((f, i) => tone(f, i * 0.09, 0.20, { gain: 0.09, type: 'sawtooth', filterFreq: 1800 }));
  tone(1318, 0.5, 0.6, { gain: 0.07, type: 'sine' }); // E6 crown
}

/** Insider title — deadpan minor 2-tone. "You've been flagged." */
export function soundInsider() {
  tone(440, 0,    0.25, { gain: 0.08, type: 'triangle' }); // A4
  tone(415, 0.30, 0.40, { gain: 0.08, type: 'triangle' }); // G#4 — minor 2 descent
}

/** Mr. Market — random arp in C lydian, slightly silly. */
export function soundMrMarket() {
  const lyd = [523, 587, 659, 740, 784, 880, 988, 1046];
  // 5-note random walk
  for (let i = 0; i < 5; i++) {
    const f = lyd[Math.floor(Math.random() * lyd.length)];
    tone(f, i * 0.07, 0.12, { gain: 0.06, type: 'triangle' });
  }
}

/** PAID IN FULL stamp — thunk + brief ring. */
export function soundStamp() {
  noiseBurst(0, 0.06, { gain: 0.18, filterFreq: 280 });   // wood thunk
  tone(220, 0.02, 0.25, { gain: 0.10, type: 'triangle' }); // resonance
  tone(110, 0.03, 0.35, { gain: 0.06, type: 'sine' });
}

/** Freeze used — icy chime. */
export function soundFreeze() {
  tone(1568, 0,    0.18, { gain: 0.07, type: 'sine' }); // G6
  tone(2093, 0.06, 0.22, { gain: 0.05, type: 'sine' }); // C7
  tone(1318, 0.15, 0.25, { gain: 0.05, type: 'sine' }); // E6
}

/** Markets reopen — somber-to-hopeful tonic resolution. */
export function soundMarketsReopen() {
  tone(220, 0,    0.30, { gain: 0.07, type: 'triangle' }); // A3 minor feel
  tone(330, 0.20, 0.30, { gain: 0.07, type: 'triangle' }); // E4
  tone(440, 0.45, 0.40, { gain: 0.08, type: 'triangle' }); // A4
  tone(659, 0.65, 0.50, { gain: 0.08, type: 'sine' });     // E5 hope
}

// ─── Mini "songs" — short jingles for ceremonial moments ─────────────────

/** CNBC-style market-open jingle. */
export function jingleMarketOpen() {
  const seq: [number, number, number][] = [
    // [freq, startSec, durSec]
    [523, 0.00, 0.15], // C5
    [659, 0.15, 0.15], // E5
    [784, 0.30, 0.15], // G5
    [1046, 0.45, 0.30], // C6
    [988, 0.80, 0.15], // B5
    [1046, 0.95, 0.40], // C6
  ];
  for (const [f, s, d] of seq) tone(f, s, d, { gain: 0.07, type: 'sine' });
  // bass anchor
  tone(131, 0.0, 1.4, { gain: 0.04, type: 'triangle' });
}

/** "Closing the books" — short reflective outro for exam complete. */
export function jingleSessionEnd() {
  const seq: [number, number, number][] = [
    [392, 0.00, 0.20], // G4
    [523, 0.20, 0.20], // C5
    [659, 0.40, 0.20], // E5
    [784, 0.60, 0.40], // G5
    [659, 1.00, 0.20], // E5
    [523, 1.20, 0.60], // C5 resolve
  ];
  for (const [f, s, d] of seq) tone(f, s, d, { gain: 0.07, type: 'sine' });
}
