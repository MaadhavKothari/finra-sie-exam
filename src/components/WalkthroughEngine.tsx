import { useState, useEffect, useCallback } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress, $streak, $xp } from '../stores/progress';
import { titleForXp } from '../lib/titles';
import { generateShareString, copyToClipboard } from '../lib/shareString';

// Brand tokens
const B = {
  bronze:     '#8F5A39',
  travertine: '#F4EFE7',
  border:     '#E5E0D8',
  muted:      '#6b6560',
};

interface Choice {
  label: string;
  text: string;
  explanation: string;
}

interface WalkthroughQuestion {
  id: string;
  year: string;
  chapterTitle: string;
  narrative: string;
  stem: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: string;
  regulatoryLesson: string;
  whatActuallyHappened: string;
}

interface WalkthroughData {
  id: string;
  title: string;
  subtitle: string;
  questions: WalkthroughQuestion[];
}

interface Props {
  walkthrough: WalkthroughData;
  base: string;
}

export default function WalkthroughEngine({ walkthrough, base }: Props) {
  const [mode, setMode] = useState<'intro' | 'chapter' | 'complete'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [shareToast, setShareToast] = useState(false);

  const streak = useStore($streak);
  const xp = useStore($xp);

  const questions = walkthrough.questions;
  const currentQ = questions[currentIndex];
  const totalChapters = questions.length;

  // Load saved progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sie-walkthroughs');
      if (raw) {
        const data = JSON.parse(raw);
        if (data[walkthrough.id]?.completed) {
          // Already completed — show intro to let them replay or see results
        }
      }
    } catch { /* ignore */ }
  }, []);

  const startWalkthrough = () => {
    setMode('chapter');
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setResults([]);
  };

  const handleSelect = (label: string) => {
    if (revealed) return;
    setSelected(label);
  };

  const handleSubmit = () => {
    if (!selected || !currentQ) return;
    const isCorrect = selected === currentQ.correctAnswer;
    setRevealed(true);
    setResults((prev) => [...prev, isCorrect]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalChapters) {
      // Save completion
      const score = results.filter(Boolean).length;
      try {
        const raw = localStorage.getItem('sie-walkthroughs');
        const data = raw ? JSON.parse(raw) : {};
        data[walkthrough.id] = {
          completed: true,
          score,
          date: new Date().toISOString().split('T')[0],
        };
        localStorage.setItem('sie-walkthroughs', JSON.stringify(data));
      } catch { /* ignore */ }

      // Check for secret title: 8/8 on walkthrough
      if (score === totalChapters) {
        try {
          const earnedRaw = $progress.get().earnedTitles || '[]';
          const earned: string[] = JSON.parse(earnedRaw);
          if (!earned.includes('fraud-examiner')) {
            earned.push('fraud-examiner');
            $progress.setKey('earnedTitles', JSON.stringify(earned));
          }
        } catch { /* ignore */ }
      }

      setMode('complete');
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== 'chapter' || !currentQ) return;
      if (!revealed) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const labels = ['A', 'B', 'C', 'D'];
          handleSelect(labels[parseInt(e.key) - 1]);
        }
        if (e.key === 'Enter' && selected) handleSubmit();
      } else {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'n') handleNext();
      }
    },
    [mode, revealed, selected, currentIndex, currentQ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ─── INTRO ──────────────────────────────────────────────────────────────
  if (mode === 'intro') {
    // Check if previously completed
    let prevResult: { score: number; date: string } | null = null;
    try {
      const raw = localStorage.getItem('sie-walkthroughs');
      if (raw) {
        const data = JSON.parse(raw);
        if (data[walkthrough.id]?.completed) {
          prevResult = data[walkthrough.id];
        }
      }
    } catch { /* ignore */ }

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <a
          href={base}
          class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium"
        >
          &larr; Home
        </a>

        {/* Dark header card */}
        <div class="bg-black text-white rounded-sm p-6 mb-4">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-medium">
            Scandal walkthrough
          </p>
          <h1
            style="font-family: var(--font-display);"
            class="text-3xl leading-tight mb-2"
          >
            {walkthrough.title}
          </h1>
          <p class="text-sm text-white/60 leading-relaxed">
            {walkthrough.subtitle}
          </p>
          <div class="flex items-center gap-4 mt-4 text-xs text-white/40">
            <span>{totalChapters} chapters</span>
            <span>|</span>
            <span>~15 minutes</span>
          </div>
        </div>

        {/* Chapter list */}
        <div class="border border-[#E5E0D8] rounded-sm overflow-hidden mb-4">
          {questions.map((q, i) => (
            <div
              key={q.id}
              class="flex items-center gap-3 px-4 py-3 border-b border-[#E5E0D8] last:border-b-0"
            >
              <span
                class="text-xs font-mono text-[#6b6560] w-12 shrink-0"
              >
                {q.year}
              </span>
              <span class="text-sm text-black">{q.chapterTitle}</span>
            </div>
          ))}
        </div>

        {prevResult && (
          <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs text-[#8F5A39] font-medium uppercase tracking-wider">
                  Completed
                </span>
                <span class="text-xs text-[#6b6560] ml-2">
                  {prevResult.score}/{totalChapters} correct
                </span>
              </div>
              <span class="text-xs text-[#6b6560]">{prevResult.date}</span>
            </div>
          </div>
        )}

        <button
          onClick={startWalkthrough}
          class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white font-medium rounded-sm text-sm uppercase tracking-[0.1em] transition-colors active:scale-[0.99]"
        >
          {prevResult ? 'Replay investigation' : 'Begin investigation'} &rarr;
        </button>
      </div>
    );
  }

  // ─── COMPLETE ───────────────────────────────────────────────────────────
  if (mode === 'complete') {
    const score = results.filter(Boolean).length;
    const pct = Math.round((score / totalChapters) * 100);
    const perfect = score === totalChapters;

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <div class="bg-black text-white rounded-sm p-6 mb-4">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-medium">
            Investigation complete
          </p>
          <h2
            style="font-family: var(--font-display);"
            class="text-3xl leading-tight mb-2"
          >
            {walkthrough.title}
          </h2>

          {/* Score */}
          <div class="flex items-center gap-6 mt-6">
            <div class="relative w-20 h-20 shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="7" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={perfect ? B.bronze : '#ffffff'}
                  stroke-width="7"
                  stroke-linecap="butt"
                  stroke-dasharray={`${pct * 2.64} 264`}
                  class="transition-all duration-1000"
                />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-lg font-semibold text-white">{score}/{totalChapters}</span>
              </div>
            </div>
            <div>
              <div class="text-sm text-white/60">
                You answered {score} of {totalChapters} questions correctly.
              </div>
              {perfect && (
                <div class="text-sm text-[#8F5A39] font-medium mt-2">
                  Perfect score — Fraud Examiner title earned
                </div>
              )}
            </div>
          </div>

          {/* Result dots */}
          <div class="flex gap-1.5 mt-5">
            {results.map((correct, i) => (
              <div
                key={i}
                class={`w-3 h-3 rounded-full ${correct ? 'bg-[#8F5A39]' : 'bg-white/20'}`}
                title={`Chapter ${i + 1}: ${correct ? 'Correct' : 'Incorrect'}`}
              />
            ))}
          </div>
        </div>

        {/* Share */}
        <button
          onClick={async () => {
            const shareResults = results.map((r) => ({ correct: r }));
            const text = generateShareString(shareResults, {
              mode: 'drill',
              title: `${walkthrough.title} (Scandal Walkthrough)`,
              streak,
              xp,
            });
            await copyToClipboard(text);
            setShareToast(true);
            setTimeout(() => setShareToast(false), 2000);
          }}
          class="w-full py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors mb-3"
        >
          Share results
        </button>

        {shareToast && (
          <div
            class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-black text-white text-sm rounded-sm shadow-lg"
            style="animation: fadeIn 0.2s ease-in"
          >
            Copied to clipboard
          </div>
        )}

        <div class="flex gap-3">
          <button
            onClick={startWalkthrough}
            class="flex-1 py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors"
          >
            Replay
          </button>
          <a
            href={base}
            class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors text-center no-underline"
          >
            Home &rarr;
          </a>
        </div>
      </div>
    );
  }

  // ─── CHAPTER ────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  const progressPct = Math.round(((currentIndex + (revealed ? 1 : 0)) / totalChapters) * 100);

  return (
    <div class="max-w-lg mx-auto px-4 py-4">
      {/* Top bar */}
      <div class="flex items-center justify-between mb-3">
        <button
          onClick={() => setMode('intro')}
          class="text-xs uppercase tracking-[0.1em] text-[#6b6560] hover:text-black transition-colors"
        >
          Quit
        </button>
        <span class="text-xs text-[#6b6560]">
          Chapter {currentIndex + 1} of {totalChapters}
        </span>
      </div>

      {/* Progress bar */}
      <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
        <div
          class="bg-black h-0.5 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Year + Chapter header */}
      <div class="bg-black text-white rounded-sm p-5 mb-4">
        <div class="flex items-baseline gap-3">
          <span class="text-xs font-mono text-white/40">{currentQ.year}</span>
          <div class="w-px h-4 bg-white/20" />
          <h2
            style="font-family: var(--font-display);"
            class="text-xl leading-tight"
          >
            {currentQ.chapterTitle}
          </h2>
        </div>
      </div>

      {/* Narrative */}
      <div class="mb-4">
        {currentQ.narrative.split('\n\n').map((para, i) => (
          <p
            key={i}
            style="font-family: var(--font-display);"
            class="text-[15px] text-black leading-relaxed mb-3 last:mb-0"
          >
            {para}
          </p>
        ))}
      </div>

      {/* Question card */}
      <div class="border border-[#E5E0D8] rounded-sm p-5 mb-3 bg-white">
        <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold mb-2">
          Investigation question
        </p>
        <p class="text-black leading-relaxed text-[15px]">{currentQ.stem}</p>
      </div>

      {/* Answer choices */}
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
              labelClass = 'bg-[#F4EFE7] text-[#6b6560]';
            }
          } else if (isSelected) {
            containerClass = 'border-black bg-white shadow-sm';
            labelClass = 'bg-black text-white';
          }

          return (
            <button
              key={c.label}
              onClick={() => handleSelect(c.label)}
              disabled={revealed}
              class={`w-full p-4 rounded-sm border text-left transition-all active:scale-[0.99] ${containerClass}`}
            >
              <div class="flex items-start gap-3">
                <span
                  class={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${labelClass}`}
                >
                  {c.label}
                </span>
                <span class="text-black text-sm leading-relaxed flex-1">{c.text}</span>
              </div>
              {revealed && (
                <p
                  class={`text-xs mt-2.5 ml-10 leading-relaxed ${isCorrectChoice ? 'text-[#8F5A39]' : 'text-[#6b6560]'}`}
                >
                  {c.explanation}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Post-answer reveal panels */}
      {revealed && (
        <div class="space-y-3 mb-3" style="animation: fadeIn 0.3s ease-in">
          {/* Regulatory lesson */}
          <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4">
            <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold mb-2">
              The regulatory lesson
            </p>
            <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
            <p class="text-xs text-[#8F5A39] mt-2 font-medium">{currentQ.regulatoryLesson}</p>
          </div>

          {/* What actually happened */}
          <div class="bg-black text-white rounded-sm p-4">
            <p class="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold mb-2">
              What actually happened
            </p>
            <p class="text-sm text-white/80 leading-relaxed">
              {currentQ.whatActuallyHappened}
            </p>
          </div>
        </div>
      )}

      {/* Action button */}
      {!revealed ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] disabled:bg-[#E5E0D8] disabled:text-[#6b6560] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors active:scale-[0.99]"
        >
          Check answer
        </button>
      ) : (
        <button
          onClick={handleNext}
          class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors active:scale-[0.99]"
        >
          {currentIndex + 1 >= totalChapters ? 'See results' : 'Continue'} &rarr;
        </button>
      )}

      {/* Keyboard hints */}
      <p class="text-center text-xs text-[#6b6560]/50 mt-3 hidden sm:block">
        1-4 to select &middot; Enter to submit &middot; N for next
      </p>
    </div>
  );
}
