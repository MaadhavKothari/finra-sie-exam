// Hidden 7-tap detector. Awards "The Whistleblower" sub-title with no toast.
// Placed inline on the home footer disclaimer; user has to find it.

import { useRef, useState } from 'preact/hooks';
import { $progress } from '../stores/progress';
import { SECRET_TITLES } from '../lib/titles';
import { hapticSuccess } from '../lib/haptics';

interface Props {
  children: any;
}

export default function WhistleblowerTrap({ children }: Props) {
  const taps = useRef<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  function handleTap() {
    const now = Date.now();
    taps.current.push(now);
    // keep only taps from the last 3s
    taps.current = taps.current.filter((t) => now - t <= 3000);
    if (taps.current.length >= 7) {
      taps.current = [];
      const cur = (() => {
        try { return JSON.parse($progress.get().earnedTitles || '[]') as string[]; }
        catch { return []; }
      })();
      if (!cur.includes('the-whistleblower')) {
        cur.push('the-whistleblower');
        $progress.setKey('earnedTitles', JSON.stringify(cur));
        hapticSuccess();
        setRevealed(true);
        setTimeout(() => setRevealed(false), 2400);
      }
    }
  }

  return (
    <>
      <span onClick={handleTap} style="cursor: default;">
        {children}
      </span>
      {revealed && (
        <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-black text-white text-sm rounded-sm shadow-lg">
          {SECRET_TITLES['the-whistleblower'].name} — title awarded.
        </div>
      )}
    </>
  );
}
