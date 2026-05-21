// Wordle-style share string generator.
// Generates a copy-pasteable text artifact from quiz/exam/bell results.

import { titleForXp } from './titles';

export interface ShareResult {
  correct: boolean;
}

export interface ShareMetadata {
  mode: 'bell' | 'drill' | 'exam';
  title?: string;        // exam or topic name
  date?: string;         // ISO date
  streak?: number;
  xp?: number;
  greedMultiplier?: number;
  examScore?: number;    // percent for exam mode
  examPassed?: boolean;
  duration?: number;     // minutes for exam mode
}

function formatDate(iso?: string): string {
  if (!iso) {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function emojiGrid(results: ShareResult[]): string {
  return results.map((r) => r.correct ? '\u{1F7E9}' : '\u{1F7E5}').join('');
}

export function generateShareString(results: ShareResult[], meta: ShareMetadata): string {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const date = formatDate(meta.date);
  const traderTitle = meta.xp != null ? titleForXp(meta.xp).name : '';
  const grid = emojiGrid(results);

  const lines: string[] = [];

  if (meta.mode === 'bell') {
    lines.push(`FINRA Prep \u{1F514} Opening Bell`);
    lines.push(`${date} \u{2014} ${correct}/${total}`);
    lines.push('');
    lines.push(grid);
    lines.push('');
    const parts: string[] = [];
    if (meta.streak && meta.streak > 0) parts.push(`${meta.streak}-day streak`);
    if (traderTitle) parts.push(traderTitle);
    if (meta.greedMultiplier && meta.greedMultiplier !== 1) parts.push(`${meta.greedMultiplier}x Greed`);
    if (parts.length > 0) lines.push(parts.join(' | '));
  } else if (meta.mode === 'exam') {
    lines.push(`FINRA Prep \u{2014} ${meta.title || 'Mock Exam'}`);
    lines.push(`${meta.examScore ?? Math.round((correct / total) * 100)}% (${correct}/${total}) \u{2022} ${meta.duration ?? '?'} min \u{23F1}`);
    lines.push('');
    lines.push(grid);
    lines.push('');
    const parts: string[] = [];
    if (meta.streak && meta.streak > 0) parts.push(`${meta.streak}-day streak`);
    if (traderTitle) parts.push(traderTitle);
    if (parts.length > 0) lines.push(parts.join(' | '));
  } else {
    // drill
    lines.push(`FINRA Prep \u{2014} ${meta.title || 'Drill'}`);
    lines.push(`${correct}/${total} correct`);
    lines.push('');
    lines.push(grid);
    lines.push('');
    const parts: string[] = [];
    if (meta.streak && meta.streak > 0) parts.push(`${meta.streak}-day streak`);
    if (traderTitle) parts.push(traderTitle);
    if (parts.length > 0) lines.push(parts.join(' | '));
  }

  return lines.join('\n');
}

/** Copy text to clipboard with fallback for older browsers. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: hidden textarea
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    document.body.removeChild(ta);
    return ok;
  }
}
