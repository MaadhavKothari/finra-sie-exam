// Persistent Learn-mode store — tracks per-question phase escalation and mastery.
// Key format: "examId:sectionId:questionId" → { phase, correctInPhase, mastered }

import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';

export interface LearnRecord {
  phase: 1 | 2 | 3;
  correctInPhase: number;
  mastered: boolean;
}

export type LearnProgressMap = Record<string, LearnRecord>;

export const $learnRaw = persistentAtom<string>('sie-learn:', '{}');

export const $learnProgress = computed($learnRaw, (raw): LearnProgressMap => {
  try { return JSON.parse(raw); }
  catch { return {}; }
});

function save(map: LearnProgressMap) {
  $learnRaw.set(JSON.stringify(map));
}

function makeKey(examId: string, sectionId: string, questionId: string): string {
  return `${examId}:${sectionId}:${questionId}`;
}

export function getRecord(examId: string, sectionId: string, questionId: string): LearnRecord {
  const map = $learnProgress.get();
  const key = makeKey(examId, sectionId, questionId);
  return map[key] ?? { phase: 1, correctInPhase: 0, mastered: false };
}

export function recordLearnAnswer(
  examId: string,
  sectionId: string,
  questionId: string,
  correct: boolean,
): LearnRecord {
  const map = { ...$learnProgress.get() };
  const key = makeKey(examId, sectionId, questionId);
  const cur = map[key] ?? { phase: 1 as 1 | 2 | 3, correctInPhase: 0, mastered: false };

  if (cur.mastered) return cur;

  if (correct) {
    const newCorrect = cur.correctInPhase + 1;
    if (cur.phase === 1 && newCorrect >= 2) {
      // Promote to Phase 2
      map[key] = { phase: 2, correctInPhase: 0, mastered: false };
    } else if (cur.phase === 2 && newCorrect >= 2) {
      // Promote to Phase 3
      map[key] = { phase: 3, correctInPhase: 0, mastered: false };
    } else if (cur.phase === 3 && newCorrect >= 1) {
      // Mastered
      map[key] = { phase: 3, correctInPhase: 1, mastered: true };
    } else {
      map[key] = { ...cur, correctInPhase: newCorrect };
    }
  } else {
    // Wrong: reset correctInPhase but don't demote phase
    map[key] = { ...cur, correctInPhase: 0 };
  }

  save(map);
  return map[key];
}

/** Count mastered questions for a given exam + section (or 'all') from a list of question IDs. */
export function sectionMastery(examId: string, sectionId: string, questionIds: string[]): { mastered: number; total: number; percent: number } {
  const map = $learnProgress.get();
  let mastered = 0;
  for (const qId of questionIds) {
    const key = makeKey(examId, sectionId, qId);
    if (map[key]?.mastered) mastered++;
  }
  const total = questionIds.length;
  return { mastered, total, percent: total > 0 ? Math.round((mastered / total) * 100) : 0 };
}
