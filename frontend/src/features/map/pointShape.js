import { createSetting, keyNormalizer } from '../../utils/createSetting';
import { getStoredPointShape, setStoredPointShape } from '../../api/client';

export const POINT_SHAPE_ORDER = ['dot', 'pin'];
export const POINT_SHAPE_LABEL = { dot: 'Dot', pin: 'Pin' };
export const DEFAULT_POINT_SHAPE = 'dot';

// POINT_SHAPE_LABEL doubles as the keyNormalizer dict — its keys are exactly
// the valid shape values, so there's no need for a second, otherwise-identical
// lookup object.
const pointShape = createSetting({
  read: getStoredPointShape,
  write: setStoredPointShape,
  normalize: keyNormalizer(POINT_SHAPE_LABEL, DEFAULT_POINT_SHAPE),
});

export const setPointShape = pointShape.set;
// [shape, setPointShape] — subscribes so any consumer re-renders on change.
export const usePointShape = pointShape.use;
