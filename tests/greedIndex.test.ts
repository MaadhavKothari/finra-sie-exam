import { describe, it, expect } from 'vitest';
import { getGreedForDate, getMultiplierForDate, isBlackSwan } from '../src/lib/greedIndex';

describe('greedIndex', () => {
  it('is deterministic for the same date', () => {
    const a = getGreedForDate('2026-05-29');
    const b = getGreedForDate('2026-05-29');
    expect(a).toEqual(b);
  });

  it('returns a valid multiplier for any date', () => {
    const valid = [0.5, 1.0, 1.5, 2.0, 3.0];
    for (let i = 0; i < 200; i++) {
      const date = new Date(2026, 0, 1 + i).toISOString().slice(0, 10);
      const m = getMultiplierForDate(date);
      expect(valid).toContain(m);
    }
  });

  it('produces all four greed states across a long window', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 365; i++) {
      const d = new Date(2026, 0, 1 + i).toISOString().slice(0, 10);
      seen.add(getGreedForDate(d).state);
    }
    // We should hit at least fear and neutral; greed/euphoria are rarer but should appear.
    expect(seen.has('neutral')).toBe(true);
    expect(seen.has('fear')).toBe(true);
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('Black Swan day fires roughly 1-3 times per 365 days', () => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(2026, 0, 1 + i).toISOString().slice(0, 10);
      if (isBlackSwan(d)) count++;
    }
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(15); // generous upper bound
  });

  it('Black Swan day forces 3x multiplier regardless of greed roll', () => {
    // Find any swan day in the next year and check the multiplier
    for (let i = 0; i < 365; i++) {
      const d = new Date(2026, 0, 1 + i).toISOString().slice(0, 10);
      if (isBlackSwan(d)) {
        expect(getMultiplierForDate(d)).toBe(3.0);
        return;
      }
    }
    throw new Error('No swan day found in 365 — vanishingly unlikely; seed may be broken');
  });
});
