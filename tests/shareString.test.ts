import { describe, it, expect } from 'vitest';
import { generateShareString, parseShareString } from '../src/lib/shareString';

describe('generateShareString — bell', () => {
  it('renders 5 emoji cells for a bell result', () => {
    const results = [
      { correct: true },
      { correct: true },
      { correct: false },
      { correct: true },
      { correct: true },
    ];
    const s = generateShareString(results, {
      mode: 'bell',
      date: '2026-05-29',
      streak: 12,
      xp: 1234,
      greedMultiplier: 1.5,
    });
    expect(s).toContain('🟩');
    expect(s).toContain('🟥');
    // Should include 4 greens + 1 red
    const greens = (s.match(/🟩/g) || []).length;
    const reds = (s.match(/🟥/g) || []).length;
    expect(greens).toBe(4);
    expect(reds).toBe(1);
  });

  it('mentions the streak and date', () => {
    const s = generateShareString([{ correct: true }], {
      mode: 'bell',
      date: '2026-05-29',
      streak: 47,
      xp: 100,
      greedMultiplier: 1,
    });
    expect(s).toContain('47');
    expect(s.toLowerCase()).toMatch(/may|2026|05/);
  });

  it('omits no questions from the grid', () => {
    const results = Array.from({ length: 5 }, () => ({ correct: false }));
    const s = generateShareString(results, {
      mode: 'bell',
      date: '2026-05-29',
      streak: 0,
      xp: 0,
      greedMultiplier: 1,
    });
    const reds = (s.match(/🟥/g) || []).length;
    expect(reds).toBe(5);
  });
});

describe('parseShareString — round-trip', () => {
  it('parses a bell result it just generated', () => {
    const original = generateShareString(
      [{ correct: true }, { correct: true }, { correct: false }, { correct: true }, { correct: true }],
      { mode: 'bell', date: '2026-05-29', streak: 12, xp: 1234, greedMultiplier: 1.5 },
    );
    const p = parseShareString(original);
    expect(p.mode).toBe('bell');
    expect(p.score).toEqual({ correct: 4, total: 5 });
    expect(p.grid.length).toBe(5);
    expect(p.grid.filter((g) => g.correct).length).toBe(4);
    expect(p.streak).toBe(12);
    expect(p.greedMultiplier).toBe(1.5);
  });

  it('parses an exam result it just generated', () => {
    const results = Array.from({ length: 75 }, (_, i) => ({ correct: i < 60 }));
    const original = generateShareString(results, {
      mode: 'exam', title: 'SIE Mock', date: '2026-05-29', duration: 92, xp: 5000,
    });
    const p = parseShareString(original);
    expect(p.mode).toBe('exam');
    expect(p.percent).toBe(80);
    expect(p.score).toEqual({ correct: 60, total: 75 });
    expect(p.durationMin).toBe(92);
    expect(p.title?.toLowerCase()).toContain('sie');
  });

  it('tolerates extra whitespace and stray text', () => {
    const messy = '\n\n  FINRA Prep 🔔 Opening Bell\n\nMay 29 — 3/5\n\n\n🟩🟩🟥🟩🟥\n\n12-day streak\n\nfrom my friend lol';
    const p = parseShareString(messy);
    expect(p.mode).toBe('bell');
    expect(p.score).toEqual({ correct: 3, total: 5 });
  });

  it('returns mode=unknown for garbage', () => {
    const p = parseShareString('just some random text');
    expect(p.mode).toBe('unknown');
  });
});

describe('generateShareString — exam', () => {
  it('emits an exam score line with the exam title and computed percentage', () => {
    const results = Array.from({ length: 75 }, (_, i) => ({ correct: i < 60 }));
    const s = generateShareString(results, {
      mode: 'exam',
      title: 'SIE Mock',
      date: '2026-05-29',
      duration: 92,
      greedMultiplier: 1,
    });
    expect(s).toContain('60'); // raw correct count
    expect(s).toContain('75'); // total
    expect(s).toContain('80'); // 60/75 = 80%
    expect(s.toLowerCase()).toContain('sie');
    expect(s).toContain('92'); // duration
  });
});
