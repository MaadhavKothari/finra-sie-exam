import { persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';
import { titleForXp, xpToNextTitle, SECRET_TITLES, isCalcQuestion, isInsiderQuestion } from '../lib/titles';
import { getMultiplierForDate } from '../lib/greedIndex';

const today = () => new Date().toISOString().split('T')[0];

// Lazy sound trigger — avoid a static cycle through the sound module.
function playSecretSound(id: string) {
  if (typeof window === 'undefined') return;
  import('../lib/sounds').then((m) => {
    switch (id) {
      case 'diamond-hands': m.soundDiamondHands?.(); break;
      case 'the-insider':   m.soundInsider?.(); break;
      case 'mr-market':     m.soundMrMarket?.(); break;
      case 'cold-streak':
      case 'first-bell':
      case 'bond-whisperer':
      case 'the-quant':
      case 'the-whistleblower':
        m.soundPromotion?.();
        break;
    }
  }).catch(() => {});
}

// Fire-and-forget notification reschedule. Lazy-imported to avoid a static cycle
// (notifications.ts imports $progress). No-op on web — guard lives inside the module.
let _notifyScheduled = false;
function scheduleNotifyReschedule() {
  if (typeof window === 'undefined') return;
  if (_notifyScheduled) return;
  _notifyScheduled = true;
  queueMicrotask(() => {
    _notifyScheduled = false;
    import('../lib/notifications').then((m) => m.rescheduleFireForget()).catch(() => {});
  });
}

export const $progress = persistentMap<{
  totalAnswered: string;
  totalCorrect: string;
  streak: string;
  bestStreak: string;
  xp: string;
  level: string;
  lastStudied: string;
  dailyGoal: string;
  dailyAnswered: string;
  dailyDate: string;
  // M5 — Trader ID
  activeTitle: string;            // override id; empty = auto from XP
  earnedTitles: string;           // JSON array of secret title ids
  hardStreak: string;             // consecutive hard-Q correct
  debtCorrect: string;            // Series 7 debt-securities correct counter
  // M2 — Streak Vault
  freezeCount: string;
  freezeEarnedDate: string;       // ISO date of last freeze grant
  lastFreezeWeek: string;         // ISO week key (YYYY-Www)
  streakStartDate: string;        // ISO date current streak began
  streakHistory: string;          // JSON array of {startDate,endDate,length}
  studyDays: string;              // JSON array of last 7 ISO dates studied
  pendingReopen: string;          // '1' if Markets Reopen modal should show
  // M1 — Opening Bell
  bellHistory: string;            // JSON array of {date,score}
  bellRunCurrent: string;
  bellRunBest: string;
  bellLastDate: string;           // ISO date last bell taken
  // M7 — Exam Sim
  examHistory: string;            // JSON array of {date,examId,score,total,passed,duration}
  // M8 — Dashboard
  activityLog: string;            // JSON object mapping YYYY-MM-DD to question count
  // M10 — Easter-egg counters
  insiderWrongStreak: string;     // consecutive insider Q wrong (resets on correct or non-insider)
  calcCorrect: string;            // running count of calculation-tagged Q correct
}>('sie-progress:', {
  totalAnswered: '0',
  totalCorrect: '0',
  streak: '0',
  bestStreak: '0',
  xp: '0',
  level: '1',
  lastStudied: '',
  dailyGoal: '20',
  dailyAnswered: '0',
  dailyDate: '',
  activeTitle: '',
  earnedTitles: '[]',
  hardStreak: '0',
  debtCorrect: '0',
  freezeCount: '0',
  freezeEarnedDate: '',
  lastFreezeWeek: '',
  streakStartDate: '',
  streakHistory: '[]',
  studyDays: '[]',
  pendingReopen: '',
  bellHistory: '[]',
  bellRunCurrent: '0',
  bellRunBest: '0',
  bellLastDate: '',
  examHistory: '[]',
  activityLog: '{}',
  insiderWrongStreak: '0',
  calcCorrect: '0',
});

export const $xp = computed($progress, (p) => parseInt(p.xp || '0', 10));
export const $level = computed($progress, (p) => parseInt(p.level || '1', 10));
export const $streak = computed($progress, (p) => parseInt(p.streak || '0', 10));
export const $bestStreak = computed($progress, (p) => parseInt(p.bestStreak || '0', 10));
export const $freezeCount = computed($progress, (p) => parseInt(p.freezeCount || '0', 10));

export const $title = computed($progress, (p) => {
  const xp = parseInt(p.xp || '0', 10);
  return titleForXp(xp);
});

export const $titleProgress = computed($progress, (p) => {
  const xp = parseInt(p.xp || '0', 10);
  return xpToNextTitle(xp);
});

export const $earnedTitles = computed($progress, (p) => {
  try { return JSON.parse(p.earnedTitles || '[]') as string[]; }
  catch { return []; }
});

export const $dailyProgress = computed($progress, (p) => {
  const d = p.dailyDate === today() ? parseInt(p.dailyAnswered || '0', 10) : 0;
  const goal = parseInt(p.dailyGoal || '20', 10);
  return { answered: d, goal, percent: Math.min(100, Math.round((d / goal) * 100)) };
});

export const $accuracy = computed($progress, (p) => {
  const total = parseInt(p.totalAnswered || '0', 10);
  const correct = parseInt(p.totalCorrect || '0', 10);
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
});

function xpForAnswer(correct: boolean, difficulty: string, streakCount: number): number {
  const base = correct ? 10 : 2;
  const diffMultiplier = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1.5 : 1;
  const streakBonus = correct ? Math.min(streakCount, 10) : 0;
  return Math.round(base * diffMultiplier + streakBonus);
}

function levelFromXp(xp: number): number {
  let level = 1;
  let xpNeeded = 50;
  let totalNeeded = 0;
  while (totalNeeded + xpNeeded <= xp) {
    totalNeeded += xpNeeded;
    level++;
    xpNeeded = level * 50;
  }
  return level;
}

export function xpToNextLevel(currentXp: number, currentLevel: number): { current: number; needed: number; percent: number } {
  let totalForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) totalForCurrentLevel += i * 50;
  const needed = currentLevel * 50;
  const current = currentXp - totalForCurrentLevel;
  return { current, needed, percent: Math.round((current / needed) * 100) };
}

// ─── ISO week key (YYYY-Www) for freeze cadence ────────────────────────
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  if (!a || !b) return Infinity;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

function pushEarnedTitle(id: string) {
  const cur = (() => {
    try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; }
    catch { return []; }
  })();
  if (!cur.includes(id)) {
    cur.push(id);
    $progress.setKey('earnedTitles', JSON.stringify(cur));
    playSecretSound(id);
  }
}

function recordStudyDay(d: string) {
  let days: string[] = [];
  try { days = JSON.parse($progress.get().studyDays || '[]'); }
  catch { days = []; }
  if (!days.includes(d)) days.push(d);
  // keep only the last 14 (we only need last 7 but keep buffer)
  days.sort();
  if (days.length > 14) days = days.slice(days.length - 14);
  $progress.setKey('studyDays', JSON.stringify(days));
}

function maybeGrantFreeze(d: string) {
  const p = $progress.get();
  const week = isoWeekKey(new Date(d + 'T12:00:00'));
  if (p.lastFreezeWeek === week) return;
  let days: string[] = [];
  try { days = JSON.parse(p.studyDays || '[]'); }
  catch { days = []; }
  // count study days in last 7 calendar days
  const cutoff = new Date(d + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() - 6);
  const within = days.filter((x) => new Date(x + 'T00:00:00') >= cutoff).length;
  if (within >= 4) {
    const cur = parseInt(p.freezeCount || '0', 10);
    const next = Math.min(2, cur + 1);
    if (next !== cur) {
      $progress.setKey('freezeCount', String(next));
      $progress.setKey('freezeEarnedDate', d);
    }
    $progress.setKey('lastFreezeWeek', week);
  }
}

// Public: called by daily-check island on app load.
// Handles streak preservation / freeze consumption / archive on long gap.
export function dailyStreakCheck() {
  const p = $progress.get();
  const d = today();
  if (!p.lastStudied) return;
  const gap = daysBetween(p.lastStudied, d);
  if (gap <= 1) return; // today or yesterday — streak intact
  // gap >= 2 — try freeze
  const freezes = parseInt(p.freezeCount || '0', 10);
  const currentStreak = parseInt(p.streak || '0', 10);
  if (freezes > 0 && currentStreak > 0) {
    // consume one freeze; bump lastStudied to yesterday so today's first answer continues streak
    const yesterday = new Date(d + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().split('T')[0];
    $progress.setKey('freezeCount', String(freezes - 1));
    $progress.setKey('lastStudied', y);
    return { freezeUsed: true };
  }
  // No freeze. Archive current streak.
  if (currentStreak > 0) {
    let history: any[] = [];
    try { history = JSON.parse(p.streakHistory || '[]'); }
    catch { history = []; }
    history.push({
      startDate: p.streakStartDate || p.lastStudied,
      endDate: p.lastStudied,
      length: currentStreak,
    });
    $progress.setKey('streakHistory', JSON.stringify(history));
    $progress.setKey('streak', '0');
    $progress.setKey('streakStartDate', '');
    $progress.setKey('pendingReopen', '1');
    return { archived: true };
  }
  return;
}

export function clearPendingReopen() {
  $progress.setKey('pendingReopen', '');
}

export interface AnswerResult {
  earnedXp: number;
  baseXp: number;
  multiplier: number;
  newStreak: number;
  leveledUp: boolean;
  titleChanged: boolean;
  newSecretTitle?: string;
}

export function recordAnswer(
  correct: boolean,
  difficulty: string,
  opts: { topic?: string; section?: string; stem?: string; subtopic?: string } = {},
): AnswerResult {
  const p = $progress.get();
  const currentStreak = parseInt(p.streak || '0', 10);
  const bestStreak = parseInt(p.bestStreak || '0', 10);
  const currentXp = parseInt(p.xp || '0', 10);
  const previousTitle = titleForXp(currentXp);

  const newStreak = correct ? currentStreak + 1 : 0;
  const baseXp = xpForAnswer(correct, difficulty, newStreak);
  const multiplier = getMultiplierForDate(today());
  const earnedXp = Math.round(baseXp * multiplier);
  const newXp = currentXp + earnedXp;
  const newLevel = levelFromXp(newXp);
  const newTitle = titleForXp(newXp);

  const d = today();
  const dailyAnswered = p.dailyDate === d ? parseInt(p.dailyAnswered || '0', 10) + 1 : 1;

  $progress.setKey('totalAnswered', String(parseInt(p.totalAnswered || '0', 10) + 1));
  if (correct) $progress.setKey('totalCorrect', String(parseInt(p.totalCorrect || '0', 10) + 1));

  // Daily-streak: only bump streak when crossing into a new day.
  if (!p.lastStudied || p.lastStudied !== d) {
    const gap = p.lastStudied ? daysBetween(p.lastStudied, d) : 1;
    if (gap === 1) {
      // continuation
      $progress.setKey('streak', String(currentStreak + 1));
      if (!p.streakStartDate) {
        // first day of a fresh streak — anchor it
        $progress.setKey('streakStartDate', d);
      }
    } else if (gap >= 2) {
      // fresh start (dailyStreakCheck should have run, but be defensive)
      $progress.setKey('streak', '1');
      $progress.setKey('streakStartDate', d);
    } else {
      // gap 0 fallback shouldn't happen
      $progress.setKey('streak', String(currentStreak + 1));
    }
    const updatedStreak = parseInt($progress.get().streak, 10);
    if (updatedStreak > bestStreak) $progress.setKey('bestStreak', String(updatedStreak));
  }

  // The answer-level streak we report is the in-session "consecutive correct" count.
  $progress.setKey('xp', String(newXp));
  $progress.setKey('level', String(newLevel));
  $progress.setKey('lastStudied', d);
  $progress.setKey('dailyAnswered', String(dailyAnswered));
  $progress.setKey('dailyDate', d);

  // Identity sub-tracking
  let newSecret: string | undefined;
  if (correct && difficulty === 'hard') {
    const hs = parseInt(p.hardStreak || '0', 10) + 1;
    $progress.setKey('hardStreak', String(hs));
    if (hs >= 10) {
      const cur = (() => { try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; } catch { return []; } })();
      if (!cur.includes('diamond-hands')) {
        pushEarnedTitle('diamond-hands');
        newSecret = SECRET_TITLES['diamond-hands'].name;
      }
    }
  } else if (!correct) {
    $progress.setKey('hardStreak', '0');
  }
  if (correct && opts.section === 'debt-securities') {
    const dc = parseInt(p.debtCorrect || '0', 10) + 1;
    $progress.setKey('debtCorrect', String(dc));
    if (dc >= 50) {
      const cur = (() => { try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; } catch { return []; } })();
      if (!cur.includes('bond-whisperer')) {
        pushEarnedTitle('bond-whisperer');
        newSecret = newSecret || SECRET_TITLES['bond-whisperer'].name;
      }
    }
  }

  // Activity log for dashboard heatmap
  let actLog: Record<string, number> = {};
  try { actLog = JSON.parse($progress.get().activityLog || '{}'); }
  catch { actLog = {}; }
  actLog[d] = (actLog[d] ?? 0) + 1;
  $progress.setKey('activityLog', JSON.stringify(actLog));

  // Streak-vault bookkeeping
  recordStudyDay(d);
  maybeGrantFreeze(d);

  // 30-day Cold Streak secret title
  const liveStreak = parseInt($progress.get().streak || '0', 10);
  if (liveStreak >= 30) {
    const cur = (() => { try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; } catch { return []; } })();
    if (!cur.includes('cold-streak')) {
      pushEarnedTitle('cold-streak');
      newSecret = newSecret || SECRET_TITLES['cold-streak'].name;
    }
  }

  // ─── M10 Easter eggs ──────────────────────────────────────────────────
  if (opts.stem) {
    // The Insider — wrong on an insider-trading question twice in a row.
    if (isInsiderQuestion(opts.stem, opts.subtopic)) {
      if (!correct) {
        const ws = parseInt(p.insiderWrongStreak || '0', 10) + 1;
        $progress.setKey('insiderWrongStreak', String(ws));
        if (ws >= 2) {
          const cur = (() => { try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; } catch { return []; } })();
          if (!cur.includes('the-insider')) {
            pushEarnedTitle('the-insider');
            newSecret = newSecret || SECRET_TITLES['the-insider'].name;
          }
        }
      } else {
        $progress.setKey('insiderWrongStreak', '0');
      }
    } else if (!correct) {
      // Non-insider wrong answer breaks the streak too (must be consecutive insider wrongs).
      $progress.setKey('insiderWrongStreak', '0');
    }

    // The Quant — 100 calculation questions correct.
    if (correct && isCalcQuestion(opts.stem, opts.subtopic)) {
      const cc = parseInt(p.calcCorrect || '0', 10) + 1;
      $progress.setKey('calcCorrect', String(cc));
      if (cc >= 100) {
        const cur = (() => { try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; } catch { return []; } })();
        if (!cur.includes('the-quant')) {
          pushEarnedTitle('the-quant');
          newSecret = newSecret || SECRET_TITLES['the-quant'].name;
        }
      }
    }
  }

  // Mr. Market — any answer recorded at exactly :30 past the hour.
  if (new Date().getMinutes() === 30) {
    const cur = (() => { try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; } catch { return []; } })();
    if (!cur.includes('mr-market')) {
      pushEarnedTitle('mr-market');
      newSecret = newSecret || SECRET_TITLES['mr-market'].name;
    }
  }

  scheduleNotifyReschedule();

  return {
    earnedXp,
    baseXp,
    multiplier,
    newStreak,
    leveledUp: newLevel > parseInt(p.level || '1', 10),
    titleChanged: previousTitle.id !== newTitle.id,
    newSecretTitle: newSecret,
  };
}

// Public helper used by Opening Bell after running.
export function recordBellResult(date: string, score: number) {
  const p = $progress.get();
  if (p.bellLastDate === date) return; // already recorded today
  let hist: { date: string; score: number }[] = [];
  try { hist = JSON.parse(p.bellHistory || '[]'); }
  catch { hist = []; }
  hist.push({ date, score });
  // keep last 60 entries
  if (hist.length > 60) hist = hist.slice(hist.length - 60);
  $progress.setKey('bellHistory', JSON.stringify(hist));
  $progress.setKey('bellLastDate', date);
  // current run = consecutive days with completed bells (we keep simple: prior + 1 if yesterday)
  const cur = parseInt(p.bellRunCurrent || '0', 10);
  // compute if previous bell was yesterday
  const prev = hist.length >= 2 ? hist[hist.length - 2].date : '';
  let nextRun = 1;
  if (prev) {
    const gap = daysBetween(prev, date);
    nextRun = gap === 1 ? cur + 1 : 1;
  }
  $progress.setKey('bellRunCurrent', String(nextRun));
  const best = parseInt(p.bellRunBest || '0', 10);
  if (nextRun > best) $progress.setKey('bellRunBest', String(nextRun));
  // secret: first-bell title
  if (hist.length === 1) pushEarnedTitle('first-bell');
  scheduleNotifyReschedule();
}

// Public helper used by ExamSim after completion.
export interface ExamHistoryEntry {
  date: string;
  examId: string;
  score: number;
  total: number;
  passed: boolean;
  duration: number; // minutes
}

export function recordExamResult(entry: ExamHistoryEntry) {
  const p = $progress.get();
  let hist: ExamHistoryEntry[] = [];
  try { hist = JSON.parse(p.examHistory || '[]'); }
  catch { hist = []; }
  hist.push(entry);
  if (hist.length > 50) hist = hist.slice(hist.length - 50);
  $progress.setKey('examHistory', JSON.stringify(hist));
}

export function getExamHistory(): ExamHistoryEntry[] {
  try { return JSON.parse($progress.get().examHistory || '[]'); }
  catch { return []; }
}

export function getActivityLog(): Record<string, number> {
  try { return JSON.parse($progress.get().activityLog || '{}'); }
  catch { return {}; }
}
