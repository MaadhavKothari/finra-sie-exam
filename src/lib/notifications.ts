// Capacitor LocalNotifications wrapper.
// Wall Street deadpan copy. Terse, factual, with a number. No cute, no apologetic, no urgent-screaming.
// All public functions are no-ops on web/SSR so callers don't need to guard.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type PermissionStatus } from '@capacitor/local-notifications';
import { $progress } from '../stores/progress';
import { $hotSheetCards } from '../stores/hotSheet';
import { $settings, markPermAsked } from '../stores/settings';
import { isDue } from './srs';

// Stable IDs. iOS uses Int32; keep them small.
const NID_BELL = 100;
const NID_HOTSHEET = 101;
const NID_STREAK_RISK = 102;
const ALL_IDS = [NID_BELL, NID_HOTSHEET, NID_STREAK_RISK];

function isNative(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

export async function getPermissionState(): Promise<PermissionStatus['display'] | 'unsupported'> {
  if (!isNative()) return 'unsupported';
  try {
    const r = await LocalNotifications.checkPermissions();
    return r.display;
  } catch {
    return 'unsupported';
  }
}

export async function requestPermission(): Promise<PermissionStatus['display'] | 'unsupported'> {
  if (!isNative()) return 'unsupported';
  try {
    const r = await LocalNotifications.requestPermissions();
    markPermAsked();
    return r.display;
  } catch {
    return 'unsupported';
  }
}

async function cancelOurs() {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({ notifications: ALL_IDS.map((id) => ({ id })) });
  } catch {
    // ignore — cancel of non-existent IDs is benign
  }
}

interface ScheduledItem {
  id: number;
  title: string;
  body: string;
  hour: number;
  minute: number;
}

function buildSchedule(): ScheduledItem[] {
  const p = $progress.get();
  const s = $settings.get();
  const items: ScheduledItem[] = [];

  const streak = parseInt(p.streak || '0', 10);
  const dailyAnswered = (() => {
    const today = new Date().toISOString().split('T')[0];
    return p.dailyDate === today ? parseInt(p.dailyAnswered || '0', 10) : 0;
  })();
  const dueCount = $hotSheetCards.get().filter(isDue).length;

  // M1 — Opening Bell pre-alert. Skip for fresh users to avoid noise.
  if (s.notifBell === '1' && streak >= 3) {
    items.push({
      id: NID_BELL,
      title: 'Opening Bell',
      body: `Bell in 5 minutes. ${streak}-day run on the line.`,
      hour: 9,
      minute: 25,
    });
  }

  // M3 — Hot Sheet evening reminder. Skip if no cards due.
  if (s.notifHotSheet === '1' && dueCount > 0) {
    const noun = dueCount === 1 ? 'card' : 'cards';
    items.push({
      id: NID_HOTSHEET,
      title: 'Hot Sheet',
      body: `${dueCount} ${noun} due. Close them before midnight.`,
      hour: 20,
      minute: 30,
    });
  }

  // M2 — Streak risk. Only matters if user has a streak and hasn't met daily floor.
  if (s.notifStreakRisk === '1' && streak > 0 && dailyAnswered < 3) {
    const needed = 3 - dailyAnswered;
    const qWord = needed === 1 ? 'question' : 'questions';
    items.push({
      id: NID_STREAK_RISK,
      title: 'Streak risk',
      body: `${streak}-day run closes in 15 minutes. ${needed} ${qWord} to save it.`,
      hour: 23,
      minute: 45,
    });
  }

  return items;
}

/**
 * Cancel all of our notifications and reschedule based on current state.
 * Safe to call frequently; no-op on web. Called from app load, settings changes,
 * and after recordAnswer / recordBellResult.
 */
export async function reschedule(): Promise<void> {
  if (!isNative()) return;
  // Master toggle off → just cancel and exit.
  if ($settings.get().notifEnabled !== '1') {
    await cancelOurs();
    return;
  }
  // No permission → don't even try to schedule; OS would silently drop.
  const perm = await getPermissionState();
  if (perm !== 'granted') {
    await cancelOurs();
    return;
  }

  await cancelOurs();
  const items = buildSchedule();
  if (items.length === 0) return;
  try {
    await LocalNotifications.schedule({
      notifications: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: {
          on: { hour: n.hour, minute: n.minute },
          repeats: true,
          allowWhileIdle: true,
        },
      })),
    });
  } catch {
    // ignore — scheduling failures are non-fatal
  }
}

/** Fire-and-forget variant for sync call sites (e.g., recordAnswer). */
export function rescheduleFireForget(): void {
  void reschedule();
}

/** Cancel everything — for "turn off notifications" path. */
export async function cancelAll(): Promise<void> {
  await cancelOurs();
}
