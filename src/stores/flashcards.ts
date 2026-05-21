// Leitner-box spaced repetition store for flashcard mode.
// 5 boxes with increasing review intervals.
// Persisted via @nanostores/persistent.

import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';

export interface FlashcardEntry {
  box: 1 | 2 | 3 | 4 | 5;
  lastReviewed: string; // ISO date
  nextReview: string;   // ISO date
}

export type FlashcardState = Record<string, FlashcardEntry>;

const BOX_INTERVALS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

const today = () => new Date().toISOString().split('T')[0];

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const $flashcardRaw = persistentAtom<string>('sie-flashcards:', '{}');

export const $flashcardState = computed($flashcardRaw, (raw) => {
  try { return JSON.parse(raw) as FlashcardState; }
  catch { return {} as FlashcardState; }
});

function save(state: FlashcardState) {
  $flashcardRaw.set(JSON.stringify(state));
}

/** Get or initialize a card's flashcard state. Returns null if never seen. */
export function getCardState(questionId: string): FlashcardEntry | null {
  const state = $flashcardState.get();
  return state[questionId] ?? null;
}

/** Initialize a card into Box 1 on first view. */
export function initCard(questionId: string): FlashcardEntry {
  const state = $flashcardState.get();
  if (state[questionId]) return state[questionId];
  const d = today();
  const entry: FlashcardEntry = {
    box: 1,
    lastReviewed: d,
    nextReview: addDays(d, BOX_INTERVALS[1]),
  };
  save({ ...state, [questionId]: entry });
  return entry;
}

/** Rate a card: 'hard' -> Box 1, 'good' -> up 1, 'easy' -> up 2 (cap 5). */
export function rateCard(questionId: string, rating: 'hard' | 'good' | 'easy'): FlashcardEntry {
  const state = $flashcardState.get();
  const current = state[questionId];
  const d = today();

  let newBox: number;
  if (rating === 'hard') {
    newBox = 1;
  } else if (rating === 'good') {
    newBox = Math.min(5, (current?.box ?? 1) + 1);
  } else {
    // easy
    newBox = Math.min(5, (current?.box ?? 1) + 2);
  }

  const entry: FlashcardEntry = {
    box: newBox as 1 | 2 | 3 | 4 | 5,
    lastReviewed: d,
    nextReview: addDays(d, BOX_INTERVALS[newBox]),
  };

  save({ ...state, [questionId]: entry });
  return entry;
}

/** Check if a card is due for review. */
export function isDueForReview(questionId: string): boolean {
  const state = $flashcardState.get();
  const entry = state[questionId];
  if (!entry) return true; // never seen = due
  if (entry.box === 1) return true; // Box 1 always due
  return entry.nextReview <= today();
}

/** Get due cards from a list of question IDs, sorted Box 1 first then by nextReview asc. Cap at 20. */
export function getDueCards(questionIds: string[]): string[] {
  const state = $flashcardState.get();
  const d = today();

  const due = questionIds.filter((id) => {
    const entry = state[id];
    if (!entry) return true;
    if (entry.box === 1) return true;
    return entry.nextReview <= d;
  });

  due.sort((a, b) => {
    const ea = state[a];
    const eb = state[b];
    // Unseen cards first (treated as box 0)
    const boxA = ea?.box ?? 0;
    const boxB = eb?.box ?? 0;
    if (boxA !== boxB) return boxA - boxB;
    // Then by nextReview ascending
    const nrA = ea?.nextReview ?? '0000-00-00';
    const nrB = eb?.nextReview ?? '0000-00-00';
    return nrA.localeCompare(nrB);
  });

  return due.slice(0, 20);
}

/** Get earliest next review date for non-due cards. Returns null if all are due or no cards exist. */
export function getNextReviewDate(questionIds: string[]): string | null {
  const state = $flashcardState.get();
  const d = today();
  let earliest: string | null = null;

  for (const id of questionIds) {
    const entry = state[id];
    if (!entry) continue;
    if (entry.box === 1) continue;
    if (entry.nextReview <= d) continue;
    if (!earliest || entry.nextReview < earliest) {
      earliest = entry.nextReview;
    }
  }

  return earliest;
}

/** Get box distribution for a set of question IDs. */
export function getBoxDistribution(questionIds: string[]): { unseen: number; box1: number; box2: number; box3: number; box4: number; box5: number } {
  const state = $flashcardState.get();
  const dist = { unseen: 0, box1: 0, box2: 0, box3: 0, box4: 0, box5: 0 };
  for (const id of questionIds) {
    const entry = state[id];
    if (!entry) { dist.unseen++; continue; }
    if (entry.box === 1) dist.box1++;
    else if (entry.box === 2) dist.box2++;
    else if (entry.box === 3) dist.box3++;
    else if (entry.box === 4) dist.box4++;
    else if (entry.box === 5) dist.box5++;
  }
  return dist;
}

/** Days until a specific date from today. */
export function daysUntil(isoDate: string): number {
  const d = today();
  const target = new Date(isoDate + 'T00:00:00');
  const now = new Date(d + 'T00:00:00');
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}
