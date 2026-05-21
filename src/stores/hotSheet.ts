// Persistent Hot Sheet store — spaced repetition cards for wrong answers.
// Stored as a JSON-serialized array in a single persistent key.

import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';
import { createCard, reviewCorrect, reviewWrong, isDue, type HotSheetCard, type Ring } from '../lib/srs';

export const $hotSheetRaw = persistentAtom<string>('sie-hotsheet:', '[]');

export const $hotSheetCards = computed($hotSheetRaw, (raw) => {
  try { return JSON.parse(raw) as HotSheetCard[]; }
  catch { return []; }
});

function save(cards: HotSheetCard[]) {
  $hotSheetRaw.set(JSON.stringify(cards));
}

/** Add a wrong answer to the Hot Sheet if not already tracked (or re-lapse if mastered). */
export function enqueueWrong(questionId: string, section: string, stem: string) {
  const cards = $hotSheetCards.get();
  const existing = cards.find((c) => c.questionId === questionId);
  if (existing) {
    // Reset the card (re-lapse)
    const updated = reviewWrong(existing);
    save(cards.map((c) => c.questionId === questionId ? updated : c));
  } else {
    const card = createCard(questionId, section, stem);
    save([...cards, card]);
  }
}

/** Record a correct review from the Hot Sheet drill. */
export function recordReviewCorrect(questionId: string) {
  const cards = $hotSheetCards.get();
  save(cards.map((c) => c.questionId === questionId ? reviewCorrect(c) : c));
}

/** Record a wrong review from the Hot Sheet drill. */
export function recordReviewWrong(questionId: string) {
  const cards = $hotSheetCards.get();
  save(cards.map((c) => c.questionId === questionId ? reviewWrong(c) : c));
}

/** Get cards due today, capped at 15 per the playbook. */
export const $dueCards = computed($hotSheetCards, (cards) => {
  return cards.filter(isDue).slice(0, 15);
});

/** Summary counts by ring. */
export const $ringCounts = computed($hotSheetCards, (cards) => {
  const counts: Record<Ring, number> = { new: 0, review: 0, mastered: 0 };
  for (const c of cards) counts[c.ring]++;
  return counts;
});

/** Total count of all cards. */
export const $totalCards = computed($hotSheetCards, (cards) => cards.length);

/** Due count for home widget. */
export const $dueCount = computed($hotSheetCards, (cards) => {
  return cards.filter(isDue).length;
});
