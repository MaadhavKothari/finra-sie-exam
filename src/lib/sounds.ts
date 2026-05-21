// Lightweight audio feedback using Web Audio API.
// Generates short synth tones — no audio files needed, works offline.
// Gracefully no-ops if AudioContext unavailable.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.12) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

/** Bright ascending two-tone chime — correct answer */
export function soundCorrect() {
  const ac = getCtx();
  if (!ac) return;
  playTone(523, 0.12, 'sine', 0.1);  // C5
  setTimeout(() => playTone(659, 0.18, 'sine', 0.1), 80);  // E5
}

/** Short low buzz — wrong answer */
export function soundWrong() {
  playTone(200, 0.2, 'triangle', 0.08);
}

/** Rising three-tone fanfare — streak milestone / level up */
export function soundFanfare() {
  const ac = getCtx();
  if (!ac) return;
  playTone(523, 0.12, 'sine', 0.08);  // C5
  setTimeout(() => playTone(659, 0.12, 'sine', 0.08), 100);  // E5
  setTimeout(() => playTone(784, 0.25, 'sine', 0.1), 200);   // G5
}

/** Single soft bell ping — card flip, selection */
export function soundTap() {
  playTone(880, 0.06, 'sine', 0.05);
}

/** NYSE-style opening bell — bell completion */
export function soundBell() {
  const ac = getCtx();
  if (!ac) return;
  playTone(880, 0.4, 'sine', 0.12);  // A5
  setTimeout(() => playTone(1109, 0.5, 'sine', 0.08), 150);  // C#6
  setTimeout(() => playTone(880, 0.6, 'sine', 0.06), 350);   // A5 decay
}
