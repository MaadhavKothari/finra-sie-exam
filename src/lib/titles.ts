// Trader ID title ladder + secret sub-titles.
// XP thresholds follow the investment-bank promotion arc.

export interface Title {
  id: string;
  name: string;
  minXp: number;
}

export const TITLE_LADDER: Title[] = [
  { id: 'intern',           name: 'Intern',           minXp: 0 },
  { id: 'junior-associate', name: 'Junior Associate', minXp: 500 },
  { id: 'vp',               name: 'VP',               minXp: 2_500 },
  { id: 'svp',              name: 'SVP',              minXp: 10_000 },
  { id: 'md',               name: 'MD',               minXp: 30_000 },
  { id: 'partner',          name: 'Partner',          minXp: 75_000 },
];

export interface SecretTitle {
  id: string;
  name: string;
  description: string;
}

export const SECRET_TITLES: Record<string, SecretTitle> = {
  'diamond-hands': {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    description: '10 hard questions correct in a row.',
  },
  'bond-whisperer': {
    id: 'bond-whisperer',
    name: 'The Bond Whisperer',
    description: '50 debt-securities questions correct.',
  },
  'first-bell': {
    id: 'first-bell',
    name: 'First Bell',
    description: 'Rang your first Opening Bell.',
  },
  'cold-streak': {
    id: 'cold-streak',
    name: 'Cold Streak',
    description: 'Held a 30-day streak.',
  },
};

export function titleForXp(xp: number): Title {
  let current = TITLE_LADDER[0];
  for (const t of TITLE_LADDER) {
    if (xp >= t.minXp) current = t;
    else break;
  }
  return current;
}

export function nextTitle(xp: number): Title | null {
  for (const t of TITLE_LADDER) {
    if (xp < t.minXp) return t;
  }
  return null;
}

export function xpToNextTitle(xp: number): { current: number; needed: number; percent: number } | null {
  const cur = titleForXp(xp);
  const nxt = nextTitle(xp);
  if (!nxt) return null;
  const span = nxt.minXp - cur.minXp;
  const into = xp - cur.minXp;
  return {
    current: into,
    needed: span,
    percent: Math.min(100, Math.round((into / span) * 100)),
  };
}
