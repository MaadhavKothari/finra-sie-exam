import { describe, it, expect } from 'vitest';
import { getDailyBellQuestions } from '../src/lib/dailySeed';
import type { Question } from '../src/lib/types';

function mkQ(id: string): Question {
  return {
    id,
    stem: `stem ${id}`,
    choices: [
      { label: 'A', text: 'a', explanation: 'a' },
      { label: 'B', text: 'b', explanation: 'b' },
      { label: 'C', text: 'c', explanation: 'c' },
      { label: 'D', text: 'd', explanation: 'd' },
    ],
    correctAnswer: 'A',
    explanation: 'e',
    subtopic: 'sub',
    difficulty: 'medium',
    source: 'test',
  };
}

const pool = Array.from({ length: 50 }, (_, i) => mkQ(`q-${i}`));

describe('getDailyBellQuestions', () => {
  it('returns the requested count', () => {
    const out = getDailyBellQuestions('2026-05-29', pool, 5);
    expect(out.length).toBe(5);
  });

  it('is deterministic per date', () => {
    const a = getDailyBellQuestions('2026-05-29', pool, 5);
    const b = getDailyBellQuestions('2026-05-29', pool, 5);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it('changes set across days', () => {
    const a = getDailyBellQuestions('2026-05-29', pool, 5);
    const b = getDailyBellQuestions('2026-05-30', pool, 5);
    expect(a.map((q) => q.id)).not.toEqual(b.map((q) => q.id));
  });

  it('returns no duplicates within a day', () => {
    const out = getDailyBellQuestions('2026-05-29', pool, 5);
    const ids = out.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('handles a pool smaller than requested count', () => {
    const small = pool.slice(0, 3);
    const out = getDailyBellQuestions('2026-05-29', small, 5);
    expect(out.length).toBeLessThanOrEqual(3);
  });
});
