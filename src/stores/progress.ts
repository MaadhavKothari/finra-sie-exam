import { persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';

const today = () => new Date().toISOString().split('T')[0];

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
});

function num(key: string): number {
  return parseInt($progress.get()[key as keyof typeof $progress.value] || '0', 10);
}

export const $xp = computed($progress, (p) => parseInt(p.xp || '0', 10));
export const $level = computed($progress, (p) => parseInt(p.level || '1', 10));
export const $streak = computed($progress, (p) => parseInt(p.streak || '0', 10));
export const $bestStreak = computed($progress, (p) => parseInt(p.bestStreak || '0', 10));

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
  // Each level needs progressively more XP: level N needs N*50 XP
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

export function recordAnswer(correct: boolean, difficulty: string) {
  const p = $progress.get();
  const currentStreak = parseInt(p.streak || '0', 10);
  const bestStreak = parseInt(p.bestStreak || '0', 10);
  const currentXp = parseInt(p.xp || '0', 10);

  const newStreak = correct ? currentStreak + 1 : 0;
  const earnedXp = xpForAnswer(correct, difficulty, newStreak);
  const newXp = currentXp + earnedXp;
  const newLevel = levelFromXp(newXp);

  const d = today();
  const dailyAnswered = p.dailyDate === d ? parseInt(p.dailyAnswered || '0', 10) + 1 : 1;

  $progress.setKey('totalAnswered', String(parseInt(p.totalAnswered || '0', 10) + 1));
  if (correct) $progress.setKey('totalCorrect', String(parseInt(p.totalCorrect || '0', 10) + 1));
  $progress.setKey('streak', String(newStreak));
  if (newStreak > bestStreak) $progress.setKey('bestStreak', String(newStreak));
  $progress.setKey('xp', String(newXp));
  $progress.setKey('level', String(newLevel));
  $progress.setKey('lastStudied', d);
  $progress.setKey('dailyAnswered', String(dailyAnswered));
  $progress.setKey('dailyDate', d);

  return { earnedXp, newStreak, leveledUp: newLevel > parseInt(p.level || '1', 10) };
}
