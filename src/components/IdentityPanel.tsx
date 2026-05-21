import { useStore } from '@nanostores/preact';
import { $progress, $xp, $title, $titleProgress, $earnedTitles } from '../stores/progress';
import { TITLE_LADDER, SECRET_TITLES } from '../lib/titles';

interface Props {
  base: string;
}

export default function IdentityPanel({ base }: Props) {
  useStore($progress);
  const xp = useStore($xp);
  const title = useStore($title);
  const prog = useStore($titleProgress);
  const earned = useStore($earnedTitles);

  return (
    <div class="max-w-lg mx-auto px-4 py-6">
      <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
        ← Home
      </a>

      <header class="mb-8">
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Trader ID</p>
        <h1 style="font-family: var(--font-display);" class="text-4xl leading-tight text-black mb-3">
          {title.name}
        </h1>
        <div class="h-px w-12 bg-[#8F5A39] mb-3" />
        <p class="text-sm text-[#6b6560]">{xp.toLocaleString()} XP total</p>
        {prog && (
          <div class="mt-4">
            <div class="flex items-center justify-between text-[11px] text-[#6b6560] mb-1.5">
              <span class="uppercase tracking-wider">To next rank</span>
              <span>{prog.current.toLocaleString()} / {prog.needed.toLocaleString()}</span>
            </div>
            <div class="h-1 w-full bg-[#F4EFE7] rounded-full overflow-hidden">
              <div class="h-full bg-[#8F5A39] transition-all duration-500" style={{ width: `${prog.percent}%` }} />
            </div>
          </div>
        )}
      </header>

      <section class="mb-10">
        <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium mb-3">Ladder</h2>
        <div class="border border-[#E5E0D8] rounded-sm overflow-hidden">
          {TITLE_LADDER.map((t, i) => {
            const reached = xp >= t.minXp;
            const isCurrent = t.id === title.id;
            return (
              <div
                key={t.id}
                class={`px-4 py-3 flex items-center justify-between ${i > 0 ? 'border-t border-[#E5E0D8]' : ''} ${isCurrent ? 'bg-[#F4EFE7]' : 'bg-white'}`}
              >
                <div class="flex items-center gap-3">
                  <div class={`w-1.5 h-1.5 rounded-full ${reached ? 'bg-[#8F5A39]' : 'bg-[#E5E0D8]'}`} />
                  <span
                    style="font-family: var(--font-display);"
                    class={`text-base ${reached ? 'text-black' : 'text-[#6b6560]'}`}
                  >
                    {t.name}
                  </span>
                  {isCurrent && (
                    <span class="text-[10px] uppercase tracking-wider text-[#8F5A39] font-medium">current</span>
                  )}
                </div>
                <span class="text-[11px] text-[#6b6560]">{t.minXp.toLocaleString()} XP</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium mb-3">Sub-titles earned</h2>
        {earned.length === 0 ? (
          <p class="text-sm text-[#6b6560] italic">None yet. Sub-titles unlock through specific behaviors. Discovery is the reward.</p>
        ) : (
          <div class="space-y-2">
            {earned.map((id) => {
              const t = SECRET_TITLES[id];
              if (!t) return null;
              return (
                <div key={id} class="border border-[#E5E0D8] rounded-sm px-4 py-3 bg-white">
                  <div style="font-family: var(--font-display);" class="text-base text-black">{t.name}</div>
                  <div class="text-xs text-[#6b6560] mt-0.5">{t.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
