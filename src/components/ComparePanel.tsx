import { useState, useMemo } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress, getExamHistory } from '../stores/progress';
import { parseShareString, type ParsedShare } from '../lib/shareString';

interface Props {
  base: string;
}

export default function ComparePanel({ base }: Props) {
  const p = useStore($progress);
  const [input, setInput] = useState('');
  const parsed: ParsedShare | null = useMemo(() => {
    if (!input.trim()) return null;
    return parseShareString(input);
  }, [input]);

  // Pull the user's latest result that matches mode.
  const mine = useMemo(() => {
    if (!parsed) return null;
    if (parsed.mode === 'bell') {
      try {
        const hist = JSON.parse(p.bellHistory || '[]') as { date: string; score: number }[];
        const last = hist[hist.length - 1];
        if (!last) return null;
        return {
          mode: 'bell' as const,
          title: 'Opening Bell',
          score: { correct: last.score, total: 5 },
          percent: Math.round((last.score / 5) * 100),
          date: last.date,
        };
      } catch { return null; }
    }
    if (parsed.mode === 'exam') {
      const hist = getExamHistory();
      const last = hist[hist.length - 1];
      if (!last) return null;
      return {
        mode: 'exam' as const,
        title: last.examId.toUpperCase(),
        score: { correct: last.score, total: last.total },
        percent: Math.round((last.score / last.total) * 100),
        durationMin: last.duration,
        date: last.date,
      };
    }
    return null;
  }, [parsed, p.bellHistory, p.examHistory]);

  return (
    <div class="max-w-lg mx-auto px-4 py-6">
      <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
        ← Home
      </a>

      <header class="mb-8">
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Compare</p>
        <h1 style="font-family: var(--font-display);" class="text-4xl leading-tight text-black mb-3">
          Paste a friend's share.
        </h1>
        <div class="h-px w-12 bg-[#8F5A39] mb-3" />
        <p class="text-sm text-[#6b6560]">
          Drop their Wordle-style share string below. Nothing leaves the device.
        </p>
      </header>

      <div class="mb-6">
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          rows={8}
          placeholder={'FINRA Prep 🔔 Opening Bell\nMay 29 — 4/5\n\n🟩🟩🟥🟩🟩\n\n12-day streak | VP | 1.5x Greed'}
          class="w-full p-3 border border-[#E5E0D8] rounded-sm bg-white text-sm font-mono text-black placeholder:text-[#9a948d] focus:outline-none focus:border-black resize-none"
        />
        {input && parsed && parsed.mode === 'unknown' && (
          <p class="text-xs text-[#a13a26] mt-2">
            Doesn't look like a FINRA Prep share string. Make sure you copied the whole thing.
          </p>
        )}
      </div>

      {parsed && parsed.mode !== 'unknown' && (
        <>
          <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium mb-3">Head to head</h2>
          <div class="grid grid-cols-2 gap-3 mb-6">
            <ResultCard label="Them" data={parsed} />
            <ResultCard
              label="You"
              data={mine ? {
                mode: mine.mode,
                title: mine.title,
                score: mine.score,
                percent: mine.percent,
                durationMin: (mine as any).durationMin,
                grid: [],
              } : null}
              fallback={mine ? null : 'No recent result of this type yet.'}
            />
          </div>
          {mine && parsed.percent != null && mine.percent != null && (
            <Verdict theirs={parsed.percent} mine={mine.percent} />
          )}
        </>
      )}
    </div>
  );
}

function ResultCard({
  label,
  data,
  fallback,
}: {
  label: string;
  data: Pick<ParsedShare, 'mode' | 'title' | 'score' | 'percent' | 'durationMin' | 'grid'> | null;
  fallback?: string | null;
}) {
  if (!data) {
    return (
      <div class="border border-[#E5E0D8] rounded-sm p-4 bg-white">
        <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">{label}</p>
        <p class="text-xs text-[#6b6560] italic">{fallback || '—'}</p>
      </div>
    );
  }
  return (
    <div class="border border-[#E5E0D8] rounded-sm p-4 bg-white">
      <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">{label}</p>
      <p style="font-family: var(--font-display);" class="text-sm text-black mb-1 truncate">{data.title || 'Result'}</p>
      {data.score && (
        <p style="font-family: var(--font-display);" class="text-2xl text-black leading-tight">
          {data.score.correct}/{data.score.total}
        </p>
      )}
      {data.percent != null && (
        <p class="text-xs text-[#8F5A39] font-medium uppercase tracking-wider">{data.percent}%</p>
      )}
      {data.durationMin != null && (
        <p class="text-[10px] text-[#6b6560] mt-1">{data.durationMin} min</p>
      )}
      {data.grid && data.grid.length > 0 && (
        <p class="mt-2 text-base leading-none break-words">
          {data.grid.map((g) => g.correct ? '\u{1F7E9}' : '\u{1F7E5}').join('')}
        </p>
      )}
    </div>
  );
}

function Verdict({ theirs, mine }: { theirs: number; mine: number }) {
  const diff = mine - theirs;
  let copy = 'Dead even.';
  let color = '#6b6560';
  if (diff > 0) {
    copy = `You're up ${diff} pts. Cover.`;
    color = '#1e7a3a';
  } else if (diff < 0) {
    copy = `Down ${Math.abs(diff)} pts. Run it back.`;
    color = '#a13a26';
  }
  return (
    <div class="border border-[#E5E0D8] rounded-sm p-4 bg-[#F4EFE7] text-center">
      <p class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-1">Verdict</p>
      <p style="font-family: var(--font-display);" class="text-xl" style={`color: ${color}; font-family: var(--font-display);`}>{copy}</p>
    </div>
  );
}
