import { useRef, useState, useEffect } from 'react';

const SWIPE_THRESHOLD = 50; // px of horizontal drag before a swipe commits to the next/prev page
const AXIS_LOCK = 8;        // px of movement before a touch gesture is read as horizontal vs vertical
const SLIDE_MS = 340;       // page-slide tween duration

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

// Drives a horizontal, wrap-around carousel of `count` equal-width pages: arrows/
// dots ease smoothly between pages, and a touch swipe drags the strip with the
// finger in real time and snaps to the nearest page on release.
//
// The strip's translateX is driven by a JS requestAnimationFrame tween, not a CSS
// transition — WebKit/iOS repeatedly refused to animate the transform transition
// here (it would sit still, then jump), whereas setting the transform every frame
// always animates.
//
// Wrap-around (last <-> first) uses two "clone" slots at either end of the strip:
// the caller renders `slotCount = count + 2` pages — a clone of the last category,
// then the real categories, then a clone of the first — and stepping past an end
// eases into the neighbouring clone. Once that tween lands, the strip silently
// re-anchors to the corresponding REAL slot with no transition; since the clone
// and the real page render identical content, the re-anchor is invisible. Direct
// jumps (`goTo`, e.g. a dot click) skip the clones and slide straight to the
// target — only the ±1 stepping used by arrows/swipes (`step`) wraps.
export function useSlideCarousel(count, { reduceMotion = false } = {}) {
  const wraps = count > 1;
  const slotCount = wraps ? count + 2 : count;
  const toSlot = (i) => (wraps ? i + 1 : i); // real category index -> its resting slot

  const [index, setIndex] = useState(0);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  // The touch-drag effect below binds its listeners once per `count` (so touchmove
  // stays a stable non-passive listener instead of rebinding every render) — which
  // means its closures never see a fresh `index` state value. Everything it reads
  // goes through this ref instead, kept in sync by the effect right below.
  const indexRef = useRef(0);
  const offsetRef = useRef(0); // current track translateX, px
  const rafRef = useRef(0);
  // Same rationale as indexRef: the touch effect's closures (step/goTo/
  // animateOffset) are frozen at mount, so animateOffset must read the *current*
  // reduce-motion preference through a ref rather than the `reduceMotion` param
  // directly, or toggling it mid-session wouldn't affect an in-progress gesture.
  const reduceMotionRef = useRef(reduceMotion);

  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { reduceMotionRef.current = reduceMotion; }, [reduceMotion]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const pageWidth = () => viewportRef.current?.clientWidth || 0;
  const setOffset = (px) => {
    offsetRef.current = px;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${px}px)`;
  };
  // Tween the track to `targetPx`, then run `onDone` — used to silently re-anchor
  // off a clone slot once a wrap's slide has visibly landed.
  const animateOffset = (targetPx, onDone) => {
    cancelAnimationFrame(rafRef.current);
    const start = offsetRef.current;
    const dist = targetPx - start;
    if (reduceMotionRef.current || Math.abs(dist) < 0.5) { setOffset(targetPx); onDone?.(); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / SLIDE_MS);
      setOffset(start + dist * easeOutCubic(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else onDone?.();
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // Keep the strip positioned on the active page across mount and viewport resizes.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const reposition = () => setOffset(-toSlot(indexRef.current) * el.clientWidth);
    reposition();
    const ro = new ResizeObserver(reposition);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wraps]);

  // Direct jump to `target` (e.g. a dot click) — no wrap, just the shortest slide
  // across the real slot range.
  const goTo = (target) => {
    const t = clamp(target, 0, count - 1);
    if (t === indexRef.current) return;
    indexRef.current = t; // sync immediately; the [index] effect confirms it next render
    setIndex(t);
    animateOffset(-toSlot(t) * pageWidth());
  };

  // ±1 step (arrows / swipe) — wraps at the ends via the clone slots.
  const step = (d) => {
    const i = indexRef.current;
    if (!wraps) { goTo(i + d); return; }
    const atRightEdge = d > 0 && i === count - 1;
    const atLeftEdge = d < 0 && i === 0;
    if (!atRightEdge && !atLeftEdge) { goTo(i + d); return; }
    const next = atRightEdge ? 0 : count - 1;
    const cloneSlot = atRightEdge ? slotCount - 1 : 0; // clone-first / clone-last
    animateOffset(-cloneSlot * pageWidth(), () => {
      indexRef.current = next;
      setIndex(next);
      setOffset(-toSlot(next) * pageWidth()); // silent re-anchor off the clone
    });
  };

  // Touch drag: follow the finger horizontally; a mostly-vertical drag is left
  // alone so it scrolls the page instead. Bound imperatively (not via React props)
  // so touchmove is non-passive and can preventDefault once the gesture locks
  // horizontal.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || count < 2) return undefined;
    let g = null;

    const onStart = (e) => {
      cancelAnimationFrame(rafRef.current);
      const t = e.touches[0];
      g = { x0: t.clientX, y0: t.clientY, base: offsetRef.current, axis: null, dx: 0 };
    };
    const onMove = (e) => {
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x0;
      const dy = t.clientY - g.y0;
      if (g.axis == null) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > AXIS_LOCK) g.axis = 'x';
        else if (Math.abs(dy) > AXIS_LOCK) g.axis = 'y';
      }
      if (g.axis === 'x') {
        e.preventDefault();
        g.dx = dx;
        // Clamp to the strip's full extent so a very long drag can't overshoot
        // past the outer clone slots.
        setOffset(clamp(g.base + dx, -(slotCount - 1) * el.clientWidth, 0));
      }
    };
    const onEnd = () => {
      if (!g) return;
      const { axis, dx } = g;
      g = null;
      if (axis !== 'x') return;
      if (dx <= -SWIPE_THRESHOLD) step(1);
      else if (dx >= SWIPE_THRESHOLD) step(-1);
      else animateOffset(-toSlot(indexRef.current) * el.clientWidth); // snap back
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, wraps]);

  return { index, viewportRef, trackRef, slotCount, toSlot, goTo, step };
}
