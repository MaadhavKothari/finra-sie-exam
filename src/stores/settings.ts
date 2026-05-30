// Persistent settings store — theme and preferences.

import { persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';

export type Theme = 'light' | 'dark' | 'system';

export const $settings = persistentMap<{
  theme: Theme;
  // Local notifications — opt-in, default off for App Store review hygiene.
  notifEnabled: string;       // '1' = master toggle on
  notifBell: string;          // '1' = schedule 9:25 AM Opening Bell pre-alert
  notifHotSheet: string;      // '1' = schedule 8:30 PM Hot Sheet reminder
  notifStreakRisk: string;    // '1' = schedule 11:45 PM streak-risk alert
  notifPermAsked: string;     // '1' = we've already prompted iOS for permission
  // Sound effects — also opt-in. App Store review hates surprise audio.
  soundEnabled: string;       // '1' = play SFX (correct/wrong/bell/etc.)
  soundVolume: string;        // 0..100 — master volume
  jinglesEnabled: string;     // '1' = play longer jingles (market open, session end)
}>('sie-settings:', {
  theme: 'system',
  notifEnabled: '',
  notifBell: '1',
  notifHotSheet: '1',
  notifStreakRisk: '1',
  notifPermAsked: '',
  soundEnabled: '',
  soundVolume: '50',
  jinglesEnabled: '1',
});

export const $theme = computed($settings, (s) => s.theme as Theme);

export const $notifEnabled = computed($settings, (s) => s.notifEnabled === '1');
export const $notifBell = computed($settings, (s) => s.notifBell === '1');
export const $notifHotSheet = computed($settings, (s) => s.notifHotSheet === '1');
export const $notifStreakRisk = computed($settings, (s) => s.notifStreakRisk === '1');
export const $soundEnabled = computed($settings, (s) => s.soundEnabled === '1');
export const $soundVolume = computed($settings, (s) => parseInt(s.soundVolume || '50', 10));
export const $jinglesEnabled = computed($settings, (s) => s.jinglesEnabled === '1');

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

export function setNotifEnabled(on: boolean) {
  $settings.setKey('notifEnabled', on ? '1' : '');
}

export function setNotifChannel(channel: 'bell' | 'hotSheet' | 'streakRisk', on: boolean) {
  const key = channel === 'bell' ? 'notifBell' : channel === 'hotSheet' ? 'notifHotSheet' : 'notifStreakRisk';
  $settings.setKey(key as any, on ? '1' : '');
}

export function markPermAsked() {
  $settings.setKey('notifPermAsked', '1');
}

export function setSoundEnabledKey(on: boolean) {
  $settings.setKey('soundEnabled', on ? '1' : '');
}
export function setJinglesEnabledKey(on: boolean) {
  $settings.setKey('jinglesEnabled', on ? '1' : '');
}
export function setSoundVolumeKey(v: number) {
  $settings.setKey('soundVolume', String(Math.max(0, Math.min(100, Math.round(v)))));
}
