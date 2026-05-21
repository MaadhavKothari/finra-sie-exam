import { useState, useEffect, useRef, useMemo, useCallback } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress, $xp, $streak, recordAnswer, recordExamResult, getExamHistory } from '../stores/progress';
import { enqueueWrong } from '../stores/hotSheet';
import { generateShareString, copyToClipboard } from '../lib/shareString';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';
import { analyzeNearMiss, getSectionBreakdown, type ExamAnswer } from '../lib/nearMiss';
import { djb2, mulberry32 } from '../lib/rng';
import { EXAMS, type ExamId } from '../data/exams';
import type { Question } from '../lib/types';

interface Props {
  base: string;
  questions: Question[];
  examId: ExamId;
}

const B = {
  bronze: '#8F5A39',
  travertine: '#F4EFE7',
  border: '#E5E0D8',
  muted: '#6b6560',
};

const todayISO = () => new Date().toISOString().split('T')[0];

function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

type Phase = 'select' | 'confirm' | 'running' | 'results';

export default function ExamSim({ base, questions: allQuestions, examId }: Props) {
  const exam = EXAMS[examId];
  const p = useStore($progress);
  const xp = useStore($xp);
  const streak = useStore($streak);

  const [phase, setPhase] = useState<Phase>('select');

  // Exam state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [shareToast, setShareToast] = useState(false);

  // History
  const history = useMemo(() => getExamHistory().filter((e) => e.examId === examId), [p.examHistory, examId]);

  const totalQ = exam.scoredQuestions;

  // Seeded shuffle for reproducibility per session
  const startExam = () => {
    const seed = djb2(`exam:${examId}:${Date.now()}`);
    const rng = mulberry32(seed);
    const indices = allQuestions.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const picked = indices.slice(0, Math.min(totalQ, allQuestions.length)).map((i) => allQuestions[i]);
    setQuestions(picked);
    setIdx(0);
    setSelected(null);
    setAnswers([]);
    setTimeLeft(exam.minutes * 60);
    setStartTime(Date.now());
    setPhase('running');
  };

  // Timer
  useEffect(() => {
    if (phase !== 'running') return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time's up — auto-submit
          window.clearInterval(timerRef.current!);
          finishExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [phase]);

  const currentQ = questions[idx];

  const handleSelect = (label: string) => {
    if (phase !== 'running') return;
    setSelected(label);
  };

  const handleSubmit = () => {
    if (!selected || !currentQ) return;
    const correct = selected === currentQ.correctAnswer;
    const section = currentQ.section || currentQ.topic || 'general';

    const answer: ExamAnswer = {
      questionId: currentQ.id,
      stem: currentQ.stem,
      section,
      difficulty: currentQ.difficulty,
      correct,
      selectedAnswer: selected,
      correctAnswer: currentQ.correctAnswer,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Record answer for XP/streak
    recordAnswer(correct, currentQ.difficulty, {
      topic: currentQ.topic,
      section: currentQ.section,
    });

    // Haptic feedback
    if (correct) {
      hapticLight();
    } else {
      hapticMedium();
    }

    // Hot sheet on wrong
    if (!correct) {
      enqueueWrong(currentQ.id, section, currentQ.stem);
    }

    // Move to next or finish
    if (idx + 1 >= questions.length) {
      finishExamWith(newAnswers);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  };

  const finishExam = () => {
    finishExamWith(answers);
  };

  const finishExamWith = (finalAnswers: ExamAnswer[]) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const duration = Math.round((Date.now() - startTime) / 60000);
    const correct = finalAnswers.filter((a) => a.correct).length;
    const total = finalAnswers.length;
    const passed = Math.round((correct / total) * 100) >= exam.passingScore;

    // Completion haptic
    if (passed) hapticSuccess();

    recordExamResult({
      date: todayISO(),
      examId,
      score: correct,
      total,
      passed,
      duration,
    });

    setPhase('results');
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== 'running' || !currentQ) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const labels = ['A', 'B', 'C', 'D'];
        handleSelect(labels[parseInt(e.key) - 1]);
      }
      if (e.key === 'Enter' && selected) handleSubmit();
    },
    [phase, selected, idx, currentQ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ─── SELECT SCREEN ──────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
          ← Home
        </a>

        <div class="text-center mb-8">
          <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Mock Exam</p>
          <h1 style="font-family: var(--font-display);" class="text-3xl text-black mb-2">{exam.name}</h1>
          <p class="text-sm text-[#6b6560]">{exam.fullName}</p>
        </div>

        <div class="grid grid-cols-3 gap-px border border-[#E5E0D8] rounded-sm overflow-hidden mb-6">
          {[
            { label: 'Questions', value: String(exam.scoredQuestions) },
            { label: 'Minutes', value: String(exam.minutes) },
            { label: 'Pass', value: `${exam.passingScore}%` },
          ].map(({ label, value }) => (
            <div key={label} class="bg-white px-3 py-3 text-center">
              <div style="font-family: var(--font-display);" class="text-xl text-black">{value}</div>
              <div class="text-xs text-[#6b6560] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {allQuestions.length >= totalQ ? (
          <button
            onClick={() => setPhase('confirm')}
            class="w-full py-4 bg-black hover:bg-[#1a1a1a] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors mb-6"
          >
            Begin mock exam
          </button>
        ) : (
          <div class="border border-[#E5E0D8] rounded-sm p-4 text-center text-sm text-[#6b6560] mb-6">
            Need at least {totalQ} questions. Only {allQuestions.length} available.
          </div>
        )}

        {/* Exam History */}
        {history.length > 0 && (
          <div>
            <h3 class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-3">Exam history</h3>
            <div class="border border-[#E5E0D8] rounded-sm overflow-hidden">
              {history.slice().reverse().slice(0, 10).map((h, i) => {
                const pct = Math.round((h.score / h.total) * 100);
                return (
                  <div key={i} class={`flex items-center justify-between px-4 py-3 bg-white ${i < Math.min(history.length, 10) - 1 ? 'border-b border-[#E5E0D8]' : ''}`}>
                    <div>
                      <span class="text-sm text-black">{pct}%</span>
                      <span class="text-[11px] text-[#6b6560] ml-2">{h.score}/{h.total} · {h.duration}min</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class={`text-[10px] font-medium px-2 py-0.5 rounded-sm ${h.passed ? 'bg-[#F4EFE7] text-[#8F5A39]' : 'bg-black/5 text-black'}`}>
                        {h.passed ? 'PASS' : 'FAIL'}
                      </span>
                      <span class="text-[10px] text-[#6b6560]">{h.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── CONFIRM ────────────────────────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
        <div class="bg-white border border-[#E5E0D8] rounded-sm p-6 max-w-sm w-full">
          <p class="text-[11px] uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Proctor has entered the room.</p>
          <h2 style="font-family: var(--font-display);" class="text-2xl text-black mb-3">Begin mock exam?</h2>
          <p class="text-sm text-[#6b6560] mb-1 leading-relaxed">
            {exam.scoredQuestions} questions. {exam.minutes} minutes. This counts.
          </p>
          <p class="text-sm text-[#6b6560] mb-5 leading-relaxed">
            {exam.passingScore}% to pass.
          </p>
          <div class="flex gap-3">
            <button
              onClick={() => setPhase('select')}
              class="flex-1 py-3 border border-[#E5E0D8] hover:border-black text-black text-sm rounded-sm transition-colors"
            >
              Not yet
            </button>
            <button
              onClick={startExam}
              class="flex-1 py-3 bg-black hover:bg-[#1a1a1a] text-white text-sm font-medium rounded-sm transition-colors"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const correct = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const pct = Math.round((correct / total) * 100);
    const duration = Math.round((Date.now() - startTime) / 60000);
    const passed = pct >= exam.passingScore;

    const analysis = analyzeNearMiss(answers, exam.passingScore);
    const sections = getSectionBreakdown(answers);

    return (
      <div class="max-w-lg mx-auto px-4 py-6">

        {/* Near-miss special screen */}
        {analysis.isNearMiss && (
          <div class="border-2 border-[#8F5A39] rounded-sm p-5 mb-4 text-center" style="animation: fadeIn 0.5s ease-in">
            <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">So close.</p>
            <h2 style="font-family: var(--font-display);" class="text-3xl text-black mb-2">
              {pct}%. {analysis.pointsShort} point{analysis.pointsShort !== 1 ? 's' : ''} short.
            </h2>
            <p class="text-sm text-[#6b6560] mb-4">
              These questions would have flipped it:
            </p>
            <div class="space-y-2 text-left">
              {analysis.flippingQuestions.slice(0, 3).map((q, i) => (
                <div key={i} class="border border-[#E5E0D8] rounded-sm p-3 bg-[#F4EFE7]">
                  <div class="flex items-center gap-2 mb-1">
                    <span class={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium border ${
                      q.difficulty === 'easy' ? 'border-[#E5E0D8] text-[#6b6560]' :
                      q.difficulty === 'medium' ? 'border-[#8F5A39] text-[#8F5A39]' :
                      'border-black text-black'
                    }`}>{q.difficulty}</span>
                    <span class="text-[10px] text-[#6b6560]">{q.section.replace(/-/g, ' ')}</span>
                  </div>
                  <p class="text-sm text-black leading-snug">
                    {q.stem.length > 100 ? q.stem.slice(0, 97) + '...' : q.stem}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score display */}
        {!analysis.isNearMiss && (
          <div class="text-center mb-6" style="animation: fadeIn 0.5s ease-in">
            <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">
              {passed ? 'Passed.' : pct < exam.passingScore - 10 ? 'Keep studying.' : 'Not quite.'}
            </p>
            <div style="font-family: var(--font-display);" class="text-6xl text-black mb-1">{pct}%</div>
            <div class="text-sm text-[#6b6560]">{correct} of {total} · {duration} min</div>
          </div>
        )}

        {/* Pass/fail indicator */}
        {analysis.isNearMiss ? null : (
          <div class="relative w-28 h-28 mx-auto mb-6">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke={B.border} stroke-width="7" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={passed ? '#2d8a4e' : B.bronze}
                stroke-width="7"
                stroke-linecap="butt"
                stroke-dasharray={`${pct * 2.64} 264`}
                class="transition-all duration-1000"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-sm font-semibold text-black">{passed ? 'PASS' : 'FAIL'}</span>
            </div>
          </div>
        )}

        {/* Ticker tape for pass */}
        {passed && (
          <div class="mb-4 overflow-hidden bg-black text-[#A6D7F0] py-2 rounded-sm">
            <div class="whitespace-nowrap animate-[ticker_8s_linear_forwards] text-xs font-mono px-4">
              PASSED {exam.name} {pct}% &nbsp; {correct}/{total} CORRECT &nbsp; {duration} MIN &nbsp; PROCTOR APPROVED &nbsp; POSITION CLOSED ✓
            </div>
          </div>
        )}

        {/* Section breakdown */}
        <div class="mb-4">
          <h3 class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium mb-2">Section breakdown</h3>
          <div class="border border-[#E5E0D8] rounded-sm overflow-hidden">
            {sections.map((s, i) => (
              <div key={s.section} class={`flex items-center justify-between px-4 py-3 bg-white ${i < sections.length - 1 ? 'border-b border-[#E5E0D8]' : ''}`}>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-black truncate">{s.section.replace(/-/g, ' ')}</p>
                  <div class="mt-1 h-1 bg-[#E5E0D8] rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      style={{
                        width: `${s.pct}%`,
                        background: s.pct >= exam.passingScore ? '#2d8a4e' : s.pct >= exam.passingScore - 10 ? B.bronze : '#000',
                      }}
                    />
                  </div>
                </div>
                <span class="text-sm font-medium text-black ml-3 shrink-0">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Share */}
        <button
          onClick={async () => {
            const shareResults = answers.map((a) => ({ correct: a.correct }));
            const text = generateShareString(shareResults, {
              mode: 'exam',
              title: exam.name,
              examScore: pct,
              examPassed: passed,
              duration,
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
          <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-black text-white text-sm rounded-sm shadow-lg" style="animation: fadeIn 0.2s ease-in">
            Copied to clipboard
          </div>
        )}

        {/* Actions */}
        <div class="flex gap-3">
          <button
            onClick={() => { setPhase('select'); }}
            class="flex-1 py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => { setPhase('confirm'); }}
            class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors"
          >
            Retake →
          </button>
        </div>
      </div>
    );
  }

  // ─── RUNNING ────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  const progress = Math.round(((idx + 1) / questions.length) * 100);
  const fiveMinLeft = timeLeft <= 300;

  return (
    <div class="max-w-lg mx-auto px-4 py-4">
      {/* Timer bar */}
      <div class={`flex items-center justify-between mb-2 px-1 py-1.5 rounded-sm ${fiveMinLeft ? 'bg-amber-50' : ''}`}>
        <span class="text-xs text-[#6b6560]">{idx + 1} / {questions.length}</span>
        <span class={`text-xs font-mono font-medium ${fiveMinLeft ? 'text-amber-700' : 'text-black'}`}>
          {fmtTime(timeLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
        <div class="bg-[#8F5A39] h-0.5 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div class="bg-white border border-[#E5E0D8] rounded-sm p-5 mb-3">
        <div class="flex items-center gap-2 mb-3">
          <span class={`text-xs px-2 py-0.5 rounded-sm font-medium border ${
            currentQ.difficulty === 'hard' ? 'border-black text-black bg-black/5' :
            currentQ.difficulty === 'medium' ? 'border-[#8F5A39] text-[#8F5A39] bg-[#F4EFE7]' :
            'border-[#E5E0D8] text-[#6b6560] bg-[#F4EFE7]'
          }`}>{currentQ.difficulty}</span>
          <span class="text-xs text-[#6b6560]">{(currentQ.section || currentQ.subtopic || '').replace(/-/g, ' ')}</span>
        </div>
        <p class="text-black leading-relaxed text-[15px]">{currentQ.stem}</p>
      </div>

      {/* Choices */}
      <div class="space-y-2 mb-3">
        {currentQ.choices.map((c) => {
          const isSelected = selected === c.label;
          let containerClass = 'border-[#E5E0D8] bg-white hover:border-[#8F5A39] hover:bg-[#F4EFE7]';
          let labelClass = 'bg-[#F4EFE7] text-[#6b6560]';
          if (isSelected) {
            containerClass = 'border-black bg-white shadow-sm';
            labelClass = 'bg-black text-white';
          }
          return (
            <button
              key={c.label}
              onClick={() => handleSelect(c.label)}
              class={`w-full p-4 rounded-sm border text-left transition-all active:scale-[0.99] ${containerClass}`}
            >
              <div class="flex items-start gap-3">
                <span class={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${labelClass}`}>{c.label}</span>
                <span class="text-black text-sm leading-relaxed flex-1">{c.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selected}
        class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] disabled:bg-[#E5E0D8] disabled:text-[#6b6560] text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm transition-colors"
      >
        {idx + 1 >= questions.length ? 'Finish exam' : 'Next question'}
      </button>

      <p class="text-center text-xs text-[#6b6560]/50 mt-3 hidden sm:block">
        1-4 to select · Enter to submit
      </p>
    </div>
  );
}
