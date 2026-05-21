import { useStore } from '@nanostores/preact';
import { $progress, $xp, $title, $titleProgress, $streak, $freezeCount } from '../stores/progress';

interface Props {
  base: string;
}

export default function IdentityHeader({ base }: Props) {
  useStore($progress);
  const xp = useStore($xp);
  const title = useStore($title);
  const prog = useStore($titleProgress);
  const streak = useStore($streak);
  const freezes = useStore($freezeCount);

  return (
    <div class="mb-6 border border-[#E5E0D8] rounded-sm bg-white">
      <a href={`${base}identity`} class="flex items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-[#F4EFE7] transition-colors">
        <div class="min-w-0 flex-1">
          <div class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] mb-0.5">Trader ID</div>
          <div class="flex items-baseline gap-2">
            <span style="font-family: var(--font-display);" class="text-lg text-black truncate">{title.name}</span>
            <span class="text-[11px] text-[#6b6560]">{xp.toLocaleString()} XP</span>
          </div>
          {prog && (
            <div class="mt-1.5 h-[3px] w-full bg-[#F4EFE7] rounded-full overflow-hidden">
              <div class="h-full bg-[#8F5A39]" style={{ width: `${prog.percent}%` }} />
            </div>
          )}
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          <a
            href={`${base}streak`}
            class="text-[11px] text-[#6b6560] flex items-center gap-1 hover:text-black transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <span class="font-semibold text-black">{streak}</span>
            <span class="uppercase tracking-wider">day</span>
          </a>
          {freezes > 0 && (
            <div class="flex gap-1">
              {Array.from({ length: freezes }).map((_, i) => (
                <span key={i} class="inline-block w-2 h-2 rounded-full bg-[#8F5A39]" title="Streak freeze available" />
              ))}
            </div>
          )}
        </div>
      </a>
    </div>
  );
}
