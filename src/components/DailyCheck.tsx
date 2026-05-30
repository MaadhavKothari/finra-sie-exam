import { useState, useEffect } from 'preact/hooks';
import { $progress, dailyStreakCheck, clearPendingReopen } from '../stores/progress';
import { rescheduleFireForget } from '../lib/notifications';
import { soundFreeze, soundMarketsReopen } from '../lib/sounds';

// Runs once on home page load.
// - Calls dailyStreakCheck() to auto-consume a freeze or archive the streak.
// - Surfaces a "Freeze used" toast or a "Markets reopen" modal as appropriate.
export default function DailyCheck() {
  const [toast, setToast] = useState<string | null>(null);
  const [reopenOpen, setReopenOpen] = useState(false);

  useEffect(() => {
    const r = dailyStreakCheck();
    rescheduleFireForget();
    if (r && (r as any).freezeUsed) {
      setToast('Freeze used. Streak preserved.');
      soundFreeze();
      const t = setTimeout(() => setToast(null), 2800);
      return () => clearTimeout(t);
    }
    if ($progress.get().pendingReopen === '1') {
      setReopenOpen(true);
      soundMarketsReopen();
    }
  }, []);

  if (!toast && !reopenOpen) return null;

  return (
    <>
      {toast && (
        <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-black text-white text-sm rounded-sm shadow-lg">
          {toast}
        </div>
      )}
      {reopenOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div class="bg-white border border-[#E5E0D8] rounded-sm p-6 max-w-sm w-full">
            <p class="text-[11px] uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Markets reopen</p>
            <h2 style="font-family: var(--font-display);" class="text-2xl text-black mb-3">Position closed.</h2>
            <p class="text-sm text-[#6b6560] mb-5 leading-relaxed">
              Your previous run is in the vault. Start a new one with your next correct answer.
            </p>
            <button
              onClick={() => { clearPendingReopen(); setReopenOpen(false); }}
              class="w-full py-3 bg-black text-white text-sm uppercase tracking-[0.1em] font-medium rounded-sm hover:bg-[#1a1a1a] transition-colors"
            >
              Start a new run
            </button>
          </div>
        </div>
      )}
    </>
  );
}
