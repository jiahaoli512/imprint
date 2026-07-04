import { useEffect, useRef } from 'react';

// Calls `onDismiss` when the user clicks outside `ref` (and, if `escape` is set,
// on the Escape key). Shared by the notification bell and the user-search
// dropdown, which both need the same "close when you click away" behavior.
// `active` lets callers subscribe only while the thing is open. The handler is
// kept in a ref so a new closure each render doesn't re-subscribe the listeners.
export function useDismiss(ref, onDismiss, { active = true, escape = false } = {}) {
  const handlerRef = useRef(onDismiss);
  useEffect(() => { handlerRef.current = onDismiss; });

  useEffect(() => {
    if (!active) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) handlerRef.current(e); };
    const onKey = (e) => { if (escape && e.key === 'Escape') handlerRef.current(e); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [active, escape, ref]);
}
