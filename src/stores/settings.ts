// Persistent settings store — theme and preferences.

import { persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';

export type Theme = 'light' | 'dark' | 'system';

export const $settings = persistentMap<{
  theme: Theme;
}>('sie-settings:', {
  theme: 'system',
});

export const $theme = computed($settings, (s) => s.theme as Theme);

/** Resolve effective theme (light or dark) based on system preference. */
export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function setTheme(theme: Theme) {
  $settings.setKey('theme', theme);
}
