// Deterministic per-day question selection for the Opening Bell.
// Same date + same question pool yields the same 5 questions.

import type { Question } from './types';
import { djb2, mulberry32 } from './rng';

export function getDailyBellQuestions(dateISO: string, allQuestions: Question[], count = 5): Question[] {
  if (allQuestions.length === 0) return [];
  const seed = djb2('bell:' + dateISO);
  const rng = mulberry32(seed);
  // Fisher–Yates shuffle on indices, then take first N.
  const idx = allQuestions.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(count, allQuestions.length)).map((i) => allQuestions[i]);
}
