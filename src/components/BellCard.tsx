import { useState, useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $progress } from '../stores/progress';

interface Props {
  base: string;
}

const todayISO = () => new Date().toISOString().split('T')[0];

function bellTimeToday(): Date {
  const d = new Date();
  d.setHours(9, 30, 0, 0);
  return d;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return '0m';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function BellCard(_props: Props) {
  const p = useStore($progress);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const today = todayISO();
  const bellAt = bellTimeToday().getTime();
  const before = now < bellAt;
  const doneToday = p.bellLastDate === today;

  let history: { date: string; score: number }[] = [];
  try { history = JSON.parse(p.bellHistory || '[]'); }
  catch { history = []; }
  const todayEntry = history.find((h) => h.date === today);

  // Last 14 day bell strip
  const days: { date: string; entry?: { date: string; score: number } }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days.push({ date: iso, entry: history.find((h) => h.date === iso) });
  }

  return (
    <div class="p-4 h-full flex flex-col">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560]">Opening Bell</span>
        <span class="text-base leading-none">🔔</span>
      </div>
      {doneToday ? (
        <>
          <div style="font-family: var(--font-display);" class="text-xl text-black leading-tight">
            Bell rung. {todayEntry?.score ?? 0}/5
          </div>
          <p class="text-[11px] text-[#6b6560] mt-1">Tomorrow at 9:30.</p>
        </>
      ) : before ? (
        <>
          <div style="font-family: var(--font-display);" class="text-xl text-black leading-tight">
            Rings in {fmtCountdown(bellAt - now)}
          </div>
          <p class="text-[11px] text-[#6b6560] mt-1">Five questions. One chance.</p>
        </>
      ) : (
        <>
          <div style="font-family: var(--font-display);" class="text-xl text-black leading-tight">
            The bell has rung.
          </div>
          <p class="text-[11px] text-[#8F5A39] mt-1 font-medium">Take the Bell →</p>
        </>
      )}

      {/* 14-day history strip */}
      <div class="flex gap-[3px] mt-auto pt-3">
        {days.map((d) => {
          const isToday = d.date === today;
          const present = !!d.entry;
          const score = d.entry?.score ?? 0;
          // glyph: filled = present, ring = today/empty, hollow = missed
          return (
            <div
              key={d.date}
              title={`${d.date}${present ? ` · ${score}/5` : ' · missed'}`}
              class={`flex-1 h-1.5 rounded-full ${
                present
                  ? (score >= 4 ? 'bg-[#8F5A39]' : score >= 2 ? 'bg-[#8F5A39]/60' : 'bg-[#8F5A39]/30')
                  : isToday
                    ? 'bg-[#E5E0D8] border border-[#8F5A39]'
                    : 'bg-[#E5E0D8]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
