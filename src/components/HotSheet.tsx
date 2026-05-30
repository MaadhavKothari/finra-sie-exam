import { useState, useMemo } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  $hotSheetCards, $dueCards, $ringCounts, $totalCards,
  recordReviewCorrect, recordReviewWrong,
} from '../stores/hotSheet';
import { daysUntilReview, type HotSheetCard, type Ring } from '../lib/srs';
import type { Question } from '../lib/types';
import { hapticHeavy } from '../lib/haptics';
import { soundStamp } from '../lib/sounds';

interface Props {
  base: string;
  questions: Question[];
}

// Brand tokens
const B = {
  bronze:     '#8F5A39',
  travertine: '#F4EFE7',
  border:     '#E5E0D8',
  muted:      '#6b6560',
};

const RING_COLORS: Record<Ring, { stroke: string; label: string; bg: string }> = {
  new:      { stroke: '#b87333', label: 'New',      bg: 'bg-[#b87333]/10' },
  review:   { stroke: '#c9a227', label: 'Review',   bg: 'bg-[#c9a227]/10' },
  mastered: { stroke: '#2d8a4e', label: 'Mastered',  bg: 'bg-[#2d8a4e]/10' },
};

function ActivityRing({ ring, count, total }: { ring: Ring; count: number; total: number }) {
  const { stroke, label } = RING_COLORS[ring];
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  const radius = ring === 'mastered' ? 38 : ring === 'review' ? 30 : 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <g>
      <circle cx="50" cy="50" r={radius} fill="none" stroke={B.border} stroke-width="5" opacity="0.4" />
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={stroke}
        stroke-width="5"
        stroke-linecap="round"
        stroke-dasharray={circumference}
        stroke-dashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </g>
  );
}

type Mode = 'dashboard' | 'drill';

export default function HotSheet({ base, questions }: Props) {
  const cards = useStore($hotSheetCards);
  const due = useStore($dueCards);
  const rings = useStore($ringCounts);
  const total = useStore($totalCards);

  const [mode, setMode] = useState<Mode>('dashboard');

  // Drill state
  const [drillIdx, setDrillIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [drillResults, setDrillResults] = useState<{ qId: string; correct: boolean }[]>([]);
  const [stamp, setStamp] = useState(false);

  // Resolve due cards to full questions
  const drillQuestions = useMemo(() => {
    const qMap = new Map(questions.map((q) => [q.id, q]));
    return due.filter((c) => qMap.has(c.questionId)).map((c) => ({
      card: c,
      question: qMap.get(c.questionId)!,
    }));
  }, [due, questions]);

  const startDrill = () => {
    if (drillQuestions.length === 0) return;
    setMode('drill');
    setDrillIdx(0);
    setSelected(null);
    setRevealed(false);
    setDrillResults([]);
  };

  const handleSubmit = () => {
    if (!selected) return;
    const item = drillQuestions[drillIdx];
    if (!item) return;
    const correct = selected === item.question.correctAnswer;
    setRevealed(true);

    if (correct) {
      // A mastery transition is when consecutiveCorrect was 2 and now would be 3.
      const becameMastered = item.card.consecutiveCorrect === 2 && item.card.ring !== 'mastered';
      recordReviewCorrect(item.card.questionId);
      if (becameMastered) {
        setStamp(true);
        hapticHeavy();
        soundStamp();
        setTimeout(() => setStamp(false), 1600);
      }
    } else {
      recordReviewWrong(item.card.questionId);
    }

    setDrillResults((prev) => [...prev, { qId: item.card.questionId, correct }]);
  };

  const handleNext = () => {
    if (drillIdx + 1 >= drillQuestions.length) {
      setMode('dashboard');
      return;
    }
    setDrillIdx((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  // ─── DRILL MODE ─────────────────────────────────────────────────────────
  if (mode === 'drill' && drillQuestions[drillIdx]) {
    const { question: currentQ, card } = drillQuestions[drillIdx];
    const progress = Math.round(((drillIdx + (revealed ? 1 : 0)) / drillQuestions.length) * 100);

    return (
      <div class="max-w-lg mx-auto px-4 py-4 relative">
        {stamp && (
          <div class="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
            <div
              class="border-[5px] border-[#a13a26] text-[#a13a26] px-6 py-3 rounded-sm bg-white/95"
              style="font-family: var(--font-display); transform: rotate(-14deg); animation: stampDown 0.45s ease-out both; letter-spacing: 0.15em;"
            >
              <p class="text-[10px] uppercase tracking-[0.3em] mb-0.5 text-center">— Closed —</p>
              <p class="text-2xl font-bold uppercase">Paid in Full</p>
            </div>
          </div>
        )}
        <div class="flex items-center justify-between mb-3">
          <button onClick={() => setMode('dashboard')} class="text-xs uppercase tracking-[0.1em] text-[#6b6560] hover:text-black transition-colors">
            Quit
          </button>
          <span class="text-xs text-[#6b6560]">{drillIdx + 1} / {drillQuestions.length}</span>
        </div>

        <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
          <div class="bg-[#8F5A39] h-0.5 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div class="bg-white border border-[#E5E0D8] rounded-sm p-5 mb-3">
          <div class="flex items-center gap-2 mb-3">
            <span class={`text-xs px-2 py-0.5 rounded-sm font-medium border ${
              currentQ.difficulty === 'hard'   ? 'border-black text-black bg-black/5' :
              currentQ.difficulty === 'medium' ? 'border-[#8F5A39] text-[#8F5A39] bg-[#F4EFE7]' :
                                                 'border-[#E5E0D8] text-[#6b6560] bg-[#F4EFE7]'
            }`}>{currentQ.difficulty}</span>
            <span class="text-xs text-[#6b6560]">{card.section.replace(/-/g, ' ')}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-sm font-medium" style={{ color: RING_COLORS[card.ring].stroke, background: RING_COLORS[card.ring].stroke + '18' }}>
              {RING_COLORS[card.ring].label}
            </span>
          </div>
          <p class="text-black leading-relaxed text-[15px]">{currentQ.stem}</p>
        </div>

        <div class="space-y-2 mb-3">
          {currentQ.choices.map((c) => {
            const isSelected = selected === c.label;
            const isCorrectChoice = c.label === currentQ.correctAnswer;
            let containerClass = 'border-[#E5E0D8] bg-white hover:border-[#8F5A39] hover:bg-[#F4EFE7]';
            let labelClass = 'bg-[#F4EFE7] text-[#6b6560]';
            if (revealed) {
              if (isCorrectChoice) {
                containerClass = 'border-[#8F5A39] bg-[#F4EFE7]';
                labelClass = 'bg-[#8F5A39] text-white';
              } else if (isSelected) {
                containerClass = 'border-black bg-black/5';
                labelClass = 'bg-black text-white';
              } else {
                containerClass = 'border-[#E5E0D8] bg-white opacity-50';
              }
            } else if (isSelected) {
              containerClass = 'border-black bg-white shadow-sm';
              labelClass = 'bg-black text-white';
            }
            return (
              <button
                key={c.label}
                onClick={() => !revealed && setSelected(c.label)}
                disabled={revealed}
                class={`w-full p-4 rounded-sm border text-left transition-all active:scale-[0.99] ${containerClass}`}
              >
                <div class="flex items-start gap-3">
                  <span class={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${labelClass}`}>{c.label}</span>
                  <span class="text-black text-sm leading-relaxed flex-1">{c.text}</span>
                </div>
                {revealed && (
                  <p class={`text-xs mt-2.5 ml-10 leading-relaxed ${isCorrectChoice ? 'text-[#8F5A39]' : 'text-[#6b6560]'}`}>
                    {c.explanation}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-3" style="animation: fadeIn 0.3s ease-in">
            <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {!revealed ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] disabled:bg-[#E5E0D8] disabled:text-[#6b6560] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors"
          >
            Check answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors"
          >
            {drillIdx + 1 >= drillQuestions.length ? 'Back to Hot Sheet' : 'Next →'}
          </button>
        )}
      </div>
    );
  }

  // ─── DASHBOARD ──────────────────────────────────────────────────────────
  const groupedNew = cards.filter((c) => c.ring === 'new');
  const groupedReview = cards.filter((c) => c.ring === 'review');
  const groupedMastered = cards.filter((c) => c.ring === 'mastered');

  return (
    <div class="max-w-lg mx-auto px-4 py-6">
      <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
        ← Home
      </a>

      <div class="text-center mb-6">
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">The Hot Sheet</p>
        <h1 style="font-family: var(--font-display);" class="text-3xl text-black mb-1">Close the rings.</h1>
        <p class="text-sm text-[#6b6560]">{total} cards tracked · {due.length} due today</p>
      </div>

      {/* Three-ring dashboard */}
      <div class="flex justify-center mb-6">
        <div class="relative" style={{ width: '140px', height: '140px' }}>
          <svg viewBox="0 0 100 100" class="w-full h-full">
            <ActivityRing ring="mastered" count={groupedMastered.length} total={Math.max(total, 1)} />
            <ActivityRing ring="review" count={groupedReview.length} total={Math.max(total, 1)} />
            <ActivityRing ring="new" count={groupedNew.length} total={Math.max(total, 1)} />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div style="font-family: var(--font-display);" class="text-2xl text-black">{due.length}</div>
              <div class="text-[10px] text-[#6b6560] uppercase tracking-wider">due</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ring legend */}
      <div class="flex justify-center gap-4 mb-6">
        {(['new', 'review', 'mastered'] as Ring[]).map((r) => (
          <div key={r} class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full" style={{ background: RING_COLORS[r].stroke }} />
            <span class="text-[11px] text-[#6b6560]">{RING_COLORS[r].label} ({rings[r]})</span>
          </div>
        ))}
      </div>

      {/* Start drill CTA */}
      {due.length > 0 && (
        <button
          onClick={startDrill}
          class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors mb-6"
        >
          Review {Math.min(due.length, 15)} due cards →
        </button>
      )}

      {total === 0 && (
        <div class="border border-[#E5E0D8] rounded-sm p-5 text-center">
          <p class="text-sm text-[#6b6560] leading-relaxed">
            No cards yet. Questions you get wrong in drills will appear here for spaced review.
          </p>
        </div>
      )}

      {/* Card list by ring */}
      {(['new', 'review', 'mastered'] as Ring[]).map((ring) => {
        const group = ring === 'new' ? groupedNew : ring === 'review' ? groupedReview : groupedMastered;
        if (group.length === 0) return null;
        return (
          <div key={ring} class="mb-5">
            <h3 class="text-xs uppercase tracking-[0.12em] font-medium mb-2" style={{ color: RING_COLORS[ring].stroke }}>
              {RING_COLORS[ring].label} ({group.length})
            </h3>
            <div class="border border-[#E5E0D8] rounded-sm overflow-hidden">
              {group.map((card, i) => {
                const days = daysUntilReview(card);
                const dueText = days <= 0 ? 'Due now' : days === 1 ? 'Due tomorrow' : `Due in ${days}d`;
                return (
                  <div
                    key={card.questionId}
                    class={`px-4 py-3 bg-white ${i < group.length - 1 ? 'border-b border-[#E5E0D8]' : ''}`}
                  >
                    <p class="text-sm text-black leading-snug mb-1">{card.stem}</p>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-[#6b6560] uppercase tracking-wider">{card.section.replace(/-/g, ' ')}</span>
                      <span class="text-[10px]" style={{ color: days <= 0 ? RING_COLORS[ring].stroke : B.muted }}>{dueText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
