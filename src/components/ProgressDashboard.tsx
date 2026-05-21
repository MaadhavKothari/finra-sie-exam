import { useState, useEffect, useMemo } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  $progress, $xp, $level, $title, $titleProgress,
  $streak, $bestStreak, $dailyProgress, $accuracy,
  $earnedTitles, xpToNextLevel,
  getExamHistory, getActivityLog,
  type ExamHistoryEntry,
} from '../stores/progress';
import { $hotSheetCards, $dueCards, $ringCounts, $totalCards } from '../stores/hotSheet';
import { $learnProgress, type LearnProgressMap } from '../stores/learnState';
import { TITLE_LADDER, SECRET_TITLES, titleForXp, nextTitle } from '../lib/titles';
import { EXAMS, type ExamId } from '../data/exams';

interface Props {
  base: string;
}

// Brand tokens
const B = {
  bronze: '#8F5A39',
  travertine: '#F4EFE7',
  border: '#E5E0D8',
  muted: '#6b6560',
  green: '#2d8a4e',
  amber: '#c9a227',
  red: '#b34040',
};

const RING_COLORS: Record<string, string> = {
  new: '#b87333',
  review: '#c9a227',
  mastered: '#2d8a4e',
};

const todayISO = () => new Date().toISOString().split('T')[0];

// ─── SECTION 1: Overview Header ──────────────────────────────────────────────

function OverviewHeader({ base }: { base: string }) {
  const p = useStore($progress);
  const xp = useStore($xp);
  const level = useStore($level);
  const title = useStore($title);
  const titleProg = useStore($titleProgress);
  const streak = useStore($streak);
  const bestStreak = useStore($bestStreak);
  const daily = useStore($dailyProgress);

  const levelProg = xpToNextLevel(xp, level);
  const nxt = nextTitle(xp);

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-5 mb-4">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0 flex-1">
          <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-1">Trader ID</div>
          <div style="font-family: var(--font-display);" class="text-2xl text-black leading-tight">
            {title.name}
          </div>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-[11px] text-[#6b6560]">{xp.toLocaleString()} XP</span>
            <span class="text-[11px] text-[#6b6560]">Lvl {level}</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0">
          <div class="flex items-center gap-1.5">
            <span class="text-lg leading-none" title="Current streak">&#x1F525;</span>
            <span style="font-family: var(--font-display);" class="text-2xl text-black leading-none">{streak}</span>
          </div>
          <span class="text-[10px] text-[#6b6560]">best {bestStreak}</span>
        </div>
      </div>

      {/* XP to next level */}
      <div class="mb-3">
        <div class="flex items-center justify-between text-[10px] text-[#6b6560] mb-1">
          <span class="uppercase tracking-wider">Level {level} → {level + 1}</span>
          <span>{levelProg.current} / {levelProg.needed} XP</span>
        </div>
        <div class="h-1.5 w-full bg-[#F4EFE7] rounded-full overflow-hidden">
          <div class="h-full bg-[#8F5A39] transition-all duration-500 rounded-full" style={{ width: `${levelProg.percent}%` }} />
        </div>
      </div>

      {/* Title progress */}
      {titleProg && nxt && (
        <div class="mb-3">
          <div class="flex items-center justify-between text-[10px] text-[#6b6560] mb-1">
            <span class="uppercase tracking-wider">{title.name} → {nxt.name}</span>
            <span>{titleProg.current.toLocaleString()} / {titleProg.needed.toLocaleString()} XP</span>
          </div>
          <div class="h-1.5 w-full bg-[#F4EFE7] rounded-full overflow-hidden">
            <div class="h-full bg-black transition-all duration-500 rounded-full" style={{ width: `${titleProg.percent}%` }} />
          </div>
        </div>
      )}

      {/* Daily goal ring */}
      <div class="flex items-center gap-3 pt-2 border-t border-[#E5E0D8]">
        <svg viewBox="0 0 36 36" class="w-10 h-10 shrink-0">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={B.border} stroke-width="3" />
          <circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke={B.bronze}
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray={`${daily.percent} ${100 - daily.percent}`}
            stroke-dashoffset="25"
          />
        </svg>
        <div>
          <div class="text-sm text-black font-medium">{daily.answered} / {daily.goal} today</div>
          <div class="text-[10px] text-[#6b6560]">Daily goal {daily.percent}%</div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION 2: Activity Heatmap ─────────────────────────────────────────────

function ActivityHeatmap() {
  const p = useStore($progress);
  const actLog = useMemo(() => getActivityLog(), [p.activityLog]);
  const streak = useStore($streak);

  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days.push({ date: iso, count: actLog[iso] ?? 0 });
  }

  const activeDays = days.filter((d) => d.count > 0).length;
  const totalQuestions = days.reduce((sum, d) => sum + d.count, 0);

  // 12 weeks x 7 days — fill columns
  const weeks: typeof days[] = [];
  for (let i = 0; i < 12; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  function colorForCount(count: number): string {
    if (count === 0) return 'var(--heatmap-empty, #F4EFE7)';
    if (count <= 10) return 'var(--heatmap-light, rgba(143,90,57,0.25))';
    if (count <= 25) return 'var(--heatmap-medium, rgba(143,90,57,0.55))';
    return 'var(--heatmap-dark, rgba(143,90,57,0.9))';
  }

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 mb-4">
      <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-3">12-week activity</div>
      <div class="flex gap-[3px] justify-center">
        {weeks.map((week, wi) => (
          <div key={wi} class="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} question${day.count !== 1 ? 's' : ''}`}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: colorForCount(day.count),
                  border: day.date === todayISO() ? `1.5px solid ${B.bronze}` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div class="flex items-center justify-between mt-3 text-[10px] text-[#6b6560]">
        <span>{activeDays} active day{activeDays !== 1 ? 's' : ''} · {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}</span>
        <div class="flex items-center gap-1">
          <span>Less</span>
          {[0, 5, 15, 30].map((n) => (
            <div
              key={n}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: colorForCount(n),
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION 3: Exam Readiness Cards ─────────────────────────────────────────

function examAccuracyColor(pct: number): string {
  if (pct >= 80) return B.green;
  if (pct >= 60) return B.amber;
  return B.red;
}

function ExamReadinessCards({ base }: { base: string }) {
  const p = useStore($progress);
  const history = useMemo(() => getExamHistory(), [p.examHistory]);

  if (history.length === 0) return null;

  // Group by examId
  const byExam = new Map<string, ExamHistoryEntry[]>();
  for (const entry of history) {
    const arr = byExam.get(entry.examId) || [];
    arr.push(entry);
    byExam.set(entry.examId, arr);
  }

  return (
    <div class="mb-4">
      <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-3">Exam readiness</div>
      <div class="space-y-3">
        {Array.from(byExam.entries()).map(([examId, entries]) => {
          const exam = EXAMS[examId as ExamId];
          if (!exam) return null;
          const totalQ = entries.reduce((s, e) => s + e.total, 0);
          const totalCorrect = entries.reduce((s, e) => s + e.score, 0);
          const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
          const bestAttempt = entries.reduce((best, e) => {
            const pct = Math.round((e.score / e.total) * 100);
            return pct > best ? pct : best;
          }, 0);
          const predictedScore = Math.round(accuracy * 0.85 + bestAttempt * 0.15);
          const passing = exam.passingScore;
          const readinessColor = examAccuracyColor(predictedScore);

          return (
            <a
              key={examId}
              href={`${base}${exam.slug}`}
              class="block border border-[#E5E0D8] rounded-sm bg-white p-4 no-underline hover:bg-[#F4EFE7] transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
                    style={{ background: exam.iconBg }}
                  >
                    <span class="text-white text-[10px] font-semibold">{exam.name.replace('Series ', 'S')}</span>
                  </div>
                  <div>
                    <div style="font-family: var(--font-display);" class="text-base text-black">{exam.name}</div>
                    <div class="text-[10px] text-[#6b6560]">{entries.length} attempt{entries.length !== 1 ? 's' : ''} · {totalQ}Q answered</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-semibold" style={{ color: readinessColor }}>{predictedScore}%</div>
                  <div class="text-[10px] text-[#6b6560]">predicted</div>
                </div>
              </div>

              {/* Accuracy bar */}
              <div class="mb-2">
                <div class="flex items-center justify-between text-[10px] text-[#6b6560] mb-1">
                  <span>Accuracy</span>
                  <span>{accuracy}%</span>
                </div>
                <div class="h-1.5 w-full bg-[#F4EFE7] rounded-full overflow-hidden relative">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    style={{ width: `${accuracy}%`, background: examAccuracyColor(accuracy) }}
                  />
                  {/* Pass line */}
                  <div
                    class="absolute top-0 h-full"
                    style={{ left: `${passing}%`, width: '1px', background: B.muted, opacity: 0.6 }}
                    title={`${passing}% passing`}
                  />
                </div>
              </div>

              {/* Section mini-bars */}
              <div class="space-y-1">
                {exam.sections.map((section) => {
                  // We don't have per-section breakdown from exam history,
                  // but show section names with weight
                  const weight = Math.round(section.weight * 100);
                  return (
                    <div key={section.id} class="flex items-center gap-2">
                      <span class="text-[10px] text-[#6b6560] truncate flex-1">{section.name}</span>
                      <div class="w-16 h-1 bg-[#F4EFE7] rounded-full overflow-hidden shrink-0">
                        <div
                          class="h-full rounded-full"
                          style={{ width: `${weight}%`, background: B.bronze }}
                        />
                      </div>
                      <span class="text-[9px] text-[#6b6560] w-6 text-right">{weight}%</span>
                    </div>
                  );
                })}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECTION 4: Section Weakness Radar ───────────────────────────────────────

function SectionRadar() {
  const p = useStore($progress);
  const learnMap = useStore($learnProgress);
  const history = useMemo(() => getExamHistory(), [p.examHistory]);

  // Find the most-practiced exam
  const examCounts = new Map<string, number>();
  for (const e of history) {
    examCounts.set(e.examId, (examCounts.get(e.examId) || 0) + 1);
  }
  if (examCounts.size === 0) return null;

  let topExamId = '';
  let topCount = 0;
  for (const [id, count] of examCounts) {
    if (count > topCount) { topExamId = id; topCount = count; }
  }

  const exam = EXAMS[topExamId as ExamId];
  if (!exam || exam.sections.length < 3) return null;

  const sections = exam.sections;
  const n = sections.length;
  const cx = 100, cy = 100, r = 80;

  // Compute per-section mastery from learn state
  const sectionScores: { name: string; score: number }[] = sections.map((sec) => {
    let total = 0;
    let mastered = 0;
    for (const [key, record] of Object.entries(learnMap)) {
      if (key.startsWith(`${topExamId}:${sec.id}:`)) {
        total++;
        if (record.mastered) mastered++;
      }
    }
    // Fallback: use weight as a baseline display
    const score = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { name: sec.name, score };
  });

  const hasData = sectionScores.some((s) => s.score > 0);
  if (!hasData) return null;

  const minScore = Math.min(...sectionScores.map((s) => s.score));
  const weakestIdx = sectionScores.findIndex((s) => s.score === minScore);

  // Compute polygon points
  const points = sectionScores.map((s, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const dist = (s.score / 100) * r;
    return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
  }).join(' ');

  // Grid rings at 25, 50, 75, 100
  const gridRings = [25, 50, 75, 100];

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560]">Section mastery — {exam.name}</div>
      </div>
      <div class="flex justify-center">
        <svg viewBox="0 0 200 200" class="w-full max-w-[280px]">
          {/* Grid */}
          {gridRings.map((pct) => {
            const pts = Array.from({ length: n }, (_, i) => {
              const angle = (2 * Math.PI * i) / n - Math.PI / 2;
              const dist = (pct / 100) * r;
              return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
            }).join(' ');
            return (
              <polygon
                key={pct}
                points={pts}
                fill="none"
                stroke="var(--theme-border, #E5E0D8)"
                stroke-width="0.5"
              />
            );
          })}

          {/* Axis lines */}
          {sectionScores.map((_, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + r * Math.cos(angle)}
                y2={cy + r * Math.sin(angle)}
                stroke="var(--theme-border, #E5E0D8)"
                stroke-width="0.5"
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={points}
            fill={`${B.bronze}22`}
            stroke={B.bronze}
            stroke-width="1.5"
          />

          {/* Data points */}
          {sectionScores.map((s, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const dist = (s.score / 100) * r;
            const isWeakest = i === weakestIdx;
            return (
              <circle
                key={i}
                cx={cx + dist * Math.cos(angle)}
                cy={cy + dist * Math.sin(angle)}
                r={isWeakest ? 4 : 3}
                fill={isWeakest ? B.red : B.bronze}
              />
            );
          })}

          {/* Labels */}
          {sectionScores.map((s, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const lx = cx + (r + 16) * Math.cos(angle);
            const ly = cy + (r + 16) * Math.sin(angle);
            const anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle';
            // Shorten label
            const shortName = s.name.length > 20 ? s.name.slice(0, 18) + '..' : s.name;
            return (
              <text
                key={i}
                x={lx}
                y={ly + 3}
                text-anchor={anchor}
                fill="var(--theme-text-muted, #6b6560)"
                font-size="6"
              >
                {shortName} ({s.score}%)
              </text>
            );
          })}
        </svg>
      </div>
      {sectionScores[weakestIdx] && sectionScores[weakestIdx].score < 100 && (
        <div class="mt-3 text-center">
          <span class="text-xs px-3 py-1 rounded-sm border border-[#b34040]/30 text-[#b34040] bg-[#b34040]/5 font-medium inline-block">
            Focus here: {sectionScores[weakestIdx].name}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── SECTION 5: Hot Sheet Status ─────────────────────────────────────────────

function HotSheetStatus({ base }: { base: string }) {
  const cards = useStore($hotSheetCards);
  const due = useStore($dueCards);
  const rings = useStore($ringCounts);
  const total = useStore($totalCards);

  if (total === 0) return null;

  const pctNew = total > 0 ? Math.round((rings.new / total) * 100) : 0;
  const pctReview = total > 0 ? Math.round((rings.review / total) * 100) : 0;
  const pctMastered = total > 0 ? Math.round((rings.mastered / total) * 100) : 0;

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560]">Hot Sheet</div>
        <a href={`${base}hotsheet`} class="text-[10px] text-[#8F5A39] font-medium no-underline hover:underline">
          Open →
        </a>
      </div>

      <div class="flex items-center gap-4">
        {/* Ring vis */}
        <div class="relative shrink-0" style={{ width: '80px', height: '80px' }}>
          <svg viewBox="0 0 100 100" class="w-full h-full">
            {/* Mastered ring (outer) */}
            <circle cx="50" cy="50" r="42" fill="none" stroke={B.border} stroke-width="5" opacity="0.3" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={RING_COLORS.mastered} stroke-width="5" stroke-linecap="round"
              stroke-dasharray={`${pctMastered * 2.64} ${264 - pctMastered * 2.64}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
            />
            {/* Review ring (middle) */}
            <circle cx="50" cy="50" r="33" fill="none" stroke={B.border} stroke-width="5" opacity="0.3" />
            <circle
              cx="50" cy="50" r="33" fill="none"
              stroke={RING_COLORS.review} stroke-width="5" stroke-linecap="round"
              stroke-dasharray={`${pctReview * 2.07} ${207 - pctReview * 2.07}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
            />
            {/* New ring (inner) */}
            <circle cx="50" cy="50" r="24" fill="none" stroke={B.border} stroke-width="5" opacity="0.3" />
            <circle
              cx="50" cy="50" r="24" fill="none"
              stroke={RING_COLORS.new} stroke-width="5" stroke-linecap="round"
              stroke-dasharray={`${pctNew * 1.51} ${151 - pctNew * 1.51}`}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
            />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span style="font-family: var(--font-display);" class="text-lg text-black">{total}</span>
          </div>
        </div>

        {/* Counts */}
        <div class="flex-1 space-y-1.5">
          {[
            { label: 'New', count: rings.new, color: RING_COLORS.new },
            { label: 'Review', count: rings.review, color: RING_COLORS.review },
            { label: 'Mastered', count: rings.mastered, color: RING_COLORS.mastered },
          ].map(({ label, count, color }) => (
            <div key={label} class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span class="text-xs text-[#6b6560] flex-1">{label}</span>
              <span class="text-sm text-black font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {due.length > 0 && (
        <a
          href={`${base}hotsheet`}
          class="block mt-3 py-2 text-center text-xs uppercase tracking-[0.1em] font-medium border border-[#8F5A39] text-[#8F5A39] rounded-sm no-underline hover:bg-[#8F5A39] hover:text-white transition-colors"
        >
          {due.length} card{due.length !== 1 ? 's' : ''} due for review
        </a>
      )}
    </div>
  );
}

// ─── SECTION 6: Bell History (Extended 30-day) ───────────────────────────────

function BellHistory30() {
  const p = useStore($progress);

  let history: { date: string; score: number }[] = [];
  try { history = JSON.parse(p.bellHistory || '[]'); }
  catch { history = []; }

  if (history.length === 0) return null;

  const today = new Date();
  const days: { date: string; entry?: { date: string; score: number } }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days.push({ date: iso, entry: history.find((h) => h.date === iso) });
  }

  const totalBells = history.length;
  const avgScore = totalBells > 0
    ? (history.reduce((s, h) => s + h.score, 0) / totalBells).toFixed(1)
    : '0';
  const bestScore = totalBells > 0
    ? Math.max(...history.map((h) => h.score))
    : 0;
  const bellRun = parseInt(p.bellRunCurrent || '0', 10);

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 mb-4">
      <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-3">Opening Bell — 30 day</div>

      {/* 30-day strip */}
      <div class="flex gap-[2px] mb-3">
        {days.map((d) => {
          const present = !!d.entry;
          const score = d.entry?.score ?? 0;
          const isToday = d.date === todayISO();
          return (
            <div
              key={d.date}
              title={`${d.date}${present ? ` · ${score}/5` : ' · missed'}`}
              class="flex-1"
              style={{
                height: '20px',
                borderRadius: '1.5px',
                background: present
                  ? (score >= 4 ? B.bronze : score >= 2 ? `${B.bronze}99` : `${B.bronze}44`)
                  : 'var(--heatmap-empty, #F4EFE7)',
                border: isToday ? `1.5px solid ${B.bronze}` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Stats row */}
      <div class="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: totalBells },
          { label: 'Avg', value: avgScore },
          { label: 'Best', value: `${bestScore}/5` },
          { label: 'Run', value: bellRun },
        ].map(({ label, value }) => (
          <div key={label} class="text-center">
            <div style="font-family: var(--font-display);" class="text-lg text-black leading-tight">{value}</div>
            <div class="text-[9px] text-[#6b6560] uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION 7: Investigation Progress ───────────────────────────────────────

const INVESTIGATIONS = [
  { id: 'madoff', title: 'The Madoff Fraud', chapters: 8 },
  { id: 'enron', title: 'The Enron Collapse', chapters: 8 },
  { id: 'gamestop', title: 'The GameStop Saga', chapters: 8 },
  { id: 'financial-crisis-2008', title: 'The 2008 Financial Crisis', chapters: 8 },
  { id: 'ftx', title: 'The FTX Crypto Fraud', chapters: 8 },
];

function InvestigationProgress({ base }: { base: string }) {
  const [completions, setCompletions] = useState<Record<string, { score: number; date: string }>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sie-walkthroughs');
      if (raw) setCompletions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const totalChapters = INVESTIGATIONS.reduce((s, inv) => s + inv.chapters, 0);
  const completedInvestigations = Object.keys(completions).filter((k) =>
    INVESTIGATIONS.some((inv) => inv.id === k)
  );
  const chaptersCompleted = completedInvestigations.reduce((s, k) => {
    const inv = INVESTIGATIONS.find((i) => i.id === k);
    return s + Math.min(completions[k]?.score ?? 0, inv?.chapters ?? 0);
  }, 0);

  if (chaptersCompleted === 0 && completedInvestigations.length === 0) return null;

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560]">Investigations</div>
        <span class="text-[10px] text-[#6b6560]">{chaptersCompleted} / {totalChapters} chapters</span>
      </div>

      <div class="space-y-2">
        {INVESTIGATIONS.map((inv) => {
          const done = completions[inv.id];
          const score = done?.score ?? 0;
          const pct = Math.round((score / inv.chapters) * 100);
          return (
            <a
              key={inv.id}
              href={`${base}walkthroughs/${inv.id}`}
              class="flex items-center gap-3 no-underline group"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-black group-hover:text-[#8F5A39] transition-colors truncate">{inv.title}</span>
                  {done && (
                    <span class="text-[10px] text-[#6b6560] shrink-0">{score}/{inv.chapters}</span>
                  )}
                </div>
                <div class="h-1 w-full bg-[#F4EFE7] rounded-full overflow-hidden mt-1">
                  <div
                    class="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: done ? B.bronze : 'transparent' }}
                  />
                </div>
              </div>
              {done ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" class="shrink-0">
                  <path d="M3 8.5l3.5 3.5L13 4" stroke={B.bronze} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              ) : (
                <span class="text-[10px] text-[#6b6560] shrink-0">--</span>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECTION 8: Achievements / Titles ────────────────────────────────────────

function AchievementsList() {
  const p = useStore($progress);
  const earned = useStore($earnedTitles);
  const xp = useStore($xp);
  const currentTitle = useStore($title);

  const allSecrets = Object.entries(SECRET_TITLES);

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 mb-4">
      <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-3">Achievements</div>

      {/* Title ladder compact */}
      <div class="flex gap-1 mb-4">
        {TITLE_LADDER.map((t) => {
          const reached = xp >= t.minXp;
          const isCurrent = t.id === currentTitle.id;
          return (
            <div
              key={t.id}
              class="flex-1 text-center py-1.5 rounded-sm"
              style={{
                background: isCurrent ? B.bronze : reached ? `${B.bronze}22` : 'var(--heatmap-empty, #F4EFE7)',
                border: isCurrent ? `1px solid ${B.bronze}` : '1px solid transparent',
              }}
            >
              <div class="text-[9px] font-medium" style={{ color: isCurrent ? 'white' : reached ? B.bronze : B.muted }}>
                {t.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Secret titles */}
      <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-2">Secret titles</div>
      <div class="grid grid-cols-2 gap-2">
        {allSecrets.map(([id, secret]) => {
          const isEarned = earned.includes(id);
          return (
            <div
              key={id}
              class="border rounded-sm px-3 py-2"
              style={{
                borderColor: isEarned ? B.bronze : 'var(--theme-border, #E5E0D8)',
                background: isEarned ? `${B.bronze}0a` : 'transparent',
              }}
            >
              {isEarned ? (
                <>
                  <div class="text-xs text-black font-medium">{secret.name}</div>
                  <div class="text-[10px] text-[#6b6560] mt-0.5">{secret.description}</div>
                </>
              ) : (
                <>
                  <div class="text-xs font-medium" style={{ color: B.muted }}>???</div>
                  <div class="text-[10px] mt-0.5" style={{ color: B.muted, opacity: 0.6 }}>
                    {id === 'diamond-hands' && 'Hard questions hold the key.'}
                    {id === 'bond-whisperer' && 'Debt specialists know the way.'}
                    {id === 'first-bell' && 'Every morning has a chance.'}
                    {id === 'cold-streak' && 'Consistency over a month.'}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECTION 9: Overall Stats Strip ──────────────────────────────────────────

function OverallStats() {
  const p = useStore($progress);
  const accuracy = useStore($accuracy);

  const totalAnswered = parseInt(p.totalAnswered || '0', 10);
  const totalCorrect = parseInt(p.totalCorrect || '0', 10);

  if (totalAnswered === 0) return null;

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 mb-4">
      <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-3">Lifetime stats</div>
      <div class="grid grid-cols-3 gap-3">
        {[
          { label: 'Answered', value: totalAnswered.toLocaleString() },
          { label: 'Correct', value: totalCorrect.toLocaleString() },
          { label: 'Accuracy', value: `${accuracy}%` },
        ].map(({ label, value }) => (
          <div key={label} class="text-center">
            <div style="font-family: var(--font-display);" class="text-xl text-black leading-tight">{value}</div>
            <div class="text-[9px] text-[#6b6560] uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ProgressDashboard({ base }: Props) {
  return (
    <div class="max-w-lg mx-auto px-4 py-6">
      <a
        href={base}
        class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium"
      >
        ← Home
      </a>

      <header class="mb-6">
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Progress</p>
        <h1 style="font-family: var(--font-display);" class="text-3xl text-black mb-1">
          Dashboard
        </h1>
        <p class="text-sm text-[#6b6560]">Your complete study picture</p>
      </header>

      <OverviewHeader base={base} />
      <OverallStats />
      <ActivityHeatmap />
      <ExamReadinessCards base={base} />
      <SectionRadar />
      <HotSheetStatus base={base} />
      <BellHistory30 />
      <InvestigationProgress base={base} />
      <AchievementsList />

      {/* Dark mode heatmap CSS vars */}
      <style>{`
        html.dark {
          --heatmap-empty: #2a2520;
          --heatmap-light: rgba(143,90,57,0.3);
          --heatmap-medium: rgba(143,90,57,0.55);
          --heatmap-dark: rgba(143,90,57,0.85);
        }
      `}</style>
    </div>
  );
}
