import { useState, useEffect } from 'react';

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

// Subscribe a component to a store: returns its current value and re-renders on
// change. Replaces the repeated useState + useEffect(subscribe) boilerplate.
export function useStore(store) {
  const [value, setValue] = useState(store.get());
  useEffect(() => store.subscribe(setValue), [store]);
  return value;
}
