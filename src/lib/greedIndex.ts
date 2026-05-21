// Greed Index — deterministic daily XP multiplier.
// Same seed yields the same state on any device for a given calendar date.

import { mulberry32, djb2 } from './rng';

export type GreedState = 'fear' | 'neutral' | 'greed' | 'euphoria' | 'black-swan';

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
  { state: 'fear',       label: 'FEAR',       multiplier: 0.5, weight: 5,  flavor: 'The tape is jittery. Half-XP day.',                              angle: 0.08, color: '#a13a26' },
  { state: 'neutral',    label: 'NEUTRAL',    multiplier: 1.0, weight: 60, flavor: 'Quiet tape. Standard pricing.',                                  angle: 0.50, color: '#8F5A39' },
  { state: 'greed',      label: 'GREED',      multiplier: 1.5, weight: 20, flavor: 'Risk-on. 1.5x XP on every question today.',                      angle: 0.75, color: '#1e7a3a' },
  { state: 'euphoria',   label: 'EUPHORIA',   multiplier: 2.0, weight: 10, flavor: 'Markets are euphoric. 2x XP on all questions today.',           angle: 0.92, color: '#b88321' },
  { state: 'black-swan', label: 'BLACK SWAN', multiplier: 3.0, weight: 5,  flavor: 'Tail event. 3x XP. No one will believe you tomorrow.',          angle: 1.00, color: '#000000' },
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
  // fallback (shouldn't hit)
  const last = TABLE[TABLE.length - 1];
  return { state: last.state, label: last.label, multiplier: last.multiplier, flavor: last.flavor, dialAngle: last.angle, color: last.color };
}

export function getMultiplierForDate(dateISO: string): number {
  return getGreedForDate(dateISO).multiplier;
}
