import { useState, useEffect } from 'react';

// Local state seeded from `value` that re-syncs whenever `value` changes from the
// outside. For an editable field that keeps a transient buffer (partial/invalid
// typing) yet still reflects external updates (a slider move, a preset click, a
// reset). Centralizes the one sanctioned set-state-in-effect for this pattern.
export function useSyncedState(value) {
  const [local, setLocal] = useState(value);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setLocal(value), [value]);
  return [local, setLocal];
}
