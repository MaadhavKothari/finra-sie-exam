import { useStore } from '@nanostores/preact';
import { $progress, $streak, $bestStreak, $freezeCount } from '../stores/progress';

interface Props {
  base: string;
}

interface StreakRun {
  startDate: string;
  endDate: string;
  length: number;
}

export default function StreakPanel({ base }: Props) {
  const p = useStore($progress);
  const streak = useStore($streak);
  const best = useStore($bestStreak);
  const freezes = useStore($freezeCount);

  let history: StreakRun[] = [];
  try { history = JSON.parse(p.streakHistory || '[]'); }
  catch { history = []; }
  const sorted = [...history].sort((a, b) => (a.endDate < b.endDate ? 1 : -1));

  return (
    <div class="max-w-lg mx-auto px-4 py-6">
      <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
        ← Home
      </a>

      <header class="mb-8 text-center">
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Streak Vault</p>
        <div style="font-family: var(--font-display);" class="text-7xl text-black leading-none mb-2">
          {streak}
        </div>
        <div class="h-px w-12 bg-[#8F5A39] mx-auto mb-3" />
        <p class="text-sm text-[#6b6560]">consecutive day{streak === 1 ? '' : 's'}{p.streakStartDate ? ` · since ${p.streakStartDate}` : ''}</p>
      </header>

      {/* Freezes */}
      <section class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium">Freezes available</h2>
          <span class="text-[11px] text-[#6b6560]">cap 2</span>
        </div>
        <div class="border border-[#E5E0D8] rounded-sm p-4 bg-white flex items-center gap-3">
          {freezes === 0 ? (
            <span class="text-sm text-[#6b6560] italic">None. Study 4 of 7 days this week to earn one.</span>
          ) : (
            <>
              {Array.from({ length: freezes }).map((_, i) => (
                <span
                  key={i}
                  class="inline-flex items-center px-3 py-1 rounded-sm bg-[#F4EFE7] border border-[#8F5A39] text-[#8F5A39] text-xs uppercase tracking-wider font-medium"
                >
                  Freeze
                </span>
              ))}
              <span class="text-xs text-[#6b6560]">auto-consumed if you miss a day</span>
            </>
          )}
        </div>
      </section>

      {/* Best */}
      <section class="mb-8">
        <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium mb-3">Best streak</h2>
        <div class="border border-[#E5E0D8] rounded-sm p-4 bg-white flex items-baseline gap-3">
          <span style="font-family: var(--font-display);" class="text-3xl text-black">{best}</span>
          <span class="text-xs text-[#6b6560] uppercase tracking-wider">days</span>
        </div>
      </section>

      {/* History */}
      <section>
        <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium mb-3">Past runs</h2>
        {sorted.length === 0 ? (
          <p class="text-sm text-[#6b6560] italic">No closed runs yet. Your first one is in progress.</p>
        ) : (
          <div class="border border-[#E5E0D8] rounded-sm overflow-hidden">
            {sorted.map((run, i) => (
              <div
                key={`${run.startDate}-${i}`}
                class={`px-4 py-3 flex items-center justify-between bg-white ${i > 0 ? 'border-t border-[#E5E0D8]' : ''}`}
              >
                <div>
                  <div class="text-sm text-black">
                    <span style="font-family: var(--font-display);" class="text-lg">{run.length}</span>
                    <span class="text-xs text-[#6b6560] ml-1.5">days</span>
                  </div>
                  <div class="text-[11px] text-[#6b6560] mt-0.5">{run.startDate} → {run.endDate}</div>
                </div>
                <span class="text-[10px] uppercase tracking-wider text-[#6b6560]">closed</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
