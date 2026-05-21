import { useState, useEffect, useCallback } from 'preact/hooks';
import { getDueCards, getNextReviewDate, getBoxDistribution, initCard, rateCard, daysUntil, $flashcardState } from '../stores/flashcards';
import { useStore } from '@nanostores/preact';
import type { Question } from '../lib/types';

// JPMC brand tokens
const B = {
  bronze:     '#8F5A39',
  travertine: '#F4EFE7',
  border:     '#E5E0D8',
  muted:      '#6b6560',
};

interface Props {
  questions: Question[];
  topic: string;
  topicName: string;
  backUrl?: string;
}

/** 5-segment Leitner box indicator. Filled = bronze, empty = gray. */
function BoxIndicator({ box }: { box: number }) {
  return (
    <div class="flex gap-1 items-center" title={`Box ${box} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          class="rounded-sm transition-colors"
          style={{
            width: '16px',
            height: `${6 + i * 2}px`,
            backgroundColor: i <= box ? B.bronze : '#d1cdc7',
          }}
        />
      ))}
      <span class="text-xs ml-1.5" style={{ color: B.muted }}>Box {box}</span>
    </div>
  );
}

export default function FlashcardDeck({ questions, topic, topicName, backUrl }: Props) {
  const flashcardState = useStore($flashcardState);
  const [mode, setMode] = useState<'start' | 'session' | 'done' | 'caught-up'>('start');
  const [dueIds, setDueIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<{ id: string; rating: 'hard' | 'good' | 'easy' }[]>([]);
  const [flipDirection, setFlipDirection] = useState<'in' | 'out' | null>(null);

  const allIds = questions.map((q) => q.id);

  const startSession = useCallback(() => {
    const due = getDueCards(allIds);
    if (due.length === 0) {
      setMode('caught-up');
      return;
    }
    setDueIds(due);
    setCurrentIndex(0);
    setFlipped(false);
    setRated(false);
    setSessionRatings([]);
    setMode('session');
    // Initialize first card if unseen
    initCard(due[0]);
  }, [allIds]);

  const currentQ = dueIds.length > 0 ? questions.find((q) => q.id === dueIds[currentIndex]) : null;
  const currentEntry = currentQ ? (flashcardState[currentQ.id] ?? null) : null;
  const currentBox = currentEntry?.box ?? 1;

  const handleFlip = () => {
    if (mode !== 'session' || rated) return;
    setFlipped(!flipped);
  };

  const handleRate = (rating: 'hard' | 'good' | 'easy') => {
    if (!currentQ || rated) return;
    rateCard(currentQ.id, rating);
    setRated(true);
    setSessionRatings((prev) => [...prev, { id: currentQ.id, rating }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= dueIds.length) {
      setMode('done');
      return;
    }
    setFlipDirection('out');
    setTimeout(() => {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setFlipped(false);
      setRated(false);
      initCard(dueIds[nextIdx]);
      setFlipDirection('in');
      setTimeout(() => setFlipDirection(null), 300);
    }, 200);
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== 'session' || !currentQ) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) {
          handleFlip();
        } else if (rated) {
          handleNext();
        }
      }
      if (flipped && !rated) {
        if (e.key === '1' || e.key === 'h') handleRate('hard');
        if (e.key === '2' || e.key === 'g') handleRate('good');
        if (e.key === '3' || e.key === 'e') handleRate('easy');
      }
    },
    [mode, currentQ, flipped, rated, currentIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch/swipe to flip
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50 && !rated) {
      handleFlip();
    }
    setTouchStart(null);
  };

  // ─── START ──────────────────────────────────────────────────────────────
  if (mode === 'start') {
    const dist = getBoxDistribution(allIds);
    const due = getDueCards(allIds);
    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        {backUrl && (
          <a href={backUrl} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
            ← Back
          </a>
        )}

        <div class="border border-[#E5E0D8] rounded-sm p-6 mb-4">
          <h2 style="font-family: var(--font-display);" class="text-2xl text-black mb-1">Flashcards</h2>
          <p class="text-sm text-[#6b6560] mb-4">{topicName}</p>

          {/* Box distribution */}
          <div class="mb-4">
            <div class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-2">Leitner boxes</div>
            <div class="grid grid-cols-6 gap-1 text-center">
              {[
                { label: 'New', count: dist.unseen, color: '#d1cdc7' },
                { label: 'Box 1', count: dist.box1, color: B.bronze },
                { label: 'Box 2', count: dist.box2, color: B.bronze },
                { label: 'Box 3', count: dist.box3, color: B.bronze },
                { label: 'Box 4', count: dist.box4, color: B.bronze },
                { label: 'Box 5', count: dist.box5, color: B.bronze },
              ].map((b) => (
                <div key={b.label} class="bg-[#F4EFE7] rounded-sm p-2">
                  <div style={{ fontFamily: 'var(--font-display)', color: b.count > 0 ? b.color : '#d1cdc7' }} class="text-lg">
                    {b.count}
                  </div>
                  <div class="text-[10px] text-[#6b6560]">{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div class="bg-[#F4EFE7] rounded-sm p-3 mb-4">
            <div class="text-sm text-black">
              <span style={{ fontFamily: 'var(--font-display)' }} class="text-lg">{due.length}</span>
              <span class="text-[#6b6560] ml-1.5">cards due today</span>
            </div>
            <div class="text-xs text-[#6b6560] mt-0.5">{allIds.length} total cards in deck</div>
          </div>

          <button
            onClick={startSession}
            class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] text-white font-medium rounded-sm text-sm uppercase tracking-[0.1em] transition-colors active:scale-[0.99]"
          >
            {due.length > 0 ? `Study ${due.length} cards` : 'Start studying'}
          </button>
        </div>

        {/* How it works */}
        <div class="bg-[#F4EFE7] rounded-sm p-4 text-xs text-[#6b6560] leading-relaxed">
          <div class="font-medium text-black mb-1">How Leitner boxes work</div>
          Cards move between 5 boxes based on your ratings.
          <strong> Hard</strong> sends a card back to Box 1.
          <strong> Good</strong> advances it one box.
          <strong> Easy</strong> jumps two boxes.
          Higher boxes have longer review intervals (1, 2, 4, 7, 14 days).
        </div>
      </div>
    );
  }

  // ─── CAUGHT UP ──────────────────────────────────────────────────────────
  if (mode === 'caught-up') {
    const nextDate = getNextReviewDate(allIds);
    const daysAway = nextDate ? daysUntil(nextDate) : null;
    const dist = getBoxDistribution(allIds);
    const allUnseen = dist.unseen === allIds.length;

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        {backUrl && (
          <a href={backUrl} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
            ← Back
          </a>
        )}

        <div class="border border-[#E5E0D8] rounded-sm p-6 text-center">
          <div style="font-family: var(--font-display);" class="text-3xl text-black mb-2">
            {allUnseen ? 'Ready to start' : 'All caught up'}
          </div>
          {allUnseen ? (
            <p class="text-sm text-[#6b6560] mb-4">
              No cards have been studied yet. Start your first session to begin.
            </p>
          ) : nextDate ? (
            <p class="text-sm text-[#6b6560] mb-4">
              Next review in <span class="font-semibold text-black">{daysAway} day{daysAway !== 1 ? 's' : ''}</span>
              <br />
              <span class="text-xs">{nextDate}</span>
            </p>
          ) : (
            <p class="text-sm text-[#6b6560] mb-4">All cards mastered. Come back later for review.</p>
          )}

          {/* Box distribution */}
          <div class="grid grid-cols-6 gap-1 text-center mb-4">
            {[
              { label: 'New', count: dist.unseen },
              { label: 'B1', count: dist.box1 },
              { label: 'B2', count: dist.box2 },
              { label: 'B3', count: dist.box3 },
              { label: 'B4', count: dist.box4 },
              { label: 'B5', count: dist.box5 },
            ].map((b) => (
              <div key={b.label} class="bg-[#F4EFE7] rounded-sm p-2">
                <div style={{ fontFamily: 'var(--font-display)' }} class="text-lg text-black">{b.count}</div>
                <div class="text-[10px] text-[#6b6560]">{b.label}</div>
              </div>
            ))}
          </div>

          {backUrl && (
            <a
              href={backUrl}
              class="inline-block py-3.5 px-8 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors no-underline"
            >
              Back to exam
            </a>
          )}
        </div>
      </div>
    );
  }

  // ─── SESSION DONE ───────────────────────────────────────────────────────
  if (mode === 'done') {
    const dist = getBoxDistribution(allIds);
    const hardCount = sessionRatings.filter((r) => r.rating === 'hard').length;
    const goodCount = sessionRatings.filter((r) => r.rating === 'good').length;
    const easyCount = sessionRatings.filter((r) => r.rating === 'easy').length;
    const nextDate = getNextReviewDate(allIds);
    const daysAway = nextDate ? daysUntil(nextDate) : null;

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        {backUrl && (
          <a href={backUrl} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
            ← Back
          </a>
        )}

        <div class="border border-[#E5E0D8] rounded-sm p-6 mb-4">
          <div class="text-center mb-5">
            <div style="font-family: var(--font-display);" class="text-3xl text-black mb-1">Session complete</div>
            <div class="text-sm text-[#6b6560]">{sessionRatings.length} cards reviewed</div>
          </div>

          {/* Rating breakdown */}
          <div class="grid grid-cols-3 gap-3 mb-5">
            <div class="bg-black rounded-sm p-3 text-center">
              <div style="font-family: var(--font-display);" class="text-2xl text-white">{hardCount}</div>
              <div class="text-xs text-white/50">Hard</div>
            </div>
            <div class="bg-[#F4EFE7] rounded-sm p-3 text-center">
              <div style="font-family: var(--font-display);" class="text-2xl text-[#8F5A39]">{goodCount}</div>
              <div class="text-xs text-[#6b6560]">Good</div>
            </div>
            <div class="bg-[#F4EFE7] rounded-sm p-3 text-center">
              <div style="font-family: var(--font-display);" class="text-2xl text-black">{easyCount}</div>
              <div class="text-xs text-[#6b6560]">Easy</div>
            </div>
          </div>

          {/* Box distribution */}
          <div class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-2">Box distribution</div>
          <div class="grid grid-cols-6 gap-1 text-center mb-4">
            {[
              { label: 'New', count: dist.unseen },
              { label: 'B1', count: dist.box1 },
              { label: 'B2', count: dist.box2 },
              { label: 'B3', count: dist.box3 },
              { label: 'B4', count: dist.box4 },
              { label: 'B5', count: dist.box5 },
            ].map((b) => (
              <div key={b.label} class="bg-[#F4EFE7] rounded-sm p-2">
                <div style={{ fontFamily: 'var(--font-display)' }} class="text-lg text-black">{b.count}</div>
                <div class="text-[10px] text-[#6b6560]">{b.label}</div>
              </div>
            ))}
          </div>

          {nextDate && (
            <div class="bg-[#F4EFE7] rounded-sm p-3 text-center text-sm text-[#6b6560]">
              Next review in <span class="font-semibold text-black">{daysAway} day{daysAway !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div class="flex gap-3">
          <button
            onClick={startSession}
            class="flex-1 py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors"
          >
            Study again
          </button>
          {backUrl && (
            <a
              href={backUrl}
              class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors no-underline text-center"
            >
              Back to exam
            </a>
          )}
        </div>
      </div>
    );
  }

  // ─── SESSION (card view) ────────────────────────────────────────────────
  if (!currentQ) return null;

  const correctChoice = currentQ.choices.find((c) => c.label === currentQ.correctAnswer);
  const sectionLabel = currentQ.section || currentQ.topic || '';
  const slideClass = flipDirection === 'out' ? 'flashcard-slide-out' : flipDirection === 'in' ? 'flashcard-slide-in' : '';

  return (
    <div class="max-w-lg mx-auto px-4 py-4">
      {/* Top bar */}
      <div class="flex items-center justify-between mb-3">
        <button
          onClick={() => setMode('start')}
          class="text-xs uppercase tracking-[0.1em] text-[#6b6560] hover:text-black transition-colors"
        >
          Quit
        </button>
        <span class="text-xs text-[#6b6560]">{currentIndex + 1} / {dueIds.length}</span>
      </div>

      {/* Progress bar */}
      <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
        <div
          class="bg-[#8F5A39] h-0.5 transition-all duration-300"
          style={{ width: `${Math.round(((currentIndex + (rated ? 1 : 0)) / dueIds.length) * 100)}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        class={`flashcard-container mb-4 ${slideClass}`}
        style={{ minHeight: '300px' }}
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div class={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
          {/* FRONT */}
          <div class="flashcard-front border border-[#E5E0D8] rounded-sm p-6 bg-white">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs px-2 py-0.5 rounded-sm font-medium border border-[#E5E0D8] text-[#6b6560] bg-[#F4EFE7]">
                {sectionLabel.replace(/-/g, ' ')}
              </span>
              <span class={`text-xs px-2 py-0.5 rounded-sm font-medium border ${
                currentQ.difficulty === 'hard'   ? 'border-black text-black bg-black/5' :
                currentQ.difficulty === 'medium' ? 'border-[#8F5A39] text-[#8F5A39] bg-[#F4EFE7]' :
                                                   'border-[#E5E0D8] text-[#6b6560] bg-[#F4EFE7]'
              }`}>{currentQ.difficulty}</span>
            </div>
            <p style="font-family: var(--font-display);" class="text-lg text-black leading-relaxed">
              {currentQ.stem}
            </p>
            <div class="mt-6 text-center">
              <span class="text-xs text-[#6b6560]/60 uppercase tracking-[0.1em]">Tap to flip</span>
            </div>
          </div>

          {/* BACK */}
          <div class="flashcard-back border border-[#8F5A39] rounded-sm p-6 bg-white">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs px-2 py-0.5 rounded-sm font-medium bg-[#8F5A39] text-white">
                {currentQ.correctAnswer}
              </span>
              <BoxIndicator box={currentBox} />
            </div>

            {/* Correct answer highlighted */}
            <div class="bg-[#F4EFE7] border border-[#8F5A39] rounded-sm p-4 mb-3">
              <div class="flex items-start gap-3">
                <span class="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 bg-[#8F5A39] text-white">
                  {currentQ.correctAnswer}
                </span>
                <p class="text-sm text-black leading-relaxed flex-1">{correctChoice?.text}</p>
              </div>
            </div>

            {/* Explanation */}
            <p class="text-sm text-black leading-relaxed mb-2">{currentQ.explanation}</p>

            {currentQ.regulatoryBasis && (
              <p class="text-xs text-[#8F5A39] font-medium mb-3">{currentQ.regulatoryBasis}</p>
            )}

            {/* All choices summary */}
            <div class="border-t border-[#E5E0D8] pt-3 mt-3">
              <div class="space-y-1.5">
                {currentQ.choices.map((c) => (
                  <div key={c.label} class="flex items-start gap-2 text-xs">
                    <span class={`font-semibold shrink-0 ${c.label === currentQ.correctAnswer ? 'text-[#8F5A39]' : 'text-[#6b6560]'}`}>
                      {c.label}.
                    </span>
                    <span class={c.label === currentQ.correctAnswer ? 'text-black' : 'text-[#6b6560]'}>
                      {c.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons — shown only when card is flipped and not yet rated */}
      {flipped && !rated && (
        <div class="flex gap-3 mb-3" style="animation: fadeIn 0.3s ease-in">
          <button
            onClick={(e) => { e.stopPropagation(); handleRate('hard'); }}
            class="flex-1 py-3.5 bg-black hover:bg-[#1a1a1a] text-white text-sm font-medium rounded-sm transition-colors active:scale-[0.99]"
          >
            Hard
            <span class="block text-[10px] text-white/50 mt-0.5">Box 1</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRate('good'); }}
            class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors active:scale-[0.99]"
          >
            Good
            <span class="block text-[10px] text-white/70 mt-0.5">+1 box</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRate('easy'); }}
            class="flex-1 py-3.5 border border-[#8F5A39] text-[#8F5A39] hover:bg-[#F4EFE7] text-sm font-medium rounded-sm transition-colors active:scale-[0.99]"
          >
            Easy
            <span class="block text-[10px] text-[#6b6560] mt-0.5">+2 boxes</span>
          </button>
        </div>
      )}

      {/* Next button — shown after rating */}
      {rated && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors active:scale-[0.99]"
          style="animation: fadeIn 0.2s ease-in"
        >
          {currentIndex + 1 >= dueIds.length ? 'Finish session' : 'Next card'}
        </button>
      )}

      {/* Keyboard hints */}
      <p class="text-center text-xs text-[#6b6560]/50 mt-3 hidden sm:block">
        Space to flip · 1/H hard · 2/G good · 3/E easy · Enter for next
      </p>
    </div>
  );
}
