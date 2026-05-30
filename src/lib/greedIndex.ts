// Greed Index — deterministic daily XP multiplier.
// Same seed yields the same state on any device for a given calendar date.

import { mulberry32, djb2 } from './rng';

export type GreedState = 'fear' | 'neutral' | 'greed' | 'euphoria';

export interface GreedReading {
  state: GreedState;
  label: string;
  multiplier: number;
  flavor: string;
  /** 0..1 dial position for the gauge (left = fear, right = euphoria). */
  dialAngle: number;
  /** Tailwind/inline color for the dial pointer. */
  color: string;
}

const TABLE: { state: GreedState; label: string; multiplier: number; weight: number; flavor: string; angle: number; color: string }[] = [
  { state: 'fear',     label: 'FEAR',     multiplier: 0.5, weight: 5,  flavor: 'The tape is jittery. Half-XP day.',                  angle: 0.08, color: '#a13a26' },
  { state: 'neutral',  label: 'NEUTRAL',  multiplier: 1.0, weight: 60, flavor: 'Quiet tape. Standard pricing.',                      angle: 0.50, color: '#8F5A39' },
  { state: 'greed',    label: 'GREED',    multiplier: 1.5, weight: 23, flavor: 'Risk-on. 1.5x XP on every question today.',          angle: 0.78, color: '#1e7a3a' },
  { state: 'euphoria', label: 'EUPHORIA', multiplier: 2.0, weight: 12, flavor: 'Markets are euphoric. 2x XP on all questions today.', angle: 0.94, color: '#b88321' },
];

export function getGreedForDate(dateISO: string): GreedReading {
  const seed = djb2('greed:' + dateISO);
  const rng = mulberry32(seed);
  const total = TABLE.reduce((a, b) => a + b.weight, 0);
  let r = rng() * total;
  for (const row of TABLE) {
    if (r < row.weight) {
      return {
        state: row.state,
        label: row.label,
        multiplier: row.multiplier,
        flavor: row.flavor,
        dialAngle: row.angle,
        color: row.color,
      };
    }
    r -= row.weight;
  }
  const last = TABLE[TABLE.length - 1];
  return { state: last.state, label: last.label, multiplier: last.multiplier, flavor: last.flavor, dialAngle: last.angle, color: last.color };
}

/**
 * Black Swan day — ~1.6% per day, independent of the greed roll.
 * No announcement, no label change. Triggers 3x XP, a faint 🦢 watermark on
 * question screens, and a subtle home-screen tint. Discovery is the reward.
 */
export function isBlackSwan(dateISO: string): boolean {
  const seed = djb2('swan:' + dateISO);
  const rng = mulberry32(seed);
  return rng() < 0.016;
}

export function getMultiplierForDate(dateISO: string): number {
  if (isBlackSwan(dateISO)) return 3.0;
  return getGreedForDate(dateISO).multiplier;
}
