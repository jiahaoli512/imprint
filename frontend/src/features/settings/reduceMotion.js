import { createSetting } from './createSetting';
import { getStoredReduceMotion, setStoredReduceMotion } from '../../api/client';

// Reflect the current value onto <html> so the CSS rule takes effect.
function applyAttr(on) {
  if (on) document.documentElement.setAttribute('data-reduce-motion', '');
  else document.documentElement.removeAttribute('data-reduce-motion');
}

// Per-device "reduce motion" preference. When on, a [data-reduce-motion] attribute
// on <html> triggers the CSS that zeroes every animation/transition (mirroring the
// prefers-reduced-motion media query) — a manual override on top of the OS setting.
// `onChange` keeps the <html> attribute in sync on every change.
const reduceMotion = createSetting({
  read: getStoredReduceMotion,
  write: setStoredReduceMotion,
  onChange: applyAttr,
});

export const setReduceMotion = reduceMotion.set;
// [reduceMotion, setReduceMotion] — subscribes so consumers re-render on change.
export const useReduceMotion = reduceMotion.use;

// Called once at startup (main.jsx) so motion is disabled from first paint, not
// only after the settings UI mounts.
export function applyReduceMotion() {
  applyAttr(reduceMotion.get());
}
