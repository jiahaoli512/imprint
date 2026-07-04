import { useState, useEffect } from 'react';
import { createStore } from '../location/createStore';
import { getStoredReduceMotion, setStoredReduceMotion } from '../../api/client';

// Per-device "reduce motion" preference. When on, a [data-reduce-motion] attribute
// on <html> triggers the CSS that zeroes every animation/transition (mirroring the
// prefers-reduced-motion media query) — a manual override on top of the OS setting.
const store = createStore(getStoredReduceMotion());

// Reflect the current value onto <html> so the CSS rule takes effect.
function applyAttr(on) {
  if (on) document.documentElement.setAttribute('data-reduce-motion', '');
  else document.documentElement.removeAttribute('data-reduce-motion');
}

// Called once at startup (main.jsx) so motion is disabled from first paint, not
// only after the settings UI mounts.
export function applyReduceMotion() {
  applyAttr(store.get());
}

export function setReduceMotion(on) {
  setStoredReduceMotion(on); // persist per-device
  store.set(on);
  applyAttr(on);
}

// [reduceMotion, setReduceMotion] — subscribes so consumers re-render on change.
export function useReduceMotion() {
  const [on, setLocal] = useState(store.get());
  useEffect(() => store.subscribe(setLocal), []);
  return [on, setReduceMotion];
}
