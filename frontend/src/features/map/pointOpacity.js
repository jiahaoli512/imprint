import { createSetting } from '../settings/createSetting';
import { getStoredPointOpacity, setStoredPointOpacity } from '../../api/client';

// Per-device point opacity, as a percentage from -100 to +100 with 0 the default.
// +100% is fully opaque, -100% fully transparent, and 0% the midpoint — a bipolar
// slider where every position changes how solid the markers look.
export const DEFAULT_OPACITY = 0;
export const MIN_OPACITY = -100;
export const MAX_OPACITY = 100;

function normalize(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return DEFAULT_OPACITY;
  return Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, n));
}

const opacity = createSetting({
  read: getStoredPointOpacity,
  write: setStoredPointOpacity,
  normalize,
});

export const setPointOpacity = opacity.set;
// [opacity, setPointOpacity] — subscribes so consumers re-render.
export const usePointOpacity = opacity.use;

// Map the -100..+100 percentage to a 0..1 fill opacity: -100% → 0 (transparent),
// 0% → 0.5, +100% → 1 (fully opaque).
export const opacityFromPercent = (p) => Math.min(1, Math.max(0, (p + 100) / 200));
