// A minimal observable store: holds a value and notifies subscribers when it
// changes. Used by the module-level location/tracking state that must persist
// across component mounts. `set` accepts a new value or an updater function.
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get: () => state,
    set: (next) => {
      state = typeof next === 'function' ? next(state) : next;
      for (const listener of listeners) listener(state);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
