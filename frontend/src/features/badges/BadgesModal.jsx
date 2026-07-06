import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Modal from '../../components/Modal';
import Badge from './Badge';
import { BADGE_CATEGORIES } from './categories';
import { useVisitedStates } from './useVisitedStates';
import { useVisitedCountries } from './useVisitedCountries';

const SWIPE_THRESHOLD = 50; // px of horizontal drag before a swipe commits the page
const AXIS_LOCK = 8;        // px of movement before we decide the gesture is horizontal vs vertical
const SLIDE_MS = 320;       // page-slide duration (must match the CSS transition below)
const SLIDE_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const FILTERABLE_MIN = 12;  // show search + continent filter past this many badges
const isNative = Capacitor.isNativePlatform();

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Popup that pages through badge categories one at a time. Paging is a real
// horizontal carousel: arrows/dots slide smoothly to the neighbour, and a touch
// swipe drags the track with your finger in real time, then snaps to the nearest
// page on release. Because there are only ever two pages on screen during a
// transition (current + target), wrap-around (last ↔ first) works without cloning
// the whole strip. Large categories (e.g. Passports) get a name search + continent
// filter. Generic over the registry — adding a category is a new file + a line in
// ./categories.
export default function BadgesModal({ user, markers, onClose }) {
  const count = BADGE_CATEGORIES.length;
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // selected continents; [] = All
  const [status, setStatus] = useState('all');  // all | unlocked | locked
  const [showTop, setShowTop] = useState(false); // scroll-to-top affordance
  const [showHint, setShowHint] = useState(false); // "more below" scroll hint
  // Active carousel transition, or null when resting on a single page.
  //   neighbor  — the category index sliding in
  //   from      — which side it enters from: 'right' (going next) | 'left' (going prev)
  //   tx        — current track translateX in px (0 = current page shown when from
  //               'right'; -w when from 'left', so the current page is the right cell)
  //   animating — true while a CSS transition is easing to the snap point
  const [slide, setSlide] = useState(null);
  const scrollRef = useRef(null);
  const animatingRef = useRef(false); // guards against overlapping transitions
  const timerRef = useRef(null);

  const category = BADGE_CATEGORIES[index];
  // Activate the (lazy, heavier) visited-geo hooks for the current category and,
  // during a transition, the neighbour sliding in — so its badges resolve while it
  // animates instead of popping in. Each hook keeps its resolved Set afterward, so
  // this only ever loads a given atlas once. Categories with no geo data are no-ops.
  const hot = slide?.neighbor;
  const wants = (id) => category.id === id || (hot != null && BADGE_CATEGORIES[hot].id === id);
  const visitedStates = useVisitedStates(markers, wants('states-us'));
  const visitedCountries = useVisitedCountries(markers, wants('countries'));
  const ctx = { user, markers, visitedStates, visitedCountries };

  // Scroll affordances on the (persistent) viewport: a scroll-to-top button past
  // the header, and a "more below" fade + chevron that hides at the end (or when
  // nothing scrolls). The viewport element is stable across page changes, so this
  // binds once.
  useEffect(() => {
    const el = scrollRef.current;
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
  }, []);

  // Re-evaluate the hint when the visible content changes height (page switch or
  // filter change) without firing a scroll event.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const canScroll = el.scrollHeight - el.clientHeight > 4;
    setShowHint(canScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, [index, query, status, selected]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  // Ease the track to `targetTx`, then run `after` once it lands. We drive the
  // commit off a timer (not transitionend) so a zero-distance snap or a
  // reduce-motion'd transition still resolves. `after` either commits the page or
  // (on a cancelled swipe) just clears the transition.
  const animateTo = (targetTx, after) => {
    animatingRef.current = true;
    setSlide((s) => (s ? { ...s, tx: targetTx, animating: true } : s));
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { animatingRef.current = false; after(); }, SLIDE_MS + 10);
  };

  // Land on `next`: adopt it as the current page, drop the transition, reset the
  // per-category filters, and return the (persistent) viewport to the top.
  const commit = (next) => {
    setIndex((next + count) % count);
    setSlide(null);
    setQuery('');
    setSelected([]);
    setStatus('all');
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  // Arrow / dot navigation: mount the target as the neighbour, then animate to it.
  const slideTo = (target, d) => {
    if (animatingRef.current || target === index || count < 2) return;
    const w = scrollRef.current?.clientWidth || 0;
    const side = d > 0 ? 'right' : 'left';
    setSlide({ neighbor: (target + count) % count, from: side, tx: side === 'right' ? 0 : -w, animating: false });
    // Ease to the snap only after the neighbour has painted at its start offset —
    // double rAF so the start frame is committed first, else the browser has no
    // "from" value and the transition jumps instantly instead of sliding.
    requestAnimationFrame(() => requestAnimationFrame(() => animateTo(side === 'right' ? -w : 0, () => commit(target))));
  };
  const go = (d) => slideTo((index + d + count) % count, d);

  // Touch drag: follow the finger horizontally, letting vertical drags scroll the
  // list. Bound imperatively (not via React props) so touchmove is non-passive and
  // can preventDefault once the gesture locks horizontal. Rebinds on index change
  // so the closure's `index` stays current.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || count < 2) return undefined;
    let g = null; // in-flight gesture

    const onStart = (e) => {
      if (animatingRef.current) return;
      const t = e.touches[0];
      g = { x0: t.clientX, y0: t.clientY, w: el.clientWidth, axis: null, dx: 0 };
    };
    const onMove = (e) => {
      if (!g) return;
      const t = e.touches[0];
      const dx = t.clientX - g.x0;
      const dy = t.clientY - g.y0;
      if (g.axis == null) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > AXIS_LOCK) {
          g.axis = 'x';
          g.side = dx < 0 ? 'right' : 'left';
          g.neighbor = (index + (dx < 0 ? 1 : -1) + count) % count;
          g.base = g.side === 'right' ? 0 : -g.w;
          setSlide({ neighbor: g.neighbor, from: g.side, tx: g.base, animating: false });
        } else if (Math.abs(dy) > AXIS_LOCK) {
          g.axis = 'y'; // let the list scroll; this gesture is not a page swipe
        }
      }
      if (g.axis === 'x') {
        e.preventDefault(); // stop the vertical list from scrolling mid-swipe
        g.dx = dx;
        const tx = clamp(g.base + dx, -g.w, 0);
        setSlide((s) => (s ? { ...s, tx } : s));
      }
    };
    const onEnd = () => {
      if (!g || g.axis !== 'x') { g = null; return; }
      const { dx, side, neighbor, base, w } = g;
      g = null;
      const passed = Math.abs(dx) > SWIPE_THRESHOLD;
      if (!passed) { animateTo(base, () => setSlide(null)); return; } // snap back, no change
      if (side === 'right') animateTo(-w, () => commit(neighbor));
      else animateTo(0, () => commit(neighbor));
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
  }, [index, count]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // A single carousel page. The current page honours the search/status/continent
  // filters; a neighbour sliding in shows unfiltered (its filters reset on commit).
  const renderPage = (i, filtered) => {
    const bs = BADGE_CATEGORIES[i].getBadges(ctx);
    if (bs.length === 0) {
      return <div className="badge-empty">No badges in this category yet — coming soon.</div>;
    }
    const q = query.trim().toLowerCase();
    const vis = filtered
      ? bs.filter((b) =>
        statusOk(b) &&
        (selected.length === 0 || selected.includes(b.continent)) &&
        (!q || b.label.toLowerCase().includes(q)))
      : bs;
    return vis.length > 0
      ? <div className="badge-grid">{vis.map((b) => <Badge key={b.key} badge={b} />)}</div>
      : <div className="badge-empty">No matches.</div>;
  };

  // The pages currently on the track: just the current page at rest, or the
  // current + neighbour (ordered by which side it enters from) mid-transition.
  const pages = !slide
    ? [{ i: index, filtered: true }]
    : slide.from === 'right'
      ? [{ i: index, filtered: true }, { i: slide.neighbor, filtered: false }]
      : [{ i: slide.neighbor, filtered: false }, { i: index, filtered: true }];

  return (
    <Modal onClose={onClose} icon={false} closable className="modal-badges">
      <div className="badge-nav">
        {count > 1 && (
          <button className="icon-btn badge-nav-arrow" onClick={() => go(-1)} aria-label="Previous category">
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
          <button className="icon-btn badge-nav-arrow" onClick={() => go(1)} aria-label="Next category">
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
        <div className="badge-slide-viewport" ref={scrollRef}>
          <div
            className="badge-track"
            style={slide ? {
              transform: `translateX(${slide.tx}px)`,
              transition: slide.animating ? `transform ${SLIDE_MS}ms ${SLIDE_EASE}` : 'none',
              willChange: 'transform',
            } : undefined}
          >
            {pages.map((p) => (
              <div className="badge-page" key={p.i}>
                {renderPage(p.i, p.filtered)}
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
              onClick={() => slideTo(i, i >= index ? 1 : -1)}
              aria-label={`Go to ${c.title}`}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
