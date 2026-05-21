// Simplified SM-2 spaced repetition scheduler for the Hot Sheet.
// Cards progress through: NEW -> REVIEW -> MASTERED.

export type Ring = 'new' | 'review' | 'mastered';

export interface HotSheetCard {
  questionId: string;
  section: string;        // topic or section slug for display
  stem: string;           // truncated question stem for card preview
  wrongDate: string;      // ISO date first missed
  nextReviewDate: string; // ISO date when due
  interval: number;       // days until next review
  easeFactor: number;     // SM-2 ease (1.3..3.0)
  consecutiveCorrect: number; // consecutive correct reviews
  ring: Ring;
}

const today = () => new Date().toISOString().split('T')[0];

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Create a new card from a wrong answer. */
export function createCard(questionId: string, section: string, stem: string): HotSheetCard {
  const d = today();
  return {
    questionId,
    section,
    stem: stem.length > 80 ? stem.slice(0, 77) + '...' : stem,
    wrongDate: d,
    nextReviewDate: addDays(d, 1),
    interval: 1,
    easeFactor: 2.5,
    consecutiveCorrect: 0,
    ring: 'new',
  };
}

/** Update card after a correct review. */
export function reviewCorrect(card: HotSheetCard): HotSheetCard {
  const cc = card.consecutiveCorrect + 1;
  const newEase = Math.min(3.0, card.easeFactor + 0.1);
  const newInterval = Math.max(1, Math.round(card.interval * card.easeFactor));
  const d = today();

  if (cc >= 3) {
    return {
      ...card,
      consecutiveCorrect: cc,
      easeFactor: newEase,
      interval: newInterval,
      nextReviewDate: addDays(d, newInterval),
      ring: 'mastered',
    };
  }

  return {
    ...card,
    consecutiveCorrect: cc,
    easeFactor: newEase,
    interval: newInterval,
    nextReviewDate: addDays(d, newInterval),
    ring: 'review',
  };
}

/** Update card after a wrong review. */
export function reviewWrong(card: HotSheetCard): HotSheetCard {
  const d = today();
  return {
    ...card,
    consecutiveCorrect: 0,
    easeFactor: Math.max(1.3, card.easeFactor - 0.2),
    interval: 1,
    nextReviewDate: addDays(d, 1),
    ring: 'new',
  };
}

/** Check if a card is due for review today or earlier. */
export function isDue(card: HotSheetCard): boolean {
  return card.nextReviewDate <= today();
}

/** Days until a card's next review. Negative = overdue. */
export function daysUntilReview(card: HotSheetCard): number {
  const d = today();
  const next = new Date(card.nextReviewDate + 'T00:00:00');
  const now = new Date(d + 'T00:00:00');
  return Math.round((next.getTime() - now.getTime()) / 86_400_000);
}
