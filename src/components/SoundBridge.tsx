// Mounts once on the home page. Listens to the settings store and pushes
// changes into sounds.ts so the audio module respects the user's toggles.

import { useEffect } from 'preact/hooks';
import { $settings } from '../stores/settings';
import { setSoundEnabled, setSoundVolume } from '../lib/sounds';

export default function SoundBridge() {
  useEffect(() => {
    function sync() {
      const s = $settings.get();
      setSoundEnabled(s.soundEnabled === '1');
      setSoundVolume(parseInt(s.soundVolume || '50', 10) / 100);
    }
    sync();
    const unsub = $settings.subscribe(sync);
    return () => unsub();
  }, []);
  return null;
}
