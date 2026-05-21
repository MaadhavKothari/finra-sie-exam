import { useState } from 'preact/hooks';

export interface Story {
  id: string;
  title: string;
  dateRange: string;
  summary: string;
  whyItMatters: string;
  ruleConnection: string;
  primarySource: { name: string; url: string };
  furtherReading?: { name: string; url: string }[];
  tags?: string[];
  verifiedOn: string;
}

interface Props {
  story: Story;
  defaultOpen?: boolean;
}

/**
 * Real-world case card shown after a question is answered.
 * Collapsed by default to keep the answer-reveal pane focused; user
 * taps to expand the full story. Source link opens in a new tab.
 */
export default function StoryCard({ story, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      class="border border-[#E5E0D8] bg-white rounded-sm overflow-hidden"
      style="animation: fadeIn 0.35s ease-in;"
    >
      {/* Header — always visible, clickable to expand */}
      <button
        onClick={() => setOpen((o) => !o)}
        class="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#F4EFE7] transition-colors group"
        aria-expanded={open}
      >
        <span class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold shrink-0 mt-1">
          [ Real-world case ]
        </span>
        <div class="flex-1 min-w-0">
          <h3 style="font-family: var(--font-display);" class="text-[15px] text-black leading-snug">
            {story.title}
          </h3>
          <p class="text-xs text-[#6b6560] mt-0.5">{story.dateRange}</p>
        </div>
        <span class={`text-[#8F5A39] text-sm shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>

      {/* Expanded body */}
      {open && (
        <div class="px-4 pb-4 pt-1 border-t border-[#E5E0D8] space-y-3">
          <p class="text-sm text-black leading-relaxed">{story.summary}</p>

          <div>
            <p class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] font-semibold mb-1">
              Why it matters
            </p>
            <p class="text-sm text-black leading-relaxed">{story.whyItMatters}</p>
          </div>

          <div class="bg-[#F4EFE7] border border-[#E5E0D8] rounded-sm px-3 py-2">
            <p class="text-[10px] uppercase tracking-[0.15em] text-[#8F5A39] font-semibold mb-0.5">
              Connects to
            </p>
            <p class="text-xs text-black leading-relaxed">{story.ruleConnection}</p>
          </div>

          <div class="flex items-center justify-between gap-3 pt-1">
            <a
              href={story.primarySource.url}
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-[#8F5A39] hover:text-black underline underline-offset-2 decoration-[#E5E0D8] hover:decoration-black transition-colors"
            >
              {story.primarySource.name} ↗
            </a>
            <span class="text-[10px] text-[#6b6560]">Verified {story.verifiedOn}</span>
          </div>

          {story.furtherReading && story.furtherReading.length > 0 && (
            <div class="pt-1 border-t border-[#E5E0D8]">
              <p class="text-[10px] uppercase tracking-[0.15em] text-[#6b6560] font-semibold mb-1.5">
                Further reading
              </p>
              <ul class="space-y-1">
                {story.furtherReading.map((ref) => (
                  <li key={ref.url}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-[#8F5A39] hover:text-black underline underline-offset-2 decoration-[#E5E0D8] hover:decoration-black transition-colors"
                    >
                      {ref.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
