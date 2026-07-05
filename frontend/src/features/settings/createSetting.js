import { createStore, useStore } from '../location/createStore';

// Factory for a per-device preference: an observable store fronting a persisted
// value, with validation and an optional side-effect on change. Collapses the
// store + normalize + persist + subscribe-hook skeleton that every setting
// (map quality, base style, reduce motion, …) otherwise re-implements.
//
//   read      () => raw stored value (from client.js — the only storage toucher)
//   write     (v) => persist the normalized value (from client.js)
//   normalize (raw) => a valid value  (defaults to identity)
//   onChange  (v) => side-effect after each change  (optional; also run at init
//                    is the caller's job via the returned `get`)
//
// Returns { get, set, use } — `use()` is a hook returning the live value.
export function createSetting({ read, write, normalize = (v) => v, onChange }) {
  const store = createStore(normalize(read()));

  function set(value) {
    const next = normalize(value);
    write(next);
    store.set(next);
    onChange?.(next);
  }

  return {
    get: () => store.get(),
    set,
    use: () => [useStore(store), set],
  };
}

// Builds a `normalize` that coerces any value to a key of `dict`, else `fallback`.
export function keyNormalizer(dict, fallback) {
  return (v) => (v && Object.prototype.hasOwnProperty.call(dict, v) ? v : fallback);
}
