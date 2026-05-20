import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress, $streak, $level, $xp, $dailyProgress, $accuracy, recordAnswer, xpToNextLevel } from '../stores/progress';
import type { Question } from '../lib/types';

interface Props {
  questions: Question[];
  topic: string;
  topicName: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizEngine({ questions: allQuestions, topic, topicName }: Props) {
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

    const result = recordAnswer(isCorrect, currentQ.difficulty);

    // XP popup
    setXpPopup({ amount: result.earnedXp, show: true });
    setTimeout(() => setXpPopup((p) => ({ ...p, show: false })), 1200);

    // Streak popup on milestones
    if (isCorrect && result.newStreak > 0 && result.newStreak % 3 === 0) {
      setStreakPopup({ count: result.newStreak, show: true });
      setTimeout(() => setStreakPopup((p) => ({ ...p, show: false })), 1800);
    }

    // Level up
    if (result.leveledUp) {
      setTimeout(() => setLevelUpPopup(true), 600);
      setTimeout(() => setLevelUpPopup(false), 3000);
    }

    // Wrong answer shake
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

  // --- MENU ---
  if (mode === 'menu') {
    const lvl = xpToNextLevel(xp, level);
    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        {/* Stats header */}
        <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white mb-6 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="text-xs uppercase tracking-wider opacity-80">Level {level}</div>
              <div class="text-2xl font-bold">{xp} XP</div>
            </div>
            <div class="text-right">
              <div class="flex items-center gap-1">
                <span class="text-2xl">🔥</span>
                <span class="text-2xl font-bold">{streak}</span>
              </div>
              <div class="text-xs opacity-80">streak</div>
            </div>
          </div>
          {/* XP bar */}
          <div class="w-full bg-white/20 rounded-full h-2.5 mb-1">
            <div
              class="bg-yellow-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${lvl.percent}%` }}
            />
          </div>
          <div class="text-xs opacity-70">{lvl.current}/{lvl.needed} XP to Level {level + 1}</div>
        </div>

        {/* Daily goal */}
        <div class="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Daily Goal</span>
            <span class="text-sm text-gray-500">{daily.answered}/{daily.goal}</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-3">
            <div
              class={`h-3 rounded-full transition-all duration-500 ${daily.percent >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${daily.percent}%` }}
            />
          </div>
          {daily.percent >= 100 && (
            <div class="text-xs text-green-600 font-medium mt-1">Goal complete! Keep going for bonus XP</div>
          )}
        </div>

        {/* Quick stats */}
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
            <div class="text-xl font-bold text-gray-900">{accuracy}%</div>
            <div class="text-xs text-gray-500">Accuracy</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
            <div class="text-xl font-bold text-gray-900">{$progress.get().totalAnswered}</div>
            <div class="text-xs text-gray-500">Answered</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
            <div class="text-xl font-bold text-gray-900">🔥 {$progress.get().bestStreak}</div>
            <div class="text-xs text-gray-500">Best Streak</div>
          </div>
        </div>

        {/* Topic + start */}
        <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 mb-1">{topicName}</h2>
          <p class="text-sm text-gray-500 mb-4">{allQuestions.length} questions available</p>

          <div class="flex gap-2 mb-4">
            {[5, 10, 20].map((n) => (
              <button
                key={n}
                onClick={() => setQuizLength(n)}
                class={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  quizLength === n
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}Q
              </button>
            ))}
          </div>

          <button
            onClick={() => startQuiz(quizLength)}
            class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-indigo-200"
          >
            Start Practice
          </button>
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (mode === 'results') {
    const correct = sessionResults.filter((r) => r.isCorrect).length;
    const total = sessionResults.length;
    const pct = Math.round((correct / total) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎯' : pct >= 50 ? '💪' : '📚';

    return (
      <div class="max-w-lg mx-auto px-4 py-6">
        <div class="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm mb-6">
          <div class="text-6xl mb-3">{emoji}</div>
          <div class="text-3xl font-bold text-gray-900 mb-1">{pct}%</div>
          <div class="text-gray-500 mb-4">{correct}/{total} correct</div>

          {/* Score ring */}
          <div class="relative w-32 h-32 mx-auto mb-4">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" stroke-width="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={pct >= 70 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444'}
                stroke-width="8"
                stroke-linecap="round"
                stroke-dasharray={`${pct * 2.64} 264`}
                class="transition-all duration-1000"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class={`text-lg font-bold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {pct >= 70 ? 'PASS' : 'REVIEW'}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-green-50 rounded-lg p-3">
              <div class="text-green-700 font-bold text-lg">{correct}</div>
              <div class="text-green-600">Correct</div>
            </div>
            <div class="bg-red-50 rounded-lg p-3">
              <div class="text-red-700 font-bold text-lg">{total - correct}</div>
              <div class="text-red-600">Missed</div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            onClick={() => {
              setMode('review');
              setCurrentIndex(0);
              setRevealed(true);
            }}
            class="flex-1 py-3.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            Review Answers
          </button>
          <button
            onClick={() => startQuiz(quizLength)}
            class="flex-1 py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            Play Again
          </button>
        </div>

        <button
          onClick={() => setMode('menu')}
          class="w-full mt-3 py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  // --- REVIEW MODE ---
  if (mode === 'review' && currentQ) {
    const result = sessionResults[currentIndex];
    return (
      <div class="max-w-lg mx-auto px-4 py-4">
        <div class="flex items-center justify-between mb-4">
          <button onClick={() => setMode('results')} class="text-sm text-indigo-600 font-medium">
            ← Results
          </button>
          <span class="text-sm text-gray-500">{currentIndex + 1}/{questions.length}</span>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4">
          <div class="flex items-center gap-2 mb-3">
            <span class={`text-xs px-2 py-0.5 rounded-full font-medium ${
              currentQ.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
              currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>{currentQ.difficulty}</span>
            {result && (
              <span class={`text-xs px-2 py-0.5 rounded-full font-medium ${result.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            )}
          </div>
          <p class="text-gray-900 font-medium leading-relaxed">{currentQ.stem}</p>
        </div>

        <div class="space-y-2.5 mb-4">
          {currentQ.choices.map((c) => {
            const isCorrectChoice = c.label === currentQ.correctAnswer;
            const wasSelected = result && c.label === result.selected;
            return (
              <div
                key={c.label}
                class={`p-4 rounded-xl border-2 transition-all ${
                  isCorrectChoice
                    ? 'border-green-400 bg-green-50'
                    : wasSelected && !isCorrectChoice
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div class="flex items-start gap-3">
                  <span class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isCorrectChoice ? 'bg-green-500 text-white' :
                    wasSelected ? 'bg-red-500 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>{c.label}</span>
                  <div class="flex-1">
                    <p class="text-gray-900 text-sm">{c.text}</p>
                    <p class={`text-xs mt-1.5 leading-relaxed ${isCorrectChoice ? 'text-green-700' : 'text-gray-500'}`}>
                      {c.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall explanation */}
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p class="text-sm text-blue-800 leading-relaxed">{currentQ.explanation}</p>
          {currentQ.regulatoryBasis && (
            <p class="text-xs text-blue-600 mt-2 font-medium">📖 {currentQ.regulatoryBasis}</p>
          )}
        </div>

        <div class="flex gap-3">
          <button
            onClick={() => { if (currentIndex > 0) setCurrentIndex((i) => i - 1); }}
            disabled={currentIndex === 0}
            class="flex-1 py-3.5 bg-gray-100 text-gray-700 font-medium rounded-xl disabled:opacity-30 transition-all"
          >
            Previous
          </button>
          <button
            onClick={() => {
              if (currentIndex + 1 >= questions.length) setMode('results');
              else setCurrentIndex((i) => i + 1);
            }}
            class="flex-1 py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            {currentIndex + 1 >= questions.length ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // --- QUIZ MODE ---
  if (!currentQ) return null;

  return (
    <div class="max-w-lg mx-auto px-4 py-4 relative">
      {/* XP popup */}
      {xpPopup.show && (
        <div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div class="bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-full shadow-lg text-sm">
            +{xpPopup.amount} XP
          </div>
        </div>
      )}

      {/* Streak popup */}
      {streakPopup.show && (
        <div class="fixed top-32 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div class="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-full shadow-lg text-lg">
            🔥 {streakPopup.count} Streak!
          </div>
        </div>
      )}

      {/* Level up popup */}
      {levelUpPopup && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div class="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce mx-4">
            <div class="text-5xl mb-3">🎉</div>
            <div class="text-2xl font-bold text-indigo-600">Level Up!</div>
            <div class="text-gray-500 mt-1">You reached Level {level}</div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div class="flex items-center justify-between mb-3">
        <button
          onClick={() => setMode('menu')}
          class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕ Quit
        </button>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 text-sm">
            <span>🔥</span>
            <span class={`font-bold ${streak >= 3 ? 'text-orange-500' : 'text-gray-500'}`}>{streak}</span>
          </div>
          <span class="text-sm text-gray-400">{currentIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div class="w-full bg-gray-100 rounded-full h-2 mb-5">
        <div
          class="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div class={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4 transition-transform ${shakeWrong ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div class="flex items-center gap-2 mb-3">
          <span class={`text-xs px-2 py-0.5 rounded-full font-medium ${
            currentQ.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
            currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>{currentQ.difficulty}</span>
          <span class="text-xs text-gray-400">{currentQ.subtopic.replace(/-/g, ' ')}</span>
        </div>
        <p class="text-gray-900 font-medium leading-relaxed text-[15px]">{currentQ.stem}</p>
      </div>

      {/* Answer choices */}
      <div class="space-y-2.5 mb-4">
        {currentQ.choices.map((c) => {
          const isSelected = selected === c.label;
          const isCorrectChoice = c.label === currentQ.correctAnswer;
          let style = 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50';
          if (revealed) {
            if (isCorrectChoice) style = 'border-green-400 bg-green-50';
            else if (isSelected) style = 'border-red-400 bg-red-50';
            else style = 'border-gray-200 bg-gray-50 opacity-60';
          } else if (isSelected) {
            style = 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100';
          }

          return (
            <button
              key={c.label}
              onClick={() => handleSelect(c.label)}
              disabled={revealed}
              class={`w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${style}`}
            >
              <div class="flex items-start gap-3">
                <span class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                  revealed && isCorrectChoice ? 'bg-green-500 text-white' :
                  revealed && isSelected ? 'bg-red-500 text-white' :
                  isSelected ? 'bg-indigo-600 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>{c.label}</span>
                <span class="text-gray-900 text-sm leading-relaxed flex-1">{c.text}</span>
              </div>
              {revealed && (
                <p class={`text-xs mt-2.5 ml-11 leading-relaxed ${isCorrectChoice ? 'text-green-700' : 'text-gray-500'}`}>
                  {c.explanation}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation after reveal */}
      {revealed && (
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 animate-[fadeIn_0.3s_ease-in]">
          <p class="text-sm text-blue-800 leading-relaxed">{currentQ.explanation}</p>
          {currentQ.regulatoryBasis && (
            <p class="text-xs text-blue-600 mt-2 font-medium">📖 {currentQ.regulatoryBasis}</p>
          )}
        </div>
      )}

      {/* Action button */}
      {!revealed ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl text-lg transition-all active:scale-[0.98] shadow-lg shadow-indigo-200 disabled:shadow-none"
        >
          Check Answer
        </button>
      ) : (
        <button
          onClick={handleNext}
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-lg transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
        >
          {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question →'}
        </button>
      )}

      {/* Keyboard hints (desktop) */}
      <p class="text-center text-xs text-gray-300 mt-3 hidden sm:block">
        Press 1-4 to select · Enter to submit · N for next
      </p>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
