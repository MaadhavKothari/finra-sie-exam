import { useState, useEffect } from 'preact/hooks';

const B = {
  bronze: '#8F5A39',
  muted: '#6b6560',
  border: '#E5E0D8',
  travertine: '#F4EFE7',
};

interface Investigation {
  id: string;
  title: string;
  subtitle: string;
  chapters: number;
  href: string;
}

const INVESTIGATIONS: Investigation[] = [
  { id: 'madoff', title: 'The Madoff Fraud', subtitle: '$65B Ponzi scheme — BD registration, custody, whistleblower, SIPC', chapters: 8, href: 'walkthroughs/madoff' },
  { id: 'enron', title: 'The Enron Collapse', subtitle: 'SPEs, mark-to-market, Arthur Andersen, Sarbanes-Oxley', chapters: 8, href: 'walkthroughs/enron' },
  { id: 'gamestop', title: 'The GameStop Saga', subtitle: 'Short squeezes, PFOF, Reg SHO, market manipulation', chapters: 8, href: 'walkthroughs/gamestop' },
  { id: 'financial-crisis-2008', title: 'The 2008 Financial Crisis', subtitle: 'Subprime MBS, Lehman, AIG, Dodd-Frank reform', chapters: 8, href: 'walkthroughs/financial-crisis-2008' },
  { id: 'ftx', title: 'The FTX Crypto Fraud', subtitle: '$8B customer fund theft — custody, segregation, crypto regulation gap', chapters: 8, href: 'walkthroughs/ftx' },
];

interface Props {
  base: string;
}

export default function InvestigationsAccordion({ base }: Props) {
  const [open, setOpen] = useState(false);
  const [completions, setCompletions] = useState<Record<string, { score: number; date: string }>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sie-walkthroughs');
      if (raw) setCompletions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const completedCount = Object.keys(completions).filter((k) =>
    INVESTIGATIONS.some((inv) => inv.id === k)
  ).length;

  return (
    <section class="mt-10">
      {/* Accordion header */}
      <button
        onClick={() => setOpen(!open)}
        class="w-full flex items-center justify-between group cursor-pointer"
        aria-expanded={open}
      >
        <div class="flex items-center gap-3">
          <p class="text-xs uppercase tracking-[0.15em] font-medium" style={{ color: B.muted }}>
            Scandal investigations
          </p>
          <span
            class="text-[10px] px-2 py-0.5 rounded-sm font-semibold"
            style={{ background: B.travertine, color: B.bronze, border: `1px solid ${B.border}` }}
          >
            {completedCount}/{INVESTIGATIONS.length}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs" style={{ color: B.muted }}>
            {INVESTIGATIONS.length * 8} chapters
          </span>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            class={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M4 6l4 4 4-4" stroke={B.muted} stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
      </button>

      {/* Accordion body */}
      <div
        class="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? `${INVESTIGATIONS.length * 120 + 20}px` : '0px',
          opacity: open ? 1 : 0,
          marginTop: open ? '12px' : '0px',
        }}
      >
        <div class="space-y-2">
          {INVESTIGATIONS.map((inv) => {
            const done = completions[inv.id];
            return (
              <a
                key={inv.id}
                href={`${base}${inv.href}`}
                class="group block bg-black hover:bg-[#1a1a1a] rounded-sm no-underline transition-colors relative overflow-hidden"
              >
                {/* Subtle progress bar at top */}
                {done && (
                  <div
                    class="absolute top-0 left-0 h-0.5 transition-all"
                    style={{
                      width: `${(done.score / inv.chapters) * 100}%`,
                      backgroundColor: B.bronze,
                    }}
                  />
                )}

                <div class="p-4 flex items-center gap-4">
                  {/* Case number badge */}
                  <div
                    class="w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border"
                    style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    {done ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5l3.5 3.5L13 4" stroke={B.bronze} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    ) : (
                      <span class="text-white/30 text-xs font-mono">
                        {String(INVESTIGATIONS.indexOf(inv) + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div class="flex-1 min-w-0">
                    <h3
                      style="font-family: var(--font-display);"
                      class="text-[15px] text-white leading-snug"
                    >
                      {inv.title}
                    </h3>
                    <p class="text-[11px] text-white/40 mt-0.5 leading-relaxed truncate">
                      {inv.subtitle}
                    </p>
                  </div>

                  {/* Meta */}
                  <div class="flex flex-col items-end gap-1 shrink-0">
                    <span class="text-[10px] text-white/25">{inv.chapters} ch</span>
                    {done && (
                      <span class="text-[10px] font-medium" style={{ color: B.bronze }}>
                        {done.score}/{inv.chapters}
                      </span>
                    )}
                  </div>

                  {/* Arrow */}
                  <div class="text-white/20 group-hover:text-white transition-colors text-sm shrink-0">
                    &rarr;
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
