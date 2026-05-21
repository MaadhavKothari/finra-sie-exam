import { useStore } from '@nanostores/preact';
import { $progress } from '../stores/progress';
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

  return (
    <div class="grid grid-cols-2 gap-3 mb-6">
      <GreedDial reading={greed} />
      <a
        href={`${base}bell`}
        class="block border border-[#E5E0D8] rounded-sm bg-white hover:bg-[#F4EFE7] transition-colors no-underline"
      >
        <BellCard base={base} />
      </a>
    </div>
  );
}
