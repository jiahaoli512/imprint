import { createSetting } from '../settings/createSetting';
import { getStoredPointTransparency, setStoredPointTransparency } from '../../api/client';

// Per-device point transparency, as a percentage from -100 to +100 with 0 as the
// default (points render fully opaque, unchanged). Positive values fade the
// points toward invisible; negative values keep them fully opaque (clamped — the
// default is already opaque, so there's nothing more solid to reach).
export const DEFAULT_TRANSPARENCY = 0;
export const MIN_TRANSPARENCY = -100;
export const MAX_TRANSPARENCY = 100;

function normalize(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return DEFAULT_TRANSPARENCY;
  return Math.min(MAX_TRANSPARENCY, Math.max(MIN_TRANSPARENCY, n));
}

const transparency = createSetting({
  read: getStoredPointTransparency,
  write: setStoredPointTransparency,
  normalize,
});

export const setPointTransparency = transparency.set;
// [transparency, setPointTransparency] — subscribes so consumers re-render.
export const usePointTransparency = transparency.use;

// Map the -100..+100 transparency to a 0..1 fill opacity (0% → 1 opaque,
// +100% → 0 invisible; negatives clamp to fully opaque).
export const opacityFromTransparency = (t) => Math.min(1, Math.max(0, 1 - t / 100));
