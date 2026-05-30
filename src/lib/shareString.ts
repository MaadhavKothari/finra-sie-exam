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

// ─── Paste-back parser ───────────────────────────────────────────────────
// Wordle-style "compare with a friend" — parses a share string back into
// structured data so we can render a side-by-side. Tolerates extra
// whitespace and missing tail lines.

export interface ParsedShare {
  mode: 'bell' | 'exam' | 'drill' | 'unknown';
  title?: string;
  date?: string;
  score?: { correct: number; total: number };
  percent?: number;
  durationMin?: number;
  grid: { correct: boolean }[];
  streak?: number;
  traderTitle?: string;
  greedMultiplier?: number;
}

export function parseShareString(input: string): ParsedShare {
  const text = input.replace(/\r/g, '').trim();
  const lines = text.split(/\n+/).map((l) => l.trim());

  let mode: ParsedShare['mode'] = 'unknown';
  if (/Opening Bell/i.test(text)) mode = 'bell';
  else if (/Mock|Exam/i.test(text) && /%/.test(text)) mode = 'exam';
  else if (/FINRA Prep/i.test(text)) mode = 'drill';

  // Title — second line for exam, "Opening Bell" for bell
  let title: string | undefined;
  if (mode === 'exam') {
    const m = lines[0]?.match(/FINRA Prep\s*[—\-]\s*(.+)/i);
    if (m) title = m[1].trim();
  } else if (mode === 'bell') {
    title = 'Opening Bell';
  } else {
    const m = lines[0]?.match(/FINRA Prep\s*[—\-]\s*(.+)/i);
    if (m) title = m[1].trim();
  }

  // Date — try to extract any "MMM DD" token
  let date: string | undefined;
  const dateMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/);
  if (dateMatch) date = dateMatch[0];

  // Score patterns:
  //   "— 4/5"            (bell)
  //   "85% (60/75)"      (exam)
  //   "60/75 correct"    (drill)
  let score: ParsedShare['score'] | undefined;
  let percent: number | undefined;
  const pctMatch = text.match(/(\d{1,3})%\s*\(?(\d+)\s*\/\s*(\d+)\)?/);
  const fracMatch = !pctMatch && text.match(/(\d+)\s*\/\s*(\d+)/);
  if (pctMatch) {
    percent = parseInt(pctMatch[1], 10);
    score = { correct: parseInt(pctMatch[2], 10), total: parseInt(pctMatch[3], 10) };
  } else if (fracMatch) {
    const c = parseInt(fracMatch[1], 10);
    const t = parseInt(fracMatch[2], 10);
    score = { correct: c, total: t };
    if (t > 0) percent = Math.round((c / t) * 100);
  }

  // Duration: "92 min"
  let durationMin: number | undefined;
  const durMatch = text.match(/(\d+)\s*min/i);
  if (durMatch) durationMin = parseInt(durMatch[1], 10);

  // Emoji grid — collect all green/red squares in document order
  const grid: { correct: boolean }[] = [];
  for (const ch of text) {
    if (ch === '\u{1F7E9}') grid.push({ correct: true });
    else if (ch === '\u{1F7E5}') grid.push({ correct: false });
  }

  // Streak / title / greed tail line
  const tail = lines[lines.length - 1] || '';
  let streak: number | undefined;
  const streakMatch = tail.match(/(\d+)-day streak/i);
  if (streakMatch) streak = parseInt(streakMatch[1], 10);
  let greedMultiplier: number | undefined;
  const greedMatch = tail.match(/([\d.]+)x\s*Greed/i);
  if (greedMatch) greedMultiplier = parseFloat(greedMatch[1]);
  let traderTitle: string | undefined;
  // Pick up the rank between "|" separators in the tail line if present.
  const parts = tail.split('|').map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (/Intern|Associate|VP|SVP|MD|Partner/i.test(p)) {
      traderTitle = p;
      break;
    }
  }

  return { mode, title, date, score, percent, durationMin, grid, streak, traderTitle, greedMultiplier };
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
