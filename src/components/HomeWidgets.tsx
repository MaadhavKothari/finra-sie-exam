import { useStore } from '@nanostores/preact';
import { $progress } from '../stores/progress';
import { $dueCount, $ringCounts } from '../stores/hotSheet';
import { getGreedForDate } from '../lib/greedIndex';
import GreedDial from './GreedDial';
import BellCard from './BellCard';

interface Props {
  base: string;
}

const todayISO = () => new Date().toISOString().split('T')[0];

export default function HomeWidgets({ base }: Props) {
  // Subscribe to progress so the bell card re-renders after completion.
  useStore($progress);
  const greed = getGreedForDate(todayISO());
  const dueCount = useStore($dueCount);
  const rings = useStore($ringCounts);

  return (
    <>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <GreedDial reading={greed} />
        <a
          href={`${base}bell`}
          class="block border border-[#E5E0D8] rounded-sm bg-white hover:bg-[#F4EFE7] transition-colors no-underline"
        >
          <BellCard base={base} />
        </a>
      </div>
      {/* Hot Sheet mini-widget */}
      <a
        href={`${base}hotsheet`}
        class="block border border-[#E5E0D8] rounded-sm bg-white hover:bg-[#F4EFE7] transition-colors no-underline px-4 py-3 mb-6"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex gap-1">
              <span class="inline-block w-2 h-2 rounded-full" style={{ background: '#b87333' }} />
              <span class="inline-block w-2 h-2 rounded-full" style={{ background: '#c9a227' }} />
              <span class="inline-block w-2 h-2 rounded-full" style={{ background: '#2d8a4e' }} />
            </div>
            <div>
              <span class="text-sm text-black font-medium">Hot Sheet</span>
              {dueCount > 0 ? (
                <span class="text-[11px] text-[#8F5A39] ml-2 font-medium">{dueCount} due</span>
              ) : (
                <span class="text-[11px] text-[#6b6560] ml-2">All clear</span>
              )}
            </div>
          </div>
          <span class="text-[#8F5A39] text-sm">→</span>
        </div>
      </a>
    </>
  );
}
