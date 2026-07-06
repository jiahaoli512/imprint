import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Modal from '../../components/Modal';
import Badge from './Badge';
import { BADGE_CATEGORIES } from './categories';
import { useVisitedStates } from './useVisitedStates';
import { useVisitedCountries } from './useVisitedCountries';
import { useReduceMotion } from '../settings/reduceMotion';
import { useSlideCarousel } from './useSlideCarousel';

const FILTERABLE_MIN = 12; // show search + continent filter past this many badges
const isNative = Capacitor.isNativePlatform();
const count = BADGE_CATEGORIES.length;
const wraps = count > 1;

// The strip rendered by the carousel: the real categories, plus — when there's
// more than one, so wrapping applies — a clone of the last category before them
// and a clone of the first one after, for the loop trick (see useSlideCarousel).
const SLOTS = wraps
  ? [
    { key: 'clone-last', real: count - 1, clone: true },
    ...BADGE_CATEGORIES.map((cat, i) => ({ key: cat.id, real: i, clone: false })),
    { key: 'clone-first', real: 0, clone: true },
  ]
  : BADGE_CATEGORIES.map((cat, i) => ({ key: cat.id, real: i, clone: false }));

// Popup that pages through badge categories one at a time via a real horizontal,
// wrap-around carousel (see useSlideCarousel for the paging mechanics). Every
// category is mounted once — nothing heavy mounts mid-slide, which is what keeps
// paging smooth. Large categories (e.g. Passports) get a name search + continent
// filter. Generic over the registry — adding a category is a new file + a line in
// ./categories.
export default function BadgesModal({ user, markers, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // selected continents; [] = All
  const [status, setStatus] = useState('all');  // all | unlocked | locked
  const [showTop, setShowTop] = useState(false); // scroll-to-top affordance
  const [showHint, setShowHint] = useState(false); // "more below" scroll hint
  const [reduceMotion] = useReduceMotion();
  const pageRefs = useRef([]); // per-slot scroll containers, indexed like SLOTS

  const { index, viewportRef, trackRef, slotCount, toSlot, goTo, step } =
    useSlideCarousel(count, { reduceMotion });
  const activeSlot = toSlot(index);
  const category = BADGE_CATEGORIES[index];

  // All categories are mounted, so resolve every visited-geo hook up front (each
  // keeps its resolved Set, so a given atlas loads once). Geo-less categories are
  // no-ops.
  const visitedStates = useVisitedStates(markers, true);
  const visitedCountries = useVisitedCountries(markers, true);
  const ctx = { user, markers, visitedStates, visitedCountries };

  // Scroll affordances follow the active page: a scroll-to-top button past the
  // header, and a "more below" fade + chevron that hides at the end (or when
  // nothing scrolls). Rebinds when the active page (or its filtered height) changes.
  useEffect(() => {
    const el = pageRefs.current[activeSlot];
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
  }, [activeSlot, query, status, selected]);

  // Each category opens at the top of its own list.
  useEffect(() => {
    const el = pageRefs.current[activeSlot];
    if (el) el.scrollTop = 0;
  }, [activeSlot]);

  const scrollToTop = () => pageRefs.current[activeSlot]?.scrollTo({ top: 0, behavior: 'smooth' });

  // Navigating (arrows, dots) resets the per-category filters so each opens
  // unfiltered.
  const resetFilters = () => { setQuery(''); setSelected([]); setStatus('all'); };
  const go = (d) => { resetFilters(); step(d); };
  const jumpTo = (i) => { resetFilters(); goTo(i); };

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
  // filters; every other slot (including a clone) renders unfiltered.
  const renderPage = (real, active) => {
    const bs = BADGE_CATEGORIES[real].getBadges(ctx);
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
        <div className="badge-carousel" ref={viewportRef}>
          <div className="badge-track" ref={trackRef} style={{ width: `${slotCount * 100}%` }}>
            {SLOTS.map((slot, i) => (
              <div
                className="badge-page"
                key={`${slot.key}${slot.clone ? '-clone' : ''}`}
                ref={(el) => { pageRefs.current[i] = el; }}
                style={{ width: `${100 / slotCount}%` }}
                aria-hidden={i !== activeSlot}
              >
                {renderPage(slot.real, i === activeSlot)}
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
              onClick={() => jumpTo(i)}
              aria-label={`Go to ${c.title}`}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
