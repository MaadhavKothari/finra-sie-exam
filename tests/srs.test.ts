import { describe, it, expect } from 'vitest';
import { createCard, reviewCorrect, reviewWrong, isDue, daysUntilReview } from '../src/lib/srs';

describe('srs', () => {
  it('creates a card in the NEW ring due tomorrow', () => {
    const c = createCard('q-1', 'capital-markets', 'What is a bond?');
    expect(c.ring).toBe('new');
    expect(c.interval).toBe(1);
    expect(c.consecutiveCorrect).toBe(0);
    expect(c.stem).toBe('What is a bond?');
  });

  it('moves to REVIEW after one correct review', () => {
    const c = createCard('q-1', 'capital-markets', 'stem');
    const r = reviewCorrect(c);
    expect(r.ring).toBe('review');
    expect(r.consecutiveCorrect).toBe(1);
    expect(r.interval).toBeGreaterThanOrEqual(c.interval);
  });

  it('moves to MASTERED after 3 consecutive correct reviews', () => {
    let c = createCard('q-1', 'capital-markets', 'stem');
    c = reviewCorrect(c);
    c = reviewCorrect(c);
    c = reviewCorrect(c);
    expect(c.ring).toBe('mastered');
    expect(c.consecutiveCorrect).toBe(3);
  });

  it('reviewWrong resets consecutiveCorrect and pushes back to NEW', () => {
    let c = createCard('q-1', 'capital-markets', 'stem');
    c = reviewCorrect(c);
    c = reviewCorrect(c);
    c = reviewWrong(c);
    expect(c.consecutiveCorrect).toBe(0);
    expect(c.ring).toBe('new');
    expect(c.interval).toBe(1);
  });

  it('ease factor is clamped between 1.3 and 3.0', () => {
    let c = createCard('q-1', 'capital-markets', 'stem');
    for (let i = 0; i < 20; i++) c = reviewCorrect(c);
    expect(c.easeFactor).toBeLessThanOrEqual(3.0);
    for (let i = 0; i < 20; i++) c = reviewWrong(c);
    expect(c.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('truncates long stems to 80 chars', () => {
    const long = 'x'.repeat(200);
    const c = createCard('q-1', 'cap', long);
    expect(c.stem.length).toBeLessThanOrEqual(80);
  });

  it('isDue is true for a brand new card after a day passes', () => {
    const c = createCard('q-1', 'cap', 'stem');
    // simulate a fast-forward: hand-craft a card due yesterday
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    expect(isDue({ ...c, nextReviewDate: yesterday })).toBe(true);
  });

  it('daysUntilReview is negative for overdue cards', () => {
    const c = createCard('q-1', 'cap', 'stem');
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().split('T')[0];
    expect(daysUntilReview({ ...c, nextReviewDate: twoDaysAgo })).toBeLessThan(0);
  });
});
