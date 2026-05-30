// Black Swan day visual layer. Subtle. No copy. No announcement.
// Mounts on home + question pages; checks isBlackSwan(today) and renders:
//   • A faint 🦢 watermark in the bottom-right (low-opacity SVG)
//   • A barely-there body tint via a data attribute
// Tasteful intrusion only. Discovery is the reward.

import { useEffect, useState } from 'preact/hooks';
import { isBlackSwan } from '../lib/greedIndex';
import { soundBlackSwan } from '../lib/sounds';

export default function BlackSwanLayer() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const on = isBlackSwan(today);
    setActive(on);
    if (on) {
      document.documentElement.setAttribute('data-swan', '1');
      // Single distant gong on first home load that day. Quiet — discovery is the reward.
      const key = 'sie-swan-played:' + today;
      if (!localStorage.getItem(key)) {
        // Small delay so audio context can resolve after user interaction.
        setTimeout(() => soundBlackSwan(), 800);
        localStorage.setItem(key, '1');
      }
    }
    return () => {
      document.documentElement.removeAttribute('data-swan');
    };
  }, []);

  if (!active) return null;
  return (
    <div
      aria-hidden="true"
      class="pointer-events-none fixed bottom-3 right-3 z-10 opacity-[0.07] select-none"
      style="font-size: 56px; line-height: 1;"
    >
      🦢
    </div>
  );
}
