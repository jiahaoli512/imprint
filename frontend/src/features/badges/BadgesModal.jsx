import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Modal from '../../components/Modal';
import Badge from './Badge';
import { BADGE_CATEGORIES } from './categories';
import { useVisitedStates } from './useVisitedStates';
import { useVisitedCountries } from './useVisitedCountries';
import { useReduceMotion } from '../settings/reduceMotion';

const SWIPE_THRESHOLD = 50; // px of horizontal drag before a swipe advances a page
const AXIS_LOCK = 8;        // px of movement before we decide the gesture is horizontal vs vertical
const EDGE_RESIST = 0.35;   // rubber-band factor when dragging past the first / last page
const SLIDE_MS = 340;       // page-slide tween duration
const FILTERABLE_MIN = 12;  // show search + continent filter past this many badges
const isNative = Capacitor.isNativePlatform();

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

// Popup that pages through badge categories one at a time. Paging is a real
// horizontal carousel: every category is mounted once side-by-side in a strip and
// the strip's translateX is animated by page index. The slide is driven by a JS
// requestAnimationFrame tween (not a CSS transition) — WebKit/iOS repeatedly
// refused to animate the CSS transform transition here (it snapped), whereas
// setting the transform each frame always animates. A touch swipe drags the strip
// with the finger in real time and tweens to the snapped page on release. Mounting
// all pages up front keeps paging cheap (nothing heavy mounts mid-slide). Large
// categories (e.g. Passports) get a name search + continent filter. Generic over
// the registry — adding a category is a new file + a line in ./categories.
export default function BadgesModal({ user, markers, onClose }) {
  const count = BADGE_CATEGORIES.length;
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // selected continents; [] = All
  const [status, setStatus] = useState('all');  // all | unlocked | locked
  const [showTop, setShowTop] = useState(false); // scroll-to-top affordance
  const [showHint, setShowHint] = useState(false); // "more below" scroll hint
  const [reduceMotion] = useReduceMotion();
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const pageRefs = useRef([]);   // per-page scroll containers
  const indexRef = useRef(0);    // current index for imperative handlers (avoids stale closures)
  const offsetRef = useRef(0);   // current track translateX in px
  const rafRef = useRef(0);
  useEffect(() => { indexRef.current = index; }, [index]);

  const category = BADGE_CATEGORIES[index];
  // All pages are mounted, so resolve every category's visited-geo up front (each
  // hook keeps its Set, so a given atlas loads once). Geo-less categories are no-ops.
  const visitedStates = useVisitedStates(markers, true);
  const visitedCountries = useVisitedCountries(markers, true);
  const ctx = { user, markers, visitedStates, visitedCountries };

  // Imperatively position/animate the strip. Kept off React state so a 60fps tween
  // (and finger tracking) doesn't rerender the heavy grid each frame.
  const pageWidth = () => viewportRef.current?.clientWidth || 0;
  const setOffset = (px) => {
    offsetRef.current = px;
    if (trackRef.current) trackRef.current.style.transform = `translateX(${px}px)`;
  };
  const animateOffset = (target) => {
    cancelAnimationFrame(rafRef.current);
    const start = offsetRef.current;
    const dist = target - start;
    if (reduceMotion || Math.abs(dist) < 0.5) { setOffset(target); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / SLIDE_MS);
      setOffset(start + dist * easeOutCubic(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // Keep the strip positioned on the active page across mount and viewport resizes.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const reposition = () => setOffset(-indexRef.current * el.clientWidth);
    reposition();
    const ro = new ResizeObserver(reposition);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Scroll affordances follow the active page: a scroll-to-top button past the
  // header, and a "more below" fade + chevron that hides at the end (or when
  // nothing scrolls). Rebinds when the active page (or its filtered height) changes.
  useEffect(() => {
    const el = pageRefs.current[index];
    if (!el) return undefined;
    const update = () => {
      setShowTop(el.scrollTop > 240);
      const canScroll = el.scrollHeight - el.clientHeight > 4;
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      setShowHint(canScroll && !atEnd);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [index, query, status, selected]);

  // Each category opens at the top of its own list.
  useEffect(() => {
    const el = pageRefs.current[index];
    if (el) el.scrollTop = 0;
  }, [index]);

  const scrollToTop = () => pageRefs.current[index]?.scrollTo({ top: 0, behavior: 'smooth' });

  // Navigate to a page (clamped — the carousel doesn't wrap), resetting the
  // per-category filters, and tween the strip to it.
  const goTo = (target) => {
    const t = clamp(target, 0, count - 1);
    if (t === index) return;
    setIndex(t);
    setQuery('');
    setSelected([]);
    setStatus('all');
    animateOffset(-t * pageWidth());
  };
  const go = (d) => goTo(index + d);

  // Touch drag: follow the finger horizontally, letting vertical drags scroll the
  // list. Bound imperatively (not via React props) so touchmove is non-passive and
  // can preventDefault once the gesture locks horizontal.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || count < 2) return undefined;
    let g = null;

    const onStart = (e) => {
      cancelAnimationFrame(rafRef.current);
      const t = e.touches[0];
      g = { x0: t.clientX, y0: t.clientY, w: el.clientWidth, base: offsetRef.current, axis: null, dx: 0 };
    };
    const onMove = (e) => {
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x0;
      const dy = t.clientY - g.y0;
      if (g.axis == null) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > AXIS_LOCK) g.axis = 'x';
        else if (Math.abs(dy) > AXIS_LOCK) g.axis = 'y'; // let the list scroll
      }
      if (g.axis === 'x') {
        e.preventDefault(); // stop the vertical list from scrolling mid-swipe
        g.dx = dx;
        const i = indexRef.current;
        const past = (i === 0 && dx > 0) || (i === count - 1 && dx < 0);
        setOffset(g.base + (past ? dx * EDGE_RESIST : dx));
      }
    };
    const onEnd = () => {
      if (!g) return;
      const swipe = g.axis === 'x';
      const dx = g.dx;
      g = null;
      if (!swipe) return;
      const i = indexRef.current;
      if (dx <= -SWIPE_THRESHOLD && i < count - 1) goTo(i + 1);
      else if (dx >= SWIPE_THRESHOLD && i > 0) goTo(i - 1);
      else animateOffset(-i * el.clientWidth); // snap back
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
  }, [count]);

  const badges = category.getBadges(ctx);
  const earnedCount = badges.filter((b) => b.earned).length;
  const earnedPct = badges.length ? Math.round((earnedCount / badges.length) * 100) : 0;

  const filterable = badges.length > FILTERABLE_MIN;
  // Continent options derived from the badges that carry a continent.
  const continents = filterable
    ? [...new Set(badges.map((b) => b.continent).filter(Boolean))].sort()
    : [];
  const statusOk = (b) => status === 'all' || (status === 'unlocked' ? b.earned : !b.earned);

  // Toggle a continent. Selecting all of them, or clearing the last one,
  // collapses back to "All" (an empty selection).
  const toggleContinent = (c) => {
    setSelected((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c];
      return next.length === 0 || next.length === continents.length ? [] : next;
    });
  };

  // A single carousel page. The active page honours the search/status/continent
  // filters; the others render unfiltered (their filters are default until active).
  const renderPage = (cat, active) => {
    const bs = cat.getBadges(ctx);
    if (bs.length === 0) {
      return <div className="badge-empty">No badges in this category yet — coming soon.</div>;
    }
    const q = query.trim().toLowerCase();
    const vis = active
      ? bs.filter((b) =>
        statusOk(b) &&
        (selected.length === 0 || selected.includes(b.continent)) &&
        (!q || b.label.toLowerCase().includes(q)))
      : bs;
    return vis.length > 0
      ? <div className="badge-grid">{vis.map((b) => <Badge key={b.key} badge={b} />)}</div>
      : <div className="badge-empty">No matches.</div>;
  };

  return (
    <Modal onClose={onClose} icon={false} closable className="modal-badges">
      <div className="badge-nav">
        {count > 1 && (
          <button className="icon-btn badge-nav-arrow" onClick={() => go(-1)} disabled={index === 0} aria-label="Previous category">
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="badge-nav-title">
          <h2 className="modal-title">{category.title}</h2>
          <p className="modal-sub" style={{ marginBottom: 0 }}>{category.subtitle}</p>
          {badges.length > 0 && (
            <p className="badge-progress">{earnedCount} / {badges.length} earned ({earnedPct}%)</p>
          )}
        </div>
        {count > 1 && (
          <button className="icon-btn badge-nav-arrow" onClick={() => go(1)} disabled={index === count - 1} aria-label="Next category">
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {badges.length > 0 && (
        <div className="badge-filters">
          {filterable && (
            <input
              className="badge-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${category.title.toLowerCase()}…`}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={isNative ? { fontSize: '16px' } : undefined}
            />
          )}
          {/* Lock status — shown for every category. */}
          <div className="badge-chips">
            {[['all', 'All'], ['unlocked', 'Unlocked'], ['locked', 'Locked']].map(([val, label]) => (
              <button
                key={val}
                className={`badge-chip ${status === val ? 'is-active' : ''}`}
                onClick={() => setStatus(val)}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Region filter — only when the category's badges carry continents
              (Passports). Categories without them (e.g. US states) skip it. */}
          {continents.length > 0 && (
            <div className="badge-chips">
              <button
                className={`badge-chip ${selected.length === 0 ? 'is-active' : ''}`}
                onClick={() => setSelected([])}
              >
                All
              </button>
              {continents.map((c) => (
                <button
                  key={c}
                  className={`badge-chip ${selected.includes(c) ? 'is-active' : ''}`}
                  onClick={() => toggleContinent(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="badge-scroll-region">
        <div className="badge-carousel" ref={viewportRef}>
          <div className="badge-track" ref={trackRef} style={{ width: `${count * 100}%` }}>
            {BADGE_CATEGORIES.map((cat, i) => (
              <div
                className="badge-page"
                key={cat.id}
                ref={(el) => { pageRefs.current[i] = el; }}
                style={{ width: `${100 / count}%` }}
                aria-hidden={i !== index}
              >
                {renderPage(cat, i === index)}
              </div>
            ))}
          </div>
        </div>
        {showTop && (
          <button className="icon-btn badge-scrolltop" onClick={scrollToTop} aria-label="Scroll to top">
            <ChevronUp size={20} />
          </button>
        )}
        <div className={`badge-scroll-hint${showHint ? '' : ' badge-scroll-hint-hidden'}`} aria-hidden="true">
          <ChevronDown size={20} />
        </div>
      </div>

      {count > 1 && (
        <div className="badge-dots">
          {BADGE_CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              className={`badge-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to ${c.title}`}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
