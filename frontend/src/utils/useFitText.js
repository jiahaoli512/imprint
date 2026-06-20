import { useLayoutEffect } from 'react';

// Shrinks an element's font-size so its content fits within its parent's width,
// down to `min` px. With `singleLine` (default), the element is forced onto one
// line; otherwise it keeps wrapping and only shrinks when its content still
// overflows (e.g. one non-breaking segment is wider than a line). No-op when
// `enabled` is false (e.g. web). Re-fits on width changes and once the display
// font has loaded. Measures layout width (scrollWidth) — unaffected by CSS
// transforms like the greeting's wave.
export function useFitText(ref, deps = [], { min = 12, enabled = true, singleLine = true } = {}) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (singleLine) el.style.whiteSpace = 'nowrap';

    const fit = () => {
      el.style.fontSize = '';
      const avail = (el.parentElement?.clientWidth ?? 0) - 2;
      if (avail <= 0) return;
      const w = el.scrollWidth;
      if (w > avail) {
        const base = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = `${Math.max(min, (base * avail) / w)}px`;
      }
    };

    fit();
    // Width-only guard: changing font-size alters height, which must not loop.
    let lastW = el.parentElement?.clientWidth ?? -1;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w !== lastW) { lastW = w; fit(); }
    });
    if (el.parentElement) ro.observe(el.parentElement);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [enabled, singleLine, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}
