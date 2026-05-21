import type { GreedReading } from '../lib/greedIndex';

interface Props {
  reading: GreedReading;
}

// Semi-circular gauge from FEAR (left, red) → NEUTRAL → GREED → EUPHORIA (right, gold).
// Pointer angle: -90deg (left) at dialAngle=0 to +90deg (right) at dialAngle=1.
export default function GreedDial({ reading }: Props) {
  const angle = -90 + reading.dialAngle * 180;
  const cx = 60, cy = 60, r = 46;

  // Build arc segments for the gauge band
  const seg = (startFrac: number, endFrac: number, color: string) => {
    const a0 = Math.PI * (1 - startFrac);
    const a1 = Math.PI * (1 - endFrac);
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    const large = endFrac - startFrac > 0.5 ? 1 : 0;
    return <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`} stroke={color} stroke-width="7" fill="none" stroke-linecap="butt" />;
  };

  const pointerX = cx + r * Math.cos(((180 - reading.dialAngle * 180) * Math.PI) / 180);
  const pointerY = cy - r * Math.sin(((180 - reading.dialAngle * 180) * Math.PI) / 180);

  return (
    <div class="border border-[#E5E0D8] rounded-sm bg-white p-4 h-full flex flex-col">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560]">Greed Index</span>
        <span class="text-[10px] uppercase tracking-wider font-medium" style={{ color: reading.color }}>
          {reading.label}
        </span>
      </div>
      <div class="flex justify-center my-1">
        <svg width="120" height="72" viewBox="0 0 120 72" aria-hidden="true">
          {seg(0.00, 0.20, '#a13a26')}
          {seg(0.20, 0.55, '#8F5A39')}
          {seg(0.55, 0.80, '#1e7a3a')}
          {seg(0.80, 1.00, '#b88321')}
          {/* Pointer */}
          <line x1={cx} y1={cy} x2={pointerX} y2={pointerY} stroke="#000" stroke-width="2" stroke-linecap="round" />
          <circle cx={cx} cy={cy} r="3" fill="#000" />
        </svg>
      </div>
      <div class="text-center mt-auto">
        <div style="font-family: var(--font-display);" class="text-xl text-black leading-none">
          {reading.multiplier}x
        </div>
        <div class="text-[10px] text-[#6b6560] mt-1 leading-snug">{reading.flavor}</div>
      </div>
    </div>
  );
}
