import { useState, useEffect, useCallback, useRef, useMemo } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $learnProgress, getRecord, recordLearnAnswer, sectionMastery, type LearnRecord } from '../stores/learnState';
import { recordAnswer } from '../stores/progress';
import { hapticLight, hapticMedium } from '../lib/haptics';
import type { Question } from '../lib/types';

// Brand tokens
const B = {
  bronze:     '#8F5A39',
  travertine: '#F4EFE7',
  border:     '#E5E0D8',
  muted:      '#6b6560',
};

// ─── Stop words for keyword extraction ──────────────────────────────────
const STOP_WORDS = new Set([
  'the','that','this','which','with','from','they','them','their','have','has',
  'been','were','will','would','could','should','about','into','than','also',
  'when','where','what','there','these','those','such','each','does','must',
  'other','more','most','only','some','very','being','because','between',
  'through','after','before','during','both','same','just','over','under',
  'while','then','here','even','much','many','well','still','already','often',
  'however','without','within','along','until','since','upon','among','itself',
  'itself','themselves','cannot','shall','might','like','make','made','take',
  'including','known','called','used','using','based','given','provide','allows',
  'need','typically','generally','usually','often','considered','required',
  'ensure','means','refers','related','involves','example','specific','include',
  'includes','involves','involve','involves','common','important','following',
]);

function extractKeyTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w));
}

function matchKeywords(userInput: string, referenceText: string): { matched: boolean; score: number } {
  const terms = extractKeyTerms(referenceText);
  if (terms.length === 0) return { matched: true, score: 1 };
  const userTerms = new Set(
    userInput
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  let hits = 0;
  for (const t of terms) {
    for (const u of userTerms) {
      if (u.includes(t) || t.includes(u)) { hits++; break; }
    }
  }
  const score = hits / terms.length;
  return { matched: score >= 0.6, score };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PHASE_LABELS: Record<number, string> = { 1: 'MCQ', 2: 'Fill-in', 3: 'Free Recall' };
const PHASE_COLORS: Record<number, string> = {
  1: 'bg-[#F4EFE7] text-[#8F5A39] border-[#E5E0D8]',
  2: 'bg-black text-white border-black',
  3: 'bg-[#8F5A39] text-white border-[#8F5A39]',
};

interface Props {
  questions: Question[];
  topic: string;
  topicName: string;
  examSlug: string;
  backUrl: string;
}

interface SessionResult {
  qId: string;
  phase: 1 | 2 | 3;
  correct: boolean;
}

export default function LearnEngine({ questions: allQuestions, topic, topicName, examSlug, backUrl }: Props) {
  // Force re-read of learn progress so mastery ring updates
  const learnMap = useStore($learnProgress);

  const [mode, setMode] = useState<'active' | 'summary'>('active');
  const [queue, setQueue] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  // Phase 1 state
  const [selected, setSelected] = useState<string | null>(null);
  const [mcqRevealed, setMcqRevealed] = useState(false);

  // Phase 2 state
  const [fillInput, setFillInput] = useState('');
  const [fillRevealed, setFillRevealed] = useState(false);
  const [fillCorrect, setFillCorrect] = useState<boolean | null>(null);

  // Phase 3 state
  const [recallInput, setRecallInput] = useState('');
  const [recallRevealed, setRecallRevealed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build initial queue: shuffle, prioritize unmastered, cap at 20
  useEffect(() => {
    const sorted = [...allQuestions].sort((a, b) => {
      const ra = getRecord(examSlug, topic, a.id);
      const rb = getRecord(examSlug, topic, b.id);
      if (ra.mastered && !rb.mastered) return 1;
      if (!ra.mastered && rb.mastered) return -1;
      return 0;
    });
    const unmastered = sorted.filter((q) => !getRecord(examSlug, topic, q.id).mastered);
    const pool = unmastered.length > 0 ? unmastered : sorted;
    setQueue(shuffle(pool).slice(0, Math.min(20, pool.length)));
    setCurrentIndex(0);
    resetQuestionState();
  }, []);

  const currentQ = queue[currentIndex];
  const currentRecord: LearnRecord = currentQ
    ? getRecord(examSlug, topic, currentQ.id)
    : { phase: 1, correctInPhase: 0, mastered: false };
  const phase = currentRecord.mastered ? 3 : currentRecord.phase;

  const mastery = useMemo(() => {
    return sectionMastery(examSlug, topic, allQuestions.map((q) => q.id));
  }, [learnMap, examSlug, topic, allQuestions]);

  function resetQuestionState() {
    setSelected(null);
    setMcqRevealed(false);
    setFillInput('');
    setFillRevealed(false);
    setFillCorrect(null);
    setRecallInput('');
    setRecallRevealed(false);
  }

  function handleNext() {
    if (currentIndex + 1 >= queue.length) {
      setMode('summary');
      return;
    }
    setCurrentIndex((i) => i + 1);
    resetQuestionState();
  }

  // ─── Phase 1: MCQ ──────────────────────────────────────────────────────
  function handleMcqSelect(label: string) {
    if (mcqRevealed) return;
    setSelected(label);
  }

  function handleMcqSubmit() {
    if (!selected || !currentQ) return;
    const isCorrect = selected === currentQ.correctAnswer;
    setMcqRevealed(true);
    recordLearnAnswer(examSlug, topic, currentQ.id, isCorrect);
    recordAnswer(isCorrect, currentQ.difficulty, { topic: currentQ.topic, section: currentQ.section });
    setSessionResults((p) => [...p, { qId: currentQ.id, phase: 1, correct: isCorrect }]);
    if (isCorrect) hapticLight(); else hapticMedium();
  }

  // ─── Phase 2: Fill-in ──────────────────────────────────────────────────
  function handleFillSubmit() {
    if (!fillInput.trim() || !currentQ) return;
    const correctChoice = currentQ.choices.find((c) => c.label === currentQ.correctAnswer);
    const referenceText = correctChoice ? `${correctChoice.text} ${correctChoice.explanation}` : currentQ.explanation;
    const { matched } = matchKeywords(fillInput, referenceText);
    setFillCorrect(matched);
    setFillRevealed(true);
    recordLearnAnswer(examSlug, topic, currentQ.id, matched);
    recordAnswer(matched, currentQ.difficulty, { topic: currentQ.topic, section: currentQ.section });
    setSessionResults((p) => [...p, { qId: currentQ.id, phase: 2, correct: matched }]);
    if (matched) hapticLight(); else hapticMedium();
  }

  // ─── Phase 3: Free Recall ─────────────────────────────────────────────
  function handleRecallGrade(correct: boolean) {
    if (!currentQ) return;
    recordLearnAnswer(examSlug, topic, currentQ.id, correct);
    recordAnswer(correct, currentQ.difficulty, { topic: currentQ.topic, section: currentQ.section });
    setSessionResults((p) => [...p, { qId: currentQ.id, phase: 3, correct }]);
    if (correct) hapticLight(); else hapticMedium();
    // Auto-advance after grading
    setTimeout(() => handleNext(), 400);
  }

  // ─── Keyboard handling ─────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== 'active' || !currentQ) return;
      if (phase === 1) {
        if (!mcqRevealed) {
          if (['1', '2', '3', '4'].includes(e.key)) {
            handleMcqSelect(['A', 'B', 'C', 'D'][parseInt(e.key) - 1]);
          }
          if (e.key === 'Enter' && selected) handleMcqSubmit();
        } else {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'n') { e.preventDefault(); handleNext(); }
        }
      } else if (phase === 2) {
        if (!fillRevealed && e.key === 'Enter') handleFillSubmit();
        if (fillRevealed && (e.key === 'Enter' || e.key === 'n')) { e.preventDefault(); handleNext(); }
      }
      // Phase 3 keyboard is handled inline (Enter to reveal, then 1/2 to grade)
      if (phase === 3) {
        if (!recallRevealed && e.key === 'Enter' && recallInput.trim()) {
          e.preventDefault();
          setRecallRevealed(true);
        }
        if (recallRevealed) {
          if (e.key === '1') handleRecallGrade(true);
          if (e.key === '2') handleRecallGrade(false);
        }
      }
    },
    [mode, phase, mcqRevealed, selected, fillRevealed, fillInput, recallRevealed, recallInput, currentQ, currentIndex, queue]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input on phase change
  useEffect(() => {
    if (mode !== 'active' || !currentQ) return;
    if (phase === 2 && !fillRevealed) setTimeout(() => inputRef.current?.focus(), 50);
    if (phase === 3 && !recallRevealed) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [currentIndex, phase, mode]);

  // ─── Progress ring SVG ─────────────────────────────────────────────────
  function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return (
      <svg width={size} height={size} class="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={B.border} stroke-width="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={B.bronze}
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray={`${c}`}
          stroke-dashoffset={`${offset}`}
          class="transition-all duration-700"
        />
      </svg>
    );
  }

  // ─── SUMMARY ───────────────────────────────────────────────────────────
  if (mode === 'summary') {
    const total = sessionResults.length;
    const correct = sessionResults.filter((r) => r.correct).length;
    const byPhase = (p: number) => {
      const items = sessionResults.filter((r) => r.phase === p);
      const c = items.filter((r) => r.correct).length;
      return { total: items.length, correct: c, pct: items.length > 0 ? Math.round((c / items.length) * 100) : 0 };
    };
    const p1 = byPhase(1);
    const p2 = byPhase(2);
    const p3 = byPhase(3);
    const unmasteredCount = allQuestions.filter((q) => !getRecord(examSlug, topic, q.id).mastered).length;

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <div class="border border-[#E5E0D8] rounded-sm p-6 mb-4">
          <div class="text-center mb-6">
            <div style="font-family: var(--font-display);" class="text-4xl text-black mb-1">Session Complete</div>
            <div class="text-sm text-[#6b6560] mt-2">{correct} of {total} correct</div>
          </div>

          {/* Mastery ring */}
          <div class="relative w-28 h-28 mx-auto mb-6">
            <ProgressRing percent={mastery.percent} size={112} />
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span style="font-family: var(--font-display);" class="text-xl text-black">{mastery.mastered}</span>
              <span class="text-xs text-[#6b6560]">mastered</span>
            </div>
          </div>

          {/* Accuracy by phase */}
          <div class="space-y-2 mb-4">
            {[
              { label: 'MCQ', data: p1 },
              { label: 'Fill-in', data: p2 },
              { label: 'Free Recall', data: p3 },
            ].filter((x) => x.data.total > 0).map(({ label, data }) => (
              <div class="flex items-center justify-between text-sm">
                <span class="text-[#6b6560]">{label}</span>
                <span class="font-medium text-black">{data.correct}/{data.total} ({data.pct}%)</span>
              </div>
            ))}
          </div>

          <div class="text-center text-xs text-[#6b6560] mb-4">
            {mastery.mastered} / {mastery.total} questions mastered ({mastery.percent}%)
          </div>
        </div>

        {unmasteredCount > 0 && (
          <button
            onClick={() => {
              const unmastered = allQuestions.filter((q) => !getRecord(examSlug, topic, q.id).mastered);
              setQueue(shuffle(unmastered).slice(0, Math.min(20, unmastered.length)));
              setCurrentIndex(0);
              setSessionResults([]);
              resetQuestionState();
              setMode('active');
            }}
            class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] text-white font-medium rounded-sm text-sm uppercase tracking-[0.1em] transition-colors mb-3"
          >
            Continue learning ({unmasteredCount} remaining)
          </button>
        )}

        <a
          href={backUrl}
          class="block w-full py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm text-center transition-colors no-underline"
        >
          Done
        </a>
      </div>
    );
  }

  // ─── ACTIVE LEARNING ──────────────────────────────────────────────────
  if (!currentQ) return null;

  const correctChoice = currentQ.choices.find((c) => c.label === currentQ.correctAnswer);

  return (
    <div class="max-w-lg mx-auto px-4 py-4 relative">
      {/* Top bar */}
      <div class="flex items-center justify-between mb-3">
        <a href={backUrl} class="text-xs uppercase tracking-[0.1em] text-[#8F5A39] hover:text-black transition-colors font-medium no-underline">
          ← Back
        </a>
        <div class="flex items-center gap-3">
          <span class={`text-xs px-2 py-0.5 rounded-sm font-medium border ${PHASE_COLORS[phase]}`}>
            {PHASE_LABELS[phase]}
          </span>
          <span class="text-xs text-[#6b6560]">{currentIndex + 1} / {queue.length}</span>
        </div>
      </div>

      {/* Header with progress ring */}
      <div class="flex items-center gap-3 mb-4">
        <div class="relative shrink-0">
          <ProgressRing percent={mastery.percent} />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xs font-semibold text-black">{mastery.percent}%</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div style="font-family: var(--font-display);" class="text-base text-black truncate">Learn: {topicName}</div>
          <div class="text-xs text-[#6b6560]">{mastery.mastered}/{mastery.total} mastered</div>
        </div>
      </div>

      {/* Progress bar */}
      <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
        <div
          class="bg-[#8F5A39] h-0.5 transition-all duration-300"
          style={{ width: `${queue.length > 0 ? Math.round(((currentIndex + 1) / queue.length) * 100) : 0}%` }}
        />
      </div>

      {/* ─── Phase 1: MCQ ─────────────────────────────────────────────── */}
      {phase === 1 && (
        <>
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

              if (mcqRevealed) {
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
                  onClick={() => handleMcqSelect(c.label)}
                  disabled={mcqRevealed}
                  class={`w-full p-4 rounded-sm border text-left transition-all active:scale-[0.99] ${containerClass}`}
                >
                  <div class="flex items-start gap-3">
                    <span class={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${labelClass}`}>
                      {c.label}
                    </span>
                    <span class="text-black text-sm leading-relaxed flex-1">{c.text}</span>
                  </div>
                  {mcqRevealed && (
                    <p class={`text-xs mt-2.5 ml-10 leading-relaxed ${isCorrectChoice ? 'text-[#8F5A39]' : 'text-[#6b6560]'}`}>
                      {c.explanation}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {mcqRevealed && (
            <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-3" style="animation: fadeIn 0.3s ease-in">
              <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
              {currentQ.regulatoryBasis && (
                <p class="text-xs text-[#8F5A39] mt-2 font-medium">{currentQ.regulatoryBasis}</p>
              )}
            </div>
          )}

          {!mcqRevealed ? (
            <button
              onClick={handleMcqSubmit}
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
              {currentIndex + 1 >= queue.length ? 'See summary' : 'Next question'}
            </button>
          )}
        </>
      )}

      {/* ─── Phase 2: Fill-in-the-Blank ───────────────────────────────── */}
      {phase === 2 && (
        <>
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

          <div class="mb-3">
            <label class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-2 block">
              Type the correct answer
            </label>
            <input
              ref={inputRef}
              type="text"
              value={fillInput}
              onInput={(e) => setFillInput((e.target as HTMLInputElement).value)}
              disabled={fillRevealed}
              placeholder="Key concepts from the correct answer..."
              class={`w-full px-4 py-3.5 border rounded-sm text-sm text-black bg-white placeholder-[#6b6560]/40 outline-none transition-colors ${
                fillRevealed
                  ? fillCorrect
                    ? 'border-[#8F5A39] bg-[#F4EFE7]'
                    : 'border-black bg-black/5'
                  : 'border-[#E5E0D8] focus:border-[#8F5A39]'
              }`}
            />
            {fillRevealed && (
              <div class={`text-xs mt-1.5 font-medium ${fillCorrect ? 'text-[#8F5A39]' : 'text-black'}`}>
                {fillCorrect ? 'Matched key concepts' : 'Not enough key terms matched'}
              </div>
            )}
          </div>

          {fillRevealed && (
            <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-3" style="animation: fadeIn 0.3s ease-in">
              <div class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-1.5">Correct answer</div>
              <p class="text-sm text-black font-medium leading-relaxed mb-2">
                {correctChoice?.label}. {correctChoice?.text}
              </p>
              <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
              {currentQ.regulatoryBasis && (
                <p class="text-xs text-[#8F5A39] mt-2 font-medium">{currentQ.regulatoryBasis}</p>
              )}
            </div>
          )}

          {!fillRevealed ? (
            <button
              onClick={handleFillSubmit}
              disabled={!fillInput.trim()}
              class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] disabled:bg-[#E5E0D8] disabled:text-[#6b6560] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors"
            >
              Check
            </button>
          ) : (
            <button
              onClick={handleNext}
              class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors"
            >
              {currentIndex + 1 >= queue.length ? 'See summary' : 'Next question'}
            </button>
          )}
        </>
      )}

      {/* ─── Phase 3: Free Recall ─────────────────────────────────────── */}
      {phase === 3 && (
        <>
          <div class="bg-white border border-[#E5E0D8] rounded-sm p-5 mb-3">
            <div class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-2">Explain this concept</div>
            <p style="font-family: var(--font-display);" class="text-xl text-black leading-snug">
              {currentQ.subtopic?.replace(/-/g, ' ') || currentQ.stem}
            </p>
          </div>

          <div class="mb-3">
            <textarea
              ref={textareaRef}
              value={recallInput}
              onInput={(e) => setRecallInput((e.target as HTMLTextAreaElement).value)}
              disabled={recallRevealed}
              placeholder="Write everything you know..."
              rows={4}
              class="w-full px-4 py-3.5 border border-[#E5E0D8] rounded-sm text-sm text-black bg-white placeholder-[#6b6560]/40 outline-none resize-none focus:border-[#8F5A39] transition-colors"
            />
          </div>

          {!recallRevealed ? (
            <button
              onClick={() => setRecallRevealed(true)}
              disabled={!recallInput.trim()}
              class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] disabled:bg-[#E5E0D8] disabled:text-[#6b6560] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors"
            >
              Show answer
            </button>
          ) : (
            <>
              <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-3" style="animation: fadeIn 0.3s ease-in">
                <div class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-1.5">Full explanation</div>
                <p class="text-sm text-black leading-relaxed mb-2">{currentQ.stem}</p>
                <p class="text-sm text-black font-medium leading-relaxed mb-2">
                  Answer: {correctChoice?.label}. {correctChoice?.text}
                </p>
                <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
                {currentQ.regulatoryBasis && (
                  <p class="text-xs text-[#8F5A39] mt-2 font-medium">{currentQ.regulatoryBasis}</p>
                )}
              </div>

              <div class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium text-center mb-2">
                How did you do?
              </div>
              <div class="flex gap-3">
                <button
                  onClick={() => handleRecallGrade(false)}
                  class="flex-1 py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors"
                >
                  Not yet
                </button>
                <button
                  onClick={() => handleRecallGrade(true)}
                  class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors"
                >
                  Got it
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Keyboard hints */}
      <p class="text-center text-xs text-[#6b6560]/50 mt-3 hidden sm:block">
        {phase === 1 && '1-4 to select · Enter to submit · N for next'}
        {phase === 2 && 'Enter to check · N for next'}
        {phase === 3 && 'Enter to reveal · 1 = Got it · 2 = Not yet'}
      </p>
    </div>
  );
}
