import { useState, useEffect, useMemo } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress, $xp, $streak, $accuracy, recordAnswer, recordBellResult } from '../stores/progress';
import { enqueueWrong } from '../stores/hotSheet';
import { generateShareString, copyToClipboard } from '../lib/shareString';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';
import { getDailyBellQuestions } from '../lib/dailySeed';
import { getGreedForDate } from '../lib/greedIndex';
import type { Question } from '../lib/types';

interface Props {
  base: string;
  questions: Question[];
}

const todayISO = () => new Date().toISOString().split('T')[0];

function bellTimeToday(): Date {
  const d = new Date();
  d.setHours(9, 30, 0, 0);
  return d;
}

type Phase = 'gate' | 'confirm' | 'running' | 'done';

export default function OpeningBell({ base, questions: allQuestions }: Props) {
  const p = useStore($progress);
  const xp = useStore($xp);
  const streak = useStore($streak);
  const accuracy = useStore($accuracy);

  const today = todayISO();
  const greed = getGreedForDate(today);
  const dailyQ = useMemo(() => getDailyBellQuestions(today, allQuestions, 5), [today, allQuestions]);

  const alreadyDone = p.bellLastDate === today;
  const beforeBell = Date.now() < bellTimeToday().getTime();

  // Derive initial phase
  const initialPhase: Phase = alreadyDone ? 'done' : beforeBell ? 'gate' : 'gate';
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [tickerShown, setTickerShown] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const currentQ = dailyQ[idx];

  const handleStart = () => {
    setPhase('confirm');
  };
  const handleConfirm = () => {
    setPhase('running');
    setIdx(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setEarnedXp(0);
  };
  const handleSelect = (label: string) => {
    if (revealed) return;
    setSelected(label);
  };
  const handleSubmit = () => {
    if (!selected || !currentQ) return;
    const correct = selected === currentQ.correctAnswer;
    setRevealed(true);
    const result = recordAnswer(correct, currentQ.difficulty, {
      topic: currentQ.topic,
      section: currentQ.section,
    });
    setEarnedXp((e) => e + result.earnedXp);
    if (correct) {
      setScore((s) => s + 1);
      hapticLight();
    } else {
      enqueueWrong(currentQ.id, currentQ.section || currentQ.topic || 'general', currentQ.stem);
      hapticMedium();
    }
  };
  const handleNext = () => {
    if (idx + 1 >= dailyQ.length) {
      // finished
      recordBellResult(today, score + (selected === currentQ?.correctAnswer ? 0 : 0));
      setPhase('done');
      setTickerShown(true);
      setTimeout(() => setTickerShown(false), 8000);
      hapticSuccess(); // Bell completion haptic
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  // When transitioning to done after the last question, record the result with the final score.
  useEffect(() => {
    if (phase === 'done' && !alreadyDone && p.bellLastDate !== today && score > 0) {
      recordBellResult(today, score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─── EMPTY POOL ────────────────────────────────────────────────────────────
  if (allQuestions.length === 0) {
    return (
      <div class="max-w-lg mx-auto px-4 py-10 text-center">
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Opening Bell</p>
        <h1 style="font-family: var(--font-display);" class="text-3xl text-black mb-3">No questions loaded</h1>
        <p class="text-sm text-[#6b6560]">The Bell needs an SIE question pool.</p>
        <a href={base} class="mt-6 inline-block text-xs uppercase tracking-wider text-[#8F5A39]">← Home</a>
      </div>
    );
  }

  // ─── DONE / GATE ───────────────────────────────────────────────────────────
  if (phase === 'done' || (phase === 'gate' && alreadyDone)) {
    let history: { date: string; score: number }[] = [];
    try { history = JSON.parse(p.bellHistory || '[]'); }
    catch { history = []; }
    const todayEntry = history.find((h) => h.date === today);
    const runCurrent = parseInt(p.bellRunCurrent || '0', 10);
    return (
      <div class="max-w-lg mx-auto px-4 py-8">
        {tickerShown && (
          <div class="mb-4 overflow-hidden bg-black text-[#A6D7F0] py-2 rounded-sm">
            <div class="whitespace-nowrap animate-[ticker_8s_linear_forwards] text-xs font-mono px-4">
              YOU ↑{earnedXp}XP &nbsp; STREAK +{streak} &nbsp; ACC {accuracy}% ▲ &nbsp; BELL {todayEntry?.score ?? score}/5 ✓ &nbsp; RUN {runCurrent}d &nbsp; XP {xp.toLocaleString()} &nbsp; • &nbsp; MARKETS CLOSED 16:00 ET
            </div>
          </div>
        )}
        <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
          ← Home
        </a>
        <div class="text-center mb-8">
          <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Opening Bell</p>
          <div class="text-6xl mb-2">🔔</div>
          <h1 style="font-family: var(--font-display);" class="text-4xl text-black mb-2">
            {todayEntry?.score ?? score}/5
          </h1>
          <p class="text-sm text-[#6b6560]">Bell rung. Tomorrow at 9:30.</p>
        </div>
        <div class="border border-[#E5E0D8] rounded-sm p-4 bg-white text-center mb-4">
          <div class="text-xs text-[#6b6560] uppercase tracking-wider mb-1">Bell run</div>
          <div style="font-family: var(--font-display);" class="text-3xl text-black">{runCurrent}</div>
          <div class="text-[11px] text-[#6b6560] mt-0.5">consecutive days</div>
        </div>

        <button
          onClick={async () => {
            const bellScore = todayEntry?.score ?? score;
            // Build result array from score (we know 5 questions, first N correct)
            const results = dailyQ.map((_, i) => ({ correct: i < bellScore }));
            const text = generateShareString(results, {
              mode: 'bell',
              date: today,
              streak: parseInt(p.bellRunCurrent || '0', 10),
              xp: parseInt(p.xp || '0', 10),
              greedMultiplier: greed.multiplier,
            });
            await copyToClipboard(text);
            setShareToast(true);
            setTimeout(() => setShareToast(false), 2000);
          }}
          class="w-full py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors"
        >
          Share results
        </button>

        {shareToast && (
          <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-black text-white text-sm rounded-sm shadow-lg" style="animation: fadeIn 0.2s ease-in">
            Copied to clipboard
          </div>
        )}
      </div>
    );
  }

  // ─── GATE (not yet 9:30) ───────────────────────────────────────────────────
  if (phase === 'gate' && beforeBell) {
    const ms = bellTimeToday().getTime() - Date.now();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return (
      <div class="max-w-lg mx-auto px-4 py-10 text-center">
        <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
          ← Home
        </a>
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Opening Bell</p>
        <div class="text-6xl mb-3 opacity-60">🔔</div>
        <h1 style="font-family: var(--font-display);" class="text-3xl text-black mb-2">Rings in {h}h {m}m</h1>
        <p class="text-sm text-[#6b6560]">Five questions. One chance. Be ready at 9:30.</p>
      </div>
    );
  }

  // ─── GATE (post-9:30, not started) ─────────────────────────────────────────
  if (phase === 'gate') {
    return (
      <div class="max-w-lg mx-auto px-4 py-10 text-center">
        <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
          ← Home
        </a>
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Opening Bell</p>
        <div class="text-7xl mb-4">🔔</div>
        <h1 style="font-family: var(--font-display);" class="text-3xl text-black mb-2">The bell has rung.</h1>
        <p class="text-sm text-[#6b6560] mb-8">Five questions. One chance.</p>
        <button
          onClick={handleStart}
          class="w-full max-w-xs mx-auto py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors"
        >
          Take the Bell →
        </button>
        {greed.multiplier !== 1 && (
          <p class="text-xs text-[#8F5A39] mt-4 font-medium uppercase tracking-wider">{greed.label} · {greed.multiplier}x XP today</p>
        )}
      </div>
    );
  }

  // ─── CONFIRM MODAL ─────────────────────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div class="bg-white border border-[#E5E0D8] rounded-sm p-6 max-w-sm w-full">
          <p class="text-[11px] uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Opening Bell</p>
          <h2 style="font-family: var(--font-display);" class="text-2xl text-black mb-3">You only get one attempt.</h2>
          <p class="text-sm text-[#6b6560] mb-5 leading-relaxed">
            Five questions. Once you start, the Bell counts — even if you walk away.
          </p>
          <div class="flex gap-3">
            <button
              onClick={() => setPhase('gate')}
              class="flex-1 py-3 border border-[#E5E0D8] hover:border-black text-black text-sm rounded-sm transition-colors"
            >
              Wait
            </button>
            <button
              onClick={handleConfirm}
              class="flex-1 py-3 bg-black hover:bg-[#1a1a1a] text-white text-sm font-medium rounded-sm transition-colors"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RUNNING ───────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <div class="max-w-lg mx-auto px-4 py-4">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] font-medium">Opening Bell · {idx + 1}/5</span>
        <span class="text-base leading-none">🔔</span>
      </div>

      <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
        <div
          class="bg-[#8F5A39] h-0.5 transition-all duration-300"
          style={{ width: `${((idx + (revealed ? 1 : 0)) / dailyQ.length) * 100}%` }}
        />
      </div>

      <div class="bg-white border border-[#E5E0D8] rounded-sm p-5 mb-3">
        <div class="flex items-center gap-2 mb-3">
          <span class={`text-xs px-2 py-0.5 rounded-sm font-medium border ${
            currentQ.difficulty === 'hard'   ? 'border-black text-black bg-black/5' :
            currentQ.difficulty === 'medium' ? 'border-[#8F5A39] text-[#8F5A39] bg-[#F4EFE7]' :
                                               'border-[#E5E0D8] text-[#6b6560] bg-[#F4EFE7]'
          }`}>{currentQ.difficulty}</span>
          <span class="text-xs text-[#6b6560]">{currentQ.subtopic?.replace(/-/g, ' ')}</span>
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
              onClick={() => handleSelect(c.label)}
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
        <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-3">
          <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
          {currentQ.regulatoryBasis && (
            <p class="text-xs text-[#8F5A39] mt-2 font-medium">{currentQ.regulatoryBasis}</p>
          )}
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
          {idx + 1 >= dailyQ.length ? 'Ring the bell →' : 'Next →'}
        </button>
      )}
    </div>
  );
}
