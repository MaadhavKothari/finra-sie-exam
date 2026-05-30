// Bearer-bond vault token — engraved certificate styled after a vintage
// bearer bond. Long-press flips to a fine-print disclaimer.

import { useState } from 'preact/hooks';
import { djb2 } from '../lib/rng';

interface Props {
  milestone: number;        // 7 / 30 / 100 / 365
  issuedTo: string;         // current title name
  /** True if the user has reached this milestone (else greyed / locked). */
  earned: boolean;
}

function faked(no: string, n: number): string {
  // Derive a faux "registration number" like AB-1234567.
  const h = djb2(no + ':' + n);
  const letters = String.fromCharCode(65 + (h % 26)) + String.fromCharCode(65 + ((h >> 5) % 26));
  const digits = String(h % 10_000_000).padStart(7, '0');
  return `${letters}-${digits}`;
}

const PRINCIPAL: Record<number, string> = {
  7: 'SEVEN DAYS',
  30: 'THIRTY DAYS',
  100: 'ONE HUNDRED DAYS',
  365: 'THREE HUNDRED SIXTY-FIVE DAYS',
};

export default function BearerBondToken({ milestone, issuedTo, earned }: Props) {
  const [flipped, setFlipped] = useState(false);
  const reg = faked(issuedTo, milestone);
  const principalText = PRINCIPAL[milestone] ?? `${milestone} DAYS`;

  const lockedTint = earned ? '' : 'opacity-30 grayscale';

  return (
    <button
      type="button"
      onClick={() => earned && setFlipped((f) => !f)}
      class={`block w-full text-left ${lockedTint}`}
      aria-label={earned ? `Vault token for ${milestone}-day streak — tap to flip` : `Locked: reach ${milestone}-day streak`}
    >
      <div class="relative border-2 border-[#8F5A39] bg-[#F4EFE7] p-4 rounded-sm">
        {/* Double-line vintage border */}
        <div class="absolute inset-1.5 border border-[#8F5A39]/40 rounded-sm pointer-events-none" />
        {/* Corner ornaments */}
        <span class="absolute top-1 left-1 text-[#8F5A39] text-[10px]">✦</span>
        <span class="absolute top-1 right-1 text-[#8F5A39] text-[10px]">✦</span>
        <span class="absolute bottom-1 left-1 text-[#8F5A39] text-[10px]">✦</span>
        <span class="absolute bottom-1 right-1 text-[#8F5A39] text-[10px]">✦</span>

        {!flipped ? (
          <div class="relative px-4 py-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-[9px] uppercase tracking-[0.2em] text-[#8F5A39] font-semibold">Certificate of Streak</p>
              <p class="font-mono text-[10px] text-[#6b6560]">No. {reg}</p>
            </div>
            <div class="border-y border-[#8F5A39]/40 py-3 my-2 text-center">
              <p style="font-family: var(--font-display);" class="text-[10px] uppercase tracking-[0.18em] text-[#6b6560] mb-1">Principal Sum</p>
              <p style="font-family: var(--font-display);" class="text-2xl text-black leading-tight">{principalText}</p>
            </div>
            <div class="flex items-end justify-between mt-2">
              <div>
                <p class="text-[9px] uppercase tracking-wider text-[#6b6560]">Bearer</p>
                <p style="font-family: var(--font-display);" class="text-sm text-black">{issuedTo}</p>
              </div>
              <div class="text-right">
                <p class="text-[9px] uppercase tracking-wider text-[#6b6560]">Issued</p>
                <p class="text-xs font-mono text-[#8F5A39]">FINRA·SIE</p>
              </div>
            </div>
          </div>
        ) : (
          <div class="relative px-4 py-5 min-h-[152px] flex items-center">
            <p class="text-[10px] leading-snug text-[#6b6560] italic">
              This certificate confers no actual securities entitlement. Past performance
              is not indicative of future results. The bearer assumes all study risk,
              including but not limited to, intermittent reinforcement and the
              possibility of an unexpectedly tough Series 7 options section.
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
