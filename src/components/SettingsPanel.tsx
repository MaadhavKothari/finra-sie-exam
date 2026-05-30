import { useStore } from '@nanostores/preact';
import { useEffect, useState } from 'preact/hooks';
import {
  $settings,
  setNotifEnabled,
  setNotifChannel,
  setSoundEnabledKey,
  setJinglesEnabledKey,
  setSoundVolumeKey,
} from '../stores/settings';
import {
  getPermissionState,
  requestPermission,
  reschedule,
  cancelAll,
} from '../lib/notifications';
import { soundKaching, soundBell, soundDiamondHands } from '../lib/sounds';

interface Props {
  base: string;
}

type PermState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unsupported';

export default function SettingsPanel({ base }: Props) {
  const s = useStore($settings);
  const [perm, setPerm] = useState<PermState>('unsupported');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPermissionState().then((p) => setPerm((p ?? 'unsupported') as PermState));
  }, []);

  async function handleMasterToggle() {
    if (busy) return;
    const turningOn = s.notifEnabled !== '1';
    setBusy(true);
    try {
      if (turningOn) {
        if (perm !== 'granted') {
          const next = await requestPermission();
          setPerm((next ?? 'unsupported') as PermState);
          if (next !== 'granted') {
            // User denied — leave master off so we don't pretend they're enrolled.
            setNotifEnabled(false);
            return;
          }
        }
        setNotifEnabled(true);
        await reschedule();
      } else {
        setNotifEnabled(false);
        await cancelAll();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleChannelToggle(channel: 'bell' | 'hotSheet' | 'streakRisk', cur: boolean) {
    setNotifChannel(channel, !cur);
    if (s.notifEnabled === '1') await reschedule();
  }

  const masterOn = s.notifEnabled === '1';
  const unsupported = perm === 'unsupported';
  const denied = perm === 'denied';

  return (
    <div class="max-w-lg mx-auto px-4 py-6">
      <a href={base} class="text-xs uppercase tracking-[0.12em] text-[#8F5A39] hover:text-black transition-colors mb-6 inline-block font-medium">
        ← Home
      </a>

      <header class="mb-8">
        <p class="text-xs uppercase tracking-[0.15em] text-[#8F5A39] font-medium mb-2">Settings</p>
        <h1 style="font-family: var(--font-display);" class="text-4xl leading-tight text-black mb-3">
          Notifications
        </h1>
        <div class="h-px w-12 bg-[#8F5A39] mb-3" />
        <p class="text-sm text-[#6b6560]">
          Terse local reminders. No remote push, no analytics. Bloomberg-alert voice, not cartoon.
        </p>
      </header>

      {/* Master toggle */}
      <section class="mb-8 border border-[#E5E0D8] rounded-sm bg-white">
        <div class="px-4 py-4 flex items-center justify-between">
          <div class="pr-4">
            <p style="font-family: var(--font-display);" class="text-base text-black mb-0.5">
              Enable notifications
            </p>
            <p class="text-xs text-[#6b6560]">
              {unsupported
                ? 'Available in the iOS app only.'
                : denied
                  ? 'iOS permission denied. Re-enable in iOS Settings → Notifications → FINRA Exam Prep.'
                  : 'Three daily slots. All terse, all skippable.'}
            </p>
          </div>
          <Toggle
            on={masterOn}
            disabled={busy || unsupported || denied}
            onClick={handleMasterToggle}
          />
        </div>
      </section>

      {/* Per-channel toggles */}
      <section class={`mb-10 transition-opacity ${masterOn ? '' : 'opacity-50 pointer-events-none'}`}>
        <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium mb-3">Channels</h2>
        <div class="border border-[#E5E0D8] rounded-sm overflow-hidden bg-white">
          <ChannelRow
            label="Opening Bell"
            time="9:25 AM"
            sample="Bell in 5 minutes. 47-day run on the line."
            note="Only if your streak is 3+ days."
            on={s.notifBell === '1'}
            onToggle={() => handleChannelToggle('bell', s.notifBell === '1')}
          />
          <ChannelRow
            label="Hot Sheet"
            time="8:30 PM"
            sample="7 cards due. Close them before midnight."
            note="Only if cards are actually due."
            on={s.notifHotSheet === '1'}
            onToggle={() => handleChannelToggle('hotSheet', s.notifHotSheet === '1')}
          />
          <ChannelRow
            label="Streak risk"
            time="11:45 PM"
            sample="23-day run closes in 15 minutes. 3 questions to save it."
            note="Only if you haven't answered 3 questions today."
            on={s.notifStreakRisk === '1'}
            onToggle={() => handleChannelToggle('streakRisk', s.notifStreakRisk === '1')}
            last
          />
        </div>
      </section>

      {/* Sound section */}
      <section class="mb-10">
        <h2 class="text-xs uppercase tracking-[0.15em] text-[#6b6560] font-medium mb-3">Sound</h2>
        <div class="border border-[#E5E0D8] rounded-sm overflow-hidden bg-white">
          {/* Master sound */}
          <div class="px-4 py-4 border-b border-[#E5E0D8]">
            <div class="flex items-center justify-between mb-1">
              <div>
                <p style="font-family: var(--font-display);" class="text-base text-black">Sound effects</p>
                <p class="text-[11px] text-[#6b6560]">Wall Street tics, ka-chings, opening bell.</p>
              </div>
              <Toggle on={s.soundEnabled === '1'} onClick={() => setSoundEnabledKey(s.soundEnabled !== '1')} />
            </div>
          </div>
          {/* Jingles */}
          <div class={`px-4 py-4 border-b border-[#E5E0D8] transition-opacity ${s.soundEnabled === '1' ? '' : 'opacity-50 pointer-events-none'}`}>
            <div class="flex items-center justify-between mb-1">
              <div>
                <p style="font-family: var(--font-display);" class="text-base text-black">Ceremonial jingles</p>
                <p class="text-[11px] text-[#6b6560]">Longer Wall-Street-style intros for exam start / end.</p>
              </div>
              <Toggle on={s.jinglesEnabled === '1'} onClick={() => setJinglesEnabledKey(s.jinglesEnabled !== '1')} />
            </div>
          </div>
          {/* Volume */}
          <div class={`px-4 py-4 transition-opacity ${s.soundEnabled === '1' ? '' : 'opacity-50 pointer-events-none'}`}>
            <p style="font-family: var(--font-display);" class="text-base text-black mb-2">Volume</p>
            <input
              type="range"
              min="0"
              max="100"
              value={s.soundVolume || '50'}
              onInput={(e) => setSoundVolumeKey(parseInt((e.target as HTMLInputElement).value, 10))}
              class="w-full accent-black"
            />
            <div class="flex items-center justify-between mt-2 gap-2">
              <button
                onClick={() => soundKaching()}
                class="flex-1 py-2 border border-[#E5E0D8] hover:border-black text-[11px] uppercase tracking-wider text-black rounded-sm transition-colors"
              >
                Ka-ching
              </button>
              <button
                onClick={() => soundBell()}
                class="flex-1 py-2 border border-[#E5E0D8] hover:border-black text-[11px] uppercase tracking-wider text-black rounded-sm transition-colors"
              >
                Opening Bell
              </button>
              <button
                onClick={() => soundDiamondHands()}
                class="flex-1 py-2 border border-[#E5E0D8] hover:border-black text-[11px] uppercase tracking-wider text-black rounded-sm transition-colors"
              >
                Diamond Hands
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <p class="text-xs text-[#6b6560] leading-relaxed">
        Schedules update every time you open the app. If conditions aren't met (no streak,
        no due cards, daily floor cleared), nothing fires.
      </p>
    </div>
  );
}

function ChannelRow({
  label,
  time,
  sample,
  note,
  on,
  onToggle,
  last,
}: {
  label: string;
  time: string;
  sample: string;
  note: string;
  on: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <div class={`px-4 py-4 ${last ? '' : 'border-b border-[#E5E0D8]'}`}>
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-baseline gap-2">
          <span style="font-family: var(--font-display);" class="text-base text-black">{label}</span>
          <span class="text-[11px] uppercase tracking-wider text-[#8F5A39] font-medium">{time}</span>
        </div>
        <Toggle on={on} onClick={onToggle} />
      </div>
      <p class="text-xs text-[#6b6560] mb-1 italic">"{sample}"</p>
      <p class="text-[11px] text-[#9a948d]">{note}</p>
    </div>
  );
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-black' : 'bg-[#E5E0D8]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        class={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
          on ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
