import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress, $streak, $xp } from '../stores/progress';
import { titleForXp } from '../lib/titles';
import { generateShareString, copyToClipboard } from '../lib/shareString';

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

// ── Evidence card accumulated across chapters ──────────────────────────
interface EvidenceItem {
  chapter: number;
  year: string;
  lesson: string;
  correct: boolean;
}

// ── Confidence levels ──────────────────────────────────────────────────
const CONFIDENCE_LEVELS = [
  { label: 'Unsure', emoji: '?', multiplier: 0.5, color: '#999' },
  { label: 'Likely', emoji: '~', multiplier: 1.0, color: B.bronze },
  { label: 'Certain', emoji: '!', multiplier: 2.0, color: '#22c55e' },
] as const;

export default function WalkthroughEngine({ walkthrough, base }: Props) {
  const [mode, setMode] = useState<'intro' | 'chapter' | 'complete'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [shareToast, setShareToast] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [confidence, setConfidence] = useState(1); // index into CONFIDENCE_LEVELS
  const [narrativeRevealed, setNarrativeRevealed] = useState(0); // paragraphs revealed
  const [transitioning, setTransitioning] = useState(false);
  const [showEvBoard, setShowEvBoard] = useState(false);
  const [startTime] = useState(Date.now());
  const chapterRef = useRef<HTMLDivElement>(null);

  const streak = useStore($streak);
  const xp = useStore($xp);

  const questions = walkthrough.questions;
  const currentQ = questions[currentIndex];
  const totalChapters = questions.length;

  // Progressive narrative reveal
  useEffect(() => {
    if (mode !== 'chapter' || !currentQ) return;
    setNarrativeRevealed(0);
    const paragraphs = currentQ.narrative.split('\n\n');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setNarrativeRevealed(i);
      if (i >= paragraphs.length) clearInterval(timer);
    }, 600);
    return () => clearInterval(timer);
  }, [currentIndex, mode]);

  // Load saved progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sie-walkthroughs');
      if (raw) {
        const data = JSON.parse(raw);
        if (data[walkthrough.id]?.completed) {
          // show intro to let them replay
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
    setEvidence([]);
    setConfidence(1);
    setTransitioning(false);
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

    // Add evidence
    setEvidence((prev) => [
      ...prev,
      {
        chapter: currentIndex + 1,
        year: currentQ.year,
        lesson: currentQ.regulatoryLesson,
        correct: isCorrect,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalChapters) {
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

    // Animated transition
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      setConfidence(1);
      setTransitioning(false);
      chapterRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  // Jump to a completed chapter from the timeline
  const jumpToChapter = (idx: number) => {
    if (idx > results.length) return; // can't jump ahead of progress
    if (idx === currentIndex) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setSelected(null);
      setRevealed(idx < results.length); // already answered chapters show revealed
      setConfidence(1);
      setTransitioning(false);
    }, 200);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== 'chapter' || !currentQ) return;
      if (!revealed) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          handleSelect(['A', 'B', 'C', 'D'][parseInt(e.key) - 1]);
        }
        if (e.key === 'Enter' && selected) handleSubmit();
      } else {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'n') handleNext();
      }
      if (e.key === 'e') setShowEvBoard((s) => !s);
    },
    [mode, revealed, selected, currentIndex, currentQ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const elapsed = Math.round((Date.now() - startTime) / 60000);

  // ─── INTRO ──────────────────────────────────────────────────────────────
  if (mode === 'intro') {
    let prevResult: { score: number; date: string } | null = null;
    try {
      const raw = localStorage.getItem('sie-walkthroughs');
      if (raw) {
        const data = JSON.parse(raw);
        if (data[walkthrough.id]?.completed) prevResult = data[walkthrough.id];
      }
    } catch { /* ignore */ }

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
          &larr; Home
        </a>

        {/* Dark hero */}
        <div class="bg-black text-white rounded-sm p-6 mb-4">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-medium">
            Financial crime investigation
          </p>
          <h1 style="font-family: var(--font-display);" class="text-3xl leading-tight mb-2">
            {walkthrough.title}
          </h1>
          <p class="text-sm text-white/60 leading-relaxed">{walkthrough.subtitle}</p>
          <div class="flex items-center gap-4 mt-4 text-xs text-white/40">
            <span>{totalChapters} chapters</span>
            <span>|</span>
            <span>~15 min</span>
            <span>|</span>
            <span>Interactive investigation</span>
          </div>
        </div>

        {/* Interactive timeline preview */}
        <div class="border border-[#E5E0D8] rounded-sm overflow-hidden mb-4">
          <div class="px-4 py-2.5 bg-[#F4EFE7] border-b border-[#E5E0D8]">
            <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold">Case timeline</p>
          </div>
          {questions.map((q, i) => (
            <div
              key={q.id}
              class="flex items-center gap-3 px-4 py-3 border-b border-[#E5E0D8] last:border-b-0"
            >
              <div class="relative flex flex-col items-center">
                <div class={`w-3 h-3 rounded-full border-2 ${prevResult ? 'bg-[#8F5A39] border-[#8F5A39]' : 'border-[#E5E0D8]'}`} />
                {i < questions.length - 1 && (
                  <div class="w-px h-3 bg-[#E5E0D8] mt-0.5" />
                )}
              </div>
              <span class="text-xs font-mono text-[#6b6560] w-14 shrink-0">{q.year}</span>
              <span class="text-sm text-black flex-1">{q.chapterTitle}</span>
              <span class="text-[10px] text-[#6b6560]">Ch {i + 1}</span>
            </div>
          ))}
        </div>

        {prevResult && (
          <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs text-[#8F5A39] font-medium uppercase tracking-wider">Completed</span>
                <span class="text-xs text-[#6b6560] ml-2">{prevResult.score}/{totalChapters} correct</span>
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
    const minutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <div class="bg-black text-white rounded-sm p-6 mb-4">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 font-medium">
            Case closed
          </p>
          <h2 style="font-family: var(--font-display);" class="text-3xl leading-tight mb-2">
            {walkthrough.title}
          </h2>

          {/* Score ring */}
          <div class="flex items-center gap-6 mt-6">
            <div class="relative w-24 h-24 shrink-0">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={perfect ? '#22c55e' : B.bronze}
                  stroke-width="6" stroke-linecap="round"
                  stroke-dasharray={`${pct * 2.64} 264`}
                  style="transition: stroke-dasharray 1.5s ease-out"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold text-white">{score}</span>
                <span class="text-[10px] text-white/40">of {totalChapters}</span>
              </div>
            </div>
            <div>
              <div class="text-sm text-white/70 leading-relaxed">
                {perfect ? 'Flawless investigation.' : score >= totalChapters * 0.7 ? 'Strong investigative work.' : 'The evidence trail continues.'}
              </div>
              <div class="text-xs text-white/40 mt-1">{minutes} min elapsed</div>
              {perfect && (
                <div class="text-sm font-medium mt-2" style={{ color: B.bronze }}>
                  Fraud Examiner title earned
                </div>
              )}
            </div>
          </div>

          {/* Result dots */}
          <div class="flex gap-1.5 mt-5">
            {results.map((correct, i) => (
              <div
                key={i}
                class="flex flex-col items-center gap-1"
              >
                <div
                  class={`w-3.5 h-3.5 rounded-full transition-all ${correct ? 'bg-[#22c55e]' : 'bg-red-500/60'}`}
                  title={`Ch ${i + 1}: ${correct ? 'Correct' : 'Incorrect'}`}
                />
                <span class="text-[8px] text-white/30">{questions[i].year}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence board summary */}
        <div class="border border-[#E5E0D8] rounded-sm mb-4">
          <div class="px-4 py-2.5 bg-[#F4EFE7] border-b border-[#E5E0D8]">
            <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold">
              Evidence collected — {evidence.length} items
            </p>
          </div>
          <div class="divide-y divide-[#E5E0D8]">
            {evidence.map((ev, i) => (
              <div key={i} class="px-4 py-3 flex items-start gap-3">
                <div class={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.correct ? 'bg-[#22c55e]' : 'bg-red-400'}`} />
                <div>
                  <span class="text-[10px] font-mono text-[#6b6560]">Ch {ev.chapter} ({ev.year})</span>
                  <p class="text-xs text-black leading-relaxed mt-0.5">{ev.lesson}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={async () => {
            const shareResults = results.map((r) => ({ correct: r }));
            const text = generateShareString(shareResults, {
              mode: 'drill',
              title: `${walkthrough.title} (Investigation)`,
              streak, xp,
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
          <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-black text-white text-sm rounded-sm shadow-lg" style="animation: fadeIn 0.2s ease-in">
            Copied to clipboard
          </div>
        )}

        <div class="flex gap-3">
          <button onClick={startWalkthrough} class="flex-1 py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors">
            Replay
          </button>
          <a href={base} class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors text-center no-underline">
            Home &rarr;
          </a>
        </div>
      </div>
    );
  }

  // ─── CHAPTER ────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  const progressPct = Math.round(((currentIndex + (revealed ? 1 : 0)) / totalChapters) * 100);
  const narrativeParagraphs = currentQ.narrative.split('\n\n');
  const conf = CONFIDENCE_LEVELS[confidence];

  return (
    <div
      ref={chapterRef}
      class={`max-w-lg mx-auto px-4 py-4 transition-all duration-300 ${transitioning ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
    >
      {/* ── Interactive Timeline ── */}
      <div class="flex items-center gap-1 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {questions.map((q, i) => {
          const isComplete = i < results.length;
          const isCurrent = i === currentIndex;
          const isCorrect = results[i];
          const canJump = i <= results.length;

          return (
            <button
              key={q.id}
              onClick={() => canJump && jumpToChapter(i)}
              disabled={!canJump}
              class={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-sm transition-all shrink-0 ${
                canJump ? 'cursor-pointer hover:bg-[#F4EFE7]' : 'cursor-not-allowed opacity-30'
              } ${isCurrent ? 'bg-[#F4EFE7]' : ''}`}
              title={`${q.year} — ${q.chapterTitle}`}
            >
              <div class={`w-3 h-3 rounded-full transition-all ${
                isCurrent
                  ? 'bg-black ring-2 ring-[#8F5A39] ring-offset-1'
                  : isComplete
                    ? isCorrect ? 'bg-[#22c55e]' : 'bg-red-400'
                    : 'bg-[#E5E0D8]'
              }`} />
              <span class={`text-[9px] font-mono ${isCurrent ? 'text-black font-semibold' : 'text-[#6b6560]'}`}>
                {q.year}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Stats bar ── */}
      <div class="flex items-center justify-between text-[10px] text-[#6b6560] mb-3 px-1">
        <span>Ch {currentIndex + 1}/{totalChapters}</span>
        <div class="flex items-center gap-3">
          {results.length > 0 && (
            <span>{results.filter(Boolean).length}/{results.length} correct</span>
          )}
          <button
            onClick={() => setShowEvBoard(!showEvBoard)}
            class={`px-2 py-0.5 rounded-sm border transition-colors ${showEvBoard ? 'border-[#8F5A39] text-[#8F5A39] bg-[#F4EFE7]' : 'border-[#E5E0D8] hover:border-[#8F5A39]'}`}
          >
            Evidence ({evidence.length})
          </button>
          <span>{elapsed}m</span>
        </div>
      </div>

      {/* ── Evidence board (collapsible) ── */}
      {showEvBoard && evidence.length > 0 && (
        <div class="border border-[#E5E0D8] rounded-sm mb-4 overflow-hidden" style="animation: fadeIn 0.2s ease-in">
          <div class="px-3 py-2 bg-[#F4EFE7] border-b border-[#E5E0D8]">
            <p class="text-[10px] uppercase tracking-[0.12em] text-[#8F5A39] font-semibold">Case evidence</p>
          </div>
          <div class="max-h-40 overflow-y-auto divide-y divide-[#E5E0D8]">
            {evidence.map((ev, i) => (
              <div key={i} class="px-3 py-2 flex items-start gap-2">
                <div class={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${ev.correct ? 'bg-[#22c55e]' : 'bg-red-400'}`} />
                <div>
                  <span class="text-[9px] font-mono text-[#6b6560]">{ev.year}</span>
                  <p class="text-[11px] text-black leading-snug">{ev.lesson}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
        <div class="bg-black h-0.5 transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      {/* ── Year + Chapter header ── */}
      <div class="bg-black text-white rounded-sm p-5 mb-4">
        <div class="flex items-baseline gap-3">
          <span class="text-lg font-mono text-white/30">{currentQ.year}</span>
          <div class="w-px h-5 bg-white/15" />
          <h2 style="font-family: var(--font-display);" class="text-xl leading-tight">
            {currentQ.chapterTitle}
          </h2>
        </div>
      </div>

      {/* ── Narrative (progressive reveal) ── */}
      <div class="mb-4">
        {narrativeParagraphs.map((para, i) => (
          <p
            key={i}
            style={{
              fontFamily: 'var(--font-display)',
              opacity: i < narrativeRevealed ? 1 : 0,
              transform: i < narrativeRevealed ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
            class="text-[15px] text-black leading-relaxed mb-3 last:mb-0"
          >
            {para}
          </p>
        ))}
      </div>

      {/* ── Question card ── */}
      <div class="border border-[#E5E0D8] rounded-sm p-5 mb-3 bg-white">
        <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold mb-2">
          Investigation question
        </p>
        <p class="text-black leading-relaxed text-[15px]">{currentQ.stem}</p>
      </div>

      {/* ── Answer choices ── */}
      <div class="space-y-2 mb-3">
        {currentQ.choices.map((c) => {
          const isSelected = selected === c.label;
          const isCorrectChoice = c.label === currentQ.correctAnswer;

          let containerClass = 'border-[#E5E0D8] bg-white hover:border-[#8F5A39] hover:bg-[#F4EFE7]';
          let labelClass = 'bg-[#F4EFE7] text-[#6b6560]';

          if (revealed) {
            if (isCorrectChoice) {
              containerClass = 'border-[#22c55e] bg-[#22c55e]/5';
              labelClass = 'bg-[#22c55e] text-white';
            } else if (isSelected) {
              containerClass = 'border-red-400 bg-red-50';
              labelClass = 'bg-red-400 text-white';
            } else {
              containerClass = 'border-[#E5E0D8] bg-white opacity-40';
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
                <span class={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${labelClass}`}>
                  {c.label}
                </span>
                <span class="text-black text-sm leading-relaxed flex-1">{c.text}</span>
              </div>
              {revealed && (
                <p class={`text-xs mt-2.5 ml-10 leading-relaxed ${isCorrectChoice ? 'text-[#22c55e]' : 'text-[#6b6560]'}`}>
                  {c.explanation}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Confidence bet (before submitting) ── */}
      {selected && !revealed && (
        <div class="border border-[#E5E0D8] rounded-sm p-4 mb-3 bg-[#F4EFE7]" style="animation: fadeIn 0.2s ease-in">
          <p class="text-[10px] uppercase tracking-[0.12em] text-[#6b6560] font-semibold mb-2">
            How confident are you?
          </p>
          <div class="flex gap-2">
            {CONFIDENCE_LEVELS.map((level, i) => (
              <button
                key={level.label}
                onClick={() => setConfidence(i)}
                class={`flex-1 py-2 rounded-sm text-xs font-medium transition-all ${
                  confidence === i
                    ? 'text-white shadow-sm'
                    : 'text-[#6b6560] border border-[#E5E0D8] bg-white hover:border-[#8F5A39]'
                }`}
                style={confidence === i ? { backgroundColor: level.color } : undefined}
              >
                {level.label}
                <span class="block text-[9px] opacity-60 mt-0.5">{level.multiplier}x</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Post-answer reveal panels ── */}
      {revealed && (
        <div class="space-y-3 mb-3" style="animation: fadeIn 0.3s ease-in">
          {/* Confidence result */}
          <div class={`text-center py-2 rounded-sm text-xs font-medium ${
            selected === currentQ.correctAnswer
              ? 'bg-[#22c55e]/10 text-[#22c55e]'
              : 'bg-red-50 text-red-500'
          }`}>
            {selected === currentQ.correctAnswer
              ? `Correct! ${conf.multiplier > 1 ? `(${conf.multiplier}x confidence bonus)` : ''}`
              : `Incorrect. ${conf.label === 'Certain' ? 'Overconfidence penalty.' : ''}`
            }
          </div>

          {/* Regulatory lesson */}
          <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4">
            <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold mb-2">
              The regulatory lesson
            </p>
            <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
            <div class="mt-3 px-3 py-2 bg-white rounded-sm border border-[#E5E0D8]">
              <p class="text-[10px] uppercase tracking-[0.1em] text-[#6b6560] font-semibold mb-1">Key rule</p>
              <p class="text-xs text-[#8F5A39] font-medium">{currentQ.regulatoryLesson}</p>
            </div>
          </div>

          {/* What actually happened */}
          <div class="bg-black text-white rounded-sm p-4">
            <p class="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold mb-2">
              What actually happened
            </p>
            <p class="text-sm text-white/80 leading-relaxed">{currentQ.whatActuallyHappened}</p>
          </div>

          {/* Evidence added confirmation */}
          <div class="flex items-center gap-2 text-[10px] text-[#8F5A39] px-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke={B.bronze} stroke-width="1.5" stroke-linecap="round" />
            </svg>
            Evidence added to case file
          </div>
        </div>
      )}

      {/* ── Action button ── */}
      {!revealed ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] disabled:bg-[#E5E0D8] disabled:text-[#6b6560] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors active:scale-[0.99]"
        >
          Submit answer
        </button>
      ) : (
        <button
          onClick={handleNext}
          class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors active:scale-[0.99]"
        >
          {currentIndex + 1 >= totalChapters ? 'See case summary' : 'Next chapter'} &rarr;
        </button>
      )}

      {/* Keyboard hints */}
      <p class="text-center text-xs text-[#6b6560]/50 mt-3 hidden sm:block">
        1-4 select &middot; Enter submit &middot; E evidence board &middot; N next
      </p>
    </div>
  );
}
