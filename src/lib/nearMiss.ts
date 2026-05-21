// Near-miss detection for exam simulator.
// Identifies "flipping questions" — wrong answers that, if correct, would flip the result.

export interface ExamAnswer {
  questionId: string;
  stem: string;
  section: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correct: boolean;
  selectedAnswer: string;
  correctAnswer: string;
}

export interface NearMissResult {
  isNearMiss: boolean;
  scorePct: number;
  passingPct: number;
  pointsShort: number;
  /** Wrong answers sorted by easiest first — these could have "flipped" the result. */
  flippingQuestions: ExamAnswer[];
}

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

export function analyzeNearMiss(
  answers: ExamAnswer[],
  passingPct: number,
): NearMissResult {
  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const scorePct = Math.round((correct / total) * 100);
  const pointsShort = Math.max(0, Math.ceil(total * (passingPct / 100)) - correct);

  // Near miss: within 3% of passing AND below passing
  const isNearMiss = scorePct < passingPct && (passingPct - scorePct) <= 3;

  // Sort wrong answers: easiest first (the ones that "should" have been right)
  const wrongAnswers = answers
    .filter((a) => !a.correct)
    .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1));

  return {
    isNearMiss,
    scorePct,
    passingPct,
    pointsShort,
    flippingQuestions: wrongAnswers.slice(0, Math.max(3, pointsShort)),
  };
}

/** Section-level breakdown for diagnostic display. */
export interface SectionBreakdown {
  section: string;
  correct: number;
  total: number;
  pct: number;
}

export function getSectionBreakdown(answers: ExamAnswer[]): SectionBreakdown[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const s = map.get(a.section) ?? { correct: 0, total: 0 };
    s.total++;
    if (a.correct) s.correct++;
    map.set(a.section, s);
  }
  return Array.from(map.entries())
    .map(([section, { correct, total }]) => ({
      section,
      correct,
      total,
      pct: Math.round((correct / total) * 100),
    }))
    .sort((a, b) => a.pct - b.pct); // weakest first
}
