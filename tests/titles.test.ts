import { describe, it, expect } from 'vitest';
import {
  TITLE_LADDER,
  SECRET_TITLES,
  titleForXp,
  nextTitle,
  xpToNextTitle,
  isCalcQuestion,
  isInsiderQuestion,
} from '../src/lib/titles';

describe('title ladder', () => {
  it('returns Intern at 0 XP', () => {
    expect(titleForXp(0).id).toBe('intern');
  });

  it('climbs to the right rank at each threshold', () => {
    expect(titleForXp(499).id).toBe('intern');
    expect(titleForXp(500).id).toBe('junior-associate');
    expect(titleForXp(2500).id).toBe('vp');
    expect(titleForXp(10_000).id).toBe('svp');
    expect(titleForXp(30_000).id).toBe('md');
    expect(titleForXp(75_000).id).toBe('partner');
    expect(titleForXp(10_000_000).id).toBe('partner');
  });

  it('returns null for nextTitle once at the top', () => {
    expect(nextTitle(80_000)).toBeNull();
  });

  it('reports progress toward next rank', () => {
    const p = xpToNextTitle(750);
    expect(p).not.toBeNull();
    expect(p!.percent).toBeGreaterThan(0);
    expect(p!.percent).toBeLessThanOrEqual(100);
    expect(p!.current + (p!.needed - p!.current)).toBe(p!.needed);
  });

  it('every secret title id matches its key', () => {
    for (const [id, t] of Object.entries(SECRET_TITLES)) {
      expect(t.id).toBe(id);
    }
  });

  it('ladder is monotonically non-decreasing in XP', () => {
    for (let i = 1; i < TITLE_LADDER.length; i++) {
      expect(TITLE_LADDER[i].minXp).toBeGreaterThanOrEqual(TITLE_LADDER[i - 1].minXp);
    }
  });
});

describe('isCalcQuestion', () => {
  it('matches $ amounts and percentages', () => {
    expect(isCalcQuestion('What is the yield on a $1,000 bond paying 5%?')).toBe(true);
    expect(isCalcQuestion('Calculate the breakeven point.')).toBe(true);
    expect(isCalcQuestion('A customer buys 100 shares at $50.')).toBe(true);
  });

  it('matches yield/margin subtopic even without $/%', () => {
    expect(isCalcQuestion('Explain it.', 'yield-calculation')).toBe(true);
    expect(isCalcQuestion('Explain it.', 'margin-rules')).toBe(true);
  });

  it('does not match conceptual questions', () => {
    expect(isCalcQuestion('Which agency regulates broker-dealers?')).toBe(false);
    expect(isCalcQuestion('What is a primary market transaction?')).toBe(false);
  });
});

describe('isInsiderQuestion', () => {
  it('matches stems mentioning insider trading or material nonpublic info', () => {
    expect(isInsiderQuestion('Insider trading is prohibited under...')).toBe(true);
    expect(isInsiderQuestion('Material nonpublic information was leaked.')).toBe(true);
    expect(isInsiderQuestion('A tipper tells a tippee about earnings.')).toBe(true);
  });

  it('does not match unrelated questions', () => {
    expect(isInsiderQuestion('Which is a debt security?')).toBe(false);
  });
});
