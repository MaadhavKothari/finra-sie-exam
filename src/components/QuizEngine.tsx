import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress, $streak, $level, $xp, $dailyProgress, $accuracy, recordAnswer, xpToNextLevel } from '../stores/progress';
import type { Question } from '../lib/types';
import StoryCard, { type Story } from './StoryCard';

// JPMC brand tokens
const B = {
  bronze:     '#8F5A39',
  travertine: '#F4EFE7',
  border:     '#E5E0D8',
  muted:      '#6b6560',
  sky:        '#A6D7F0',
};

interface Props {
  questions: Question[];
  topic: string;
  topicName: string;
  examSlug?: string;
  backUrl?: string;
  /** Map of storyId -> Story. Questions reference stories by id via relatedStories[]. */
  stories?: Record<string, Story>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizEngine({ questions: allQuestions, topic, topicName, backUrl, stories = {} }: Props) {
  const [mode, setMode] = useState<'menu' | 'quiz' | 'review' | 'results'>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ qId: string; selected: string; correct: string; isCorrect: boolean }[]>([]);
  const [quizLength, setQuizLength] = useState(10);
  const [xpPopup, setXpPopup] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  const [streakPopup, setStreakPopup] = useState<{ count: number; show: boolean }>({ count: 0, show: false });
  const [levelUpPopup, setLevelUpPopup] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const questionStartTime = useRef(Date.now());

  const streak = useStore($streak);
  const level = useStore($level);
  const xp = useStore($xp);
  const daily = useStore($dailyProgress);
  const accuracy = useStore($accuracy);

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? Math.round(((currentIndex + (revealed ? 1 : 0)) / questions.length) * 100) : 0;

  const startQuiz = (length: number) => {
    const shuffled = shuffle(allQuestions).slice(0, Math.min(length, allQuestions.length));
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setSessionResults([]);
    setMode('quiz');
    questionStartTime.current = Date.now();
  };

  const handleSelect = (label: string) => {
    if (revealed) return;
    setSelected(label);
  };

  const handleSubmit = () => {
    if (!selected || !currentQ) return;
    const isCorrect = selected === currentQ.correctAnswer;
    setRevealed(true);

    const result = recordAnswer(isCorrect, currentQ.difficulty, {
      topic: currentQ.topic,
      section: currentQ.section,
    });

    setXpPopup({ amount: result.earnedXp, show: true });
    setTimeout(() => setXpPopup((p) => ({ ...p, show: false })), 1200);

    if (isCorrect && result.newStreak > 0 && result.newStreak % 3 === 0) {
      setStreakPopup({ count: result.newStreak, show: true });
      setTimeout(() => setStreakPopup((p) => ({ ...p, show: false })), 1800);
    }

    if (result.leveledUp) {
      setTimeout(() => setLevelUpPopup(true), 600);
      setTimeout(() => setLevelUpPopup(false), 3000);
    }

    if (!isCorrect) {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }

    setSessionResults((prev) => [
      ...prev,
      { qId: currentQ.id, selected, correct: currentQ.correctAnswer, isCorrect },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setMode('results');
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    questionStartTime.current = Date.now();
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (mode !== 'quiz' || !currentQ) return;
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

  // ─── MENU ────────────────────────────────────────────────────────────────
  if (mode === 'menu') {
    const lvl = xpToNextLevel(xp, level);
    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        {backUrl && (
          <a href={backUrl} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
            ← Back
          </a>
        )}

        {/* Stats header */}
        <div class="bg-black text-white rounded-sm p-5 mb-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="text-xs uppercase tracking-[0.12em] text-white/50 mb-0.5">Level {level}</div>
              <div style="font-family: var(--font-display);" class="text-2xl">{xp} XP</div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-semibold">{streak}</div>
              <div class="text-xs text-white/50 uppercase tracking-wider">streak</div>
            </div>
          </div>
          <div class="w-full bg-white/10 rounded-full h-1.5 mb-1">
            <div
              class="bg-[#8F5A39] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${lvl.percent}%` }}
            />
          </div>
          <div class="text-xs text-white/40">{lvl.current}/{lvl.needed} XP to Level {level + 1}</div>
        </div>

        {/* Daily goal */}
        <div class="bg-[#F4EFE7] rounded-sm p-4 mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs uppercase tracking-[0.12em] text-[#6b6560] font-medium">Daily goal</span>
            <span class="text-xs text-[#6b6560]">{daily.answered}/{daily.goal}</span>
          </div>
          <div class="w-full bg-[#E5E0D8] rounded-full h-1.5">
            <div
              class="bg-[#8F5A39] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(daily.percent, 100)}%` }}
            />
          </div>
          {daily.percent >= 100 && (
            <div class="text-xs text-[#8F5A39] font-medium mt-1.5">Goal complete — keep going for bonus XP</div>
          )}
        </div>

        {/* Quick stats */}
        <div class="grid grid-cols-3 gap-px border border-[#E5E0D8] rounded-sm overflow-hidden mb-4">
          {[
            { label: 'Accuracy', value: `${accuracy}%` },
            { label: 'Answered', value: String($progress.get().totalAnswered) },
            { label: 'Best streak', value: String($progress.get().bestStreak) },
          ].map(({ label, value }) => (
            <div class="bg-white px-3 py-3 text-center">
              <div style="font-family: var(--font-display);" class="text-xl text-black">{value}</div>
              <div class="text-xs text-[#6b6560] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Topic + start */}
        <div class="border border-[#E5E0D8] rounded-sm p-5">
          <h2 style="font-family: var(--font-display);" class="text-lg text-black mb-0.5">{topicName}</h2>
          <p class="text-xs text-[#6b6560] mb-4">{allQuestions.length} questions available</p>

          <div class="flex gap-2 mb-4">
            {[5, 10, 20].map((n) => (
              <button
                key={n}
                onClick={() => setQuizLength(n)}
                class={`flex-1 py-2.5 rounded-sm text-sm font-medium transition-colors border ${
                  quizLength === n
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-[#6b6560] border-[#E5E0D8] hover:border-black hover:text-black'
                }`}
              >
                {n}Q
              </button>
            ))}
          </div>

          <button
            onClick={() => startQuiz(quizLength)}
            class="w-full py-4 bg-[#8F5A39] hover:bg-[#7a4d31] text-white font-medium rounded-sm text-sm uppercase tracking-[0.1em] transition-colors active:scale-[0.99]"
          >
            Start practice →
          </button>
        </div>
      </div>
    );
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────
  if (mode === 'results') {
    const correct = sessionResults.filter((r) => r.isCorrect).length;
    const total = sessionResults.length;
    const pct = Math.round((correct / total) * 100);
    const passed = pct >= 70;

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <div class="border border-[#E5E0D8] rounded-sm p-6 mb-4">
          {/* Score */}
          <div class="text-center mb-6">
            <div style="font-family: var(--font-display);" class="text-6xl text-black mb-1">{pct}%</div>
            <div class="text-sm text-[#6b6560]">{correct} of {total} correct</div>
          </div>

          {/* Score ring */}
          <div class="relative w-28 h-28 mx-auto mb-6">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke={B.border} stroke-width="7" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={passed ? B.bronze : '#000000'}
                stroke-width="7"
                stroke-linecap="butt"
                stroke-dasharray={`${pct * 2.64} 264`}
                class="transition-all duration-1000"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-sm font-semibold text-black">{passed ? 'PASS' : 'REVIEW'}</span>
            </div>
          </div>

          {/* Correct / Missed */}
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-[#F4EFE7] rounded-sm p-3 text-center">
              <div style="font-family: var(--font-display);" class="text-2xl text-[#8F5A39]">{correct}</div>
              <div class="text-xs text-[#6b6560]">Correct</div>
            </div>
            <div class="bg-black rounded-sm p-3 text-center">
              <div style="font-family: var(--font-display);" class="text-2xl text-white">{total - correct}</div>
              <div class="text-xs text-white/50">Missed</div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            onClick={() => { setMode('review'); setCurrentIndex(0); setRevealed(true); }}
            class="flex-1 py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm transition-colors"
          >
            Review answers
          </button>
          <button
            onClick={() => startQuiz(quizLength)}
            class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors"
          >
            Play again →
          </button>
        </div>

        <button
          onClick={() => setMode('menu')}
          class="w-full mt-3 py-2.5 text-[#6b6560] text-xs uppercase tracking-[0.1em] hover:text-black transition-colors"
        >
          Back to menu
        </button>
      </div>
    );
  }

  // ─── REVIEW ──────────────────────────────────────────────────────────────
  if (mode === 'review' && currentQ) {
    const result = sessionResults[currentIndex];
    return (
      <div class="max-w-lg mx-auto px-4 py-4">
        <div class="flex items-center justify-between mb-4">
          <button onClick={() => setMode('results')} class="text-xs uppercase tracking-[0.1em] text-[#8F5A39] hover:text-black transition-colors font-medium">
            ← Results
          </button>
          <span class="text-xs text-[#6b6560]">{currentIndex + 1} / {questions.length}</span>
        </div>

        <div class="border border-[#E5E0D8] rounded-sm p-5 mb-3">
          <div class="flex items-center gap-2 mb-3">
            <span class={`text-xs px-2 py-0.5 rounded-sm font-medium border ${
              currentQ.difficulty === 'hard'   ? 'border-black text-black bg-black/5' :
              currentQ.difficulty === 'medium' ? 'border-[#8F5A39] text-[#8F5A39] bg-[#F4EFE7]' :
                                                 'border-[#E5E0D8] text-[#6b6560] bg-[#F4EFE7]'
            }`}>{currentQ.difficulty}</span>
            {result && (
              <span class={`text-xs px-2 py-0.5 rounded-sm font-medium ${
                result.isCorrect ? 'bg-[#F4EFE7] text-[#8F5A39]' : 'bg-black text-white'
              }`}>
                {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            )}
          </div>
          <p class="text-black leading-relaxed text-sm">{currentQ.stem}</p>
        </div>

        <div class="space-y-2 mb-3">
          {currentQ.choices.map((c) => {
            const isCorrectChoice = c.label === currentQ.correctAnswer;
            const wasSelected = result && c.label === result.selected;
            return (
              <div
                key={c.label}
                class={`p-4 rounded-sm border transition-all ${
                  isCorrectChoice           ? 'border-[#8F5A39] bg-[#F4EFE7]' :
                  wasSelected && !isCorrectChoice ? 'border-black bg-black/5' :
                                              'border-[#E5E0D8] bg-white'
                }`}
              >
                <div class="flex items-start gap-3">
                  <span class={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 ${
                    isCorrectChoice ? 'bg-[#8F5A39] text-white' :
                    wasSelected     ? 'bg-black text-white' :
                                      'bg-[#F4EFE7] text-[#6b6560]'
                  }`}>{c.label}</span>
                  <div class="flex-1">
                    <p class="text-black text-sm">{c.text}</p>
                    <p class={`text-xs mt-1.5 leading-relaxed ${isCorrectChoice ? 'text-[#8F5A39]' : 'text-[#6b6560]'}`}>
                      {c.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-3">
          <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
          {currentQ.regulatoryBasis && (
            <p class="text-xs text-[#8F5A39] mt-2 font-medium">{currentQ.regulatoryBasis}</p>
          )}
        </div>

        {/* Related story cards */}
        {currentQ.relatedStories && currentQ.relatedStories.length > 0 && (
          <div class="space-y-2 mb-4">
            {currentQ.relatedStories
              .map((sid) => stories[sid])
              .filter((s): s is Story => Boolean(s))
              .map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
          </div>
        )}

        <div class="flex gap-3">
          <button
            onClick={() => { if (currentIndex > 0) setCurrentIndex((i) => i - 1); }}
            disabled={currentIndex === 0}
            class="flex-1 py-3.5 border border-[#E5E0D8] hover:border-black text-black text-sm font-medium rounded-sm disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (currentIndex + 1 >= questions.length) setMode('results');
              else setCurrentIndex((i) => i + 1);
            }}
            class="flex-1 py-3.5 bg-[#8F5A39] hover:bg-[#7a4d31] text-white text-sm font-medium rounded-sm transition-colors"
          >
            {currentIndex + 1 >= questions.length ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    );
  }

  // ─── QUIZ ─────────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <div class="max-w-lg mx-auto px-4 py-4 relative">
      {/* XP popup */}
      {xpPopup.show && (
        <div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div class="bg-[#8F5A39] text-white font-semibold px-4 py-2 rounded-sm text-sm">
            +{xpPopup.amount} XP
          </div>
        </div>
      )}

      {/* Streak popup */}
      {streakPopup.show && (
        <div class="fixed top-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div class="bg-black text-white font-semibold px-5 py-2.5 rounded-sm text-sm">
            {streakPopup.count} streak
          </div>
        </div>
      )}

      {/* Level up popup */}
      {levelUpPopup && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div class="bg-white rounded-sm p-8 text-center mx-4 border border-[#E5E0D8]">
            <div style="font-family: var(--font-display);" class="text-3xl text-black mb-2">Level up</div>
            <div class="text-sm text-[#6b6560]">You reached Level {level}</div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div class="flex items-center justify-between mb-3">
        <button
          onClick={() => setMode('menu')}
          class="text-xs uppercase tracking-[0.1em] text-[#6b6560] hover:text-black transition-colors"
        >
          Quit
        </button>
        <div class="flex items-center gap-4">
          <span class="text-xs text-[#6b6560]">
            streak <span class={`font-semibold ${streak >= 3 ? 'text-[#8F5A39]' : 'text-black'}`}>{streak}</span>
          </span>
          <span class="text-xs text-[#6b6560]">{currentIndex + 1} / {questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div class="w-full bg-[#E5E0D8] h-0.5 mb-5">
        <div
          class="bg-[#8F5A39] h-0.5 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div class={`bg-white border border-[#E5E0D8] rounded-sm p-5 mb-3 transition-transform ${shakeWrong ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
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
                <span class={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${labelClass}`}>
                  {c.label}
                </span>
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

      {/* Explanation after reveal */}
      {revealed && (
        <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm p-4 mb-3" style="animation: fadeIn 0.3s ease-in">
          <p class="text-sm text-black leading-relaxed">{currentQ.explanation}</p>
          {currentQ.regulatoryBasis && (
            <p class="text-xs text-[#8F5A39] mt-2 font-medium">{currentQ.regulatoryBasis}</p>
          )}
        </div>
      )}

      {/* Related story cards */}
      {revealed && currentQ.relatedStories && currentQ.relatedStories.length > 0 && (
        <div class="space-y-2 mb-3">
          {currentQ.relatedStories
            .map((sid) => stories[sid])
            .filter((s): s is Story => Boolean(s))
            .map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
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
          {currentIndex + 1 >= questions.length ? 'See results →' : 'Next question →'}
        </button>
      )}

      {/* Keyboard hints */}
      <p class="text-center text-xs text-[#6b6560]/50 mt-3 hidden sm:block">
        1–4 to select · Enter to submit · N for next
      </p>
    </div>
  );
}
