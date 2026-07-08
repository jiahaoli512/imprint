import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Badge from './Badge';
import { getScrollEdges } from '../../utils/scrollEdges';

const FILTERABLE_MIN = 12; // show search + continent filter past this many badges
const isNative = Capacitor.isNativePlatform();

// One page of the badges carousel: a category's title/completion line, its
// search/status/continent filter controls, and its own scrollable grid — all
// rendered together so they slide as one block (see BadgesModal). Owns its
// grid's scroll state entirely (the scroll-to-top button and "more below" hint)
// rather than exposing the DOM node for a parent to manage; `active` is the only
// thing the carousel needs to tell it.
//
// `filters` is the shared filter state (lifted to the parent so it can reset on
// navigation) and `filterActions` its handlers — bundled as two collaborators
// rather than seven flat props so this signature doesn't have to change if a
// future filter dimension (e.g. a sort order) is added. Only the active page
// applies `filters` for real — every other page (a clone, or a neighbour
// glimpsed mid-swipe) shows its own unfiltered badges with controls at their
// reset defaults, since a page always opens fresh once it becomes active.
export default function BadgePage({
  category, ctx, active, showArrows, onPrev, onNext, filters, filterActions,
}) {
  const gridRef = useRef(null);
  const [showTop, setShowTop] = useState(false); // scroll-to-top affordance
  const [showHint, setShowHint] = useState(false); // "more below" scroll hint

  const badges = category.getBadges(ctx);
  const earnedCount = badges.filter((b) => b.earned).length;
  const earnedPct = badges.length ? Math.round((earnedCount / badges.length) * 100) : 0;
  const filterable = category.badgeCount > FILTERABLE_MIN;
  const continents = category.continents;

  const q = active ? filters.query : '';
  const sel = active ? filters.selected : [];
  const st = active ? filters.status : 'all';
  const statusOk = (b) => st === 'all' || (st === 'unlocked' ? b.earned : !b.earned);
  const vis = active
    ? badges.filter((b) =>
      statusOk(b) &&
      (sel.length === 0 || sel.includes(b.continent)) &&
      (!q.trim() || b.label.toLowerCase().includes(q.trim().toLowerCase())))
    : badges;

  // Scroll affordances for this page's own grid: a scroll-to-top button past the
  // header, and a "more below" fade + chevron that hides at the end (or when
  // nothing scrolls). Only tracked while this page is active — every category's
  // grid stays permanently mounted (for smooth paging — see useSlideCarousel), so
  // it keeps whatever scrollTop it was left at last time it was active. Reset
  // that to the top BEFORE computing the affordances below, in the same effect:
  // if the reset instead ran separately afterward, `update()` would read the
  // still-scrolled-down position first (hiding the hint even though there's more
  // below), only correcting once the reset's async native 'scroll' event fired a
  // frame later — a brief, visible flash/delay on revisiting a scrolled category.
  useEffect(() => {
    if (!active) return undefined;
    const el = gridRef.current;
    if (!el) return undefined;
    el.scrollTop = 0; // each category opens at the top of its own list
    const update = () => {
      setShowTop(el.scrollTop > 240);
      const { canScroll, atEnd } = getScrollEdges(el);
      setShowHint(canScroll && !atEnd);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [active, filters.query, filters.status, filters.selected]);

  const scrollToTop = () => gridRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <div className="badge-nav">
        {showArrows && (
          <button className="icon-btn badge-nav-arrow" onClick={onPrev} aria-label="Previous category">
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
        {showArrows && (
          <button className="icon-btn badge-nav-arrow" onClick={onNext} aria-label="Next category">
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Filters + grid share a bottom-aligned block so the filters sit right
          above the badges (like Passports) rather than up under the header —
          the leftover space for a shorter category becomes a gap between the
          header (which stays put) and this block. */}
      <div className="badge-page-body">
        {badges.length > 0 && (
          <div className="badge-filters">
            {filterable && (
              <input
                className="badge-search"
                value={q}
                onChange={(e) => filterActions.onQueryChange(e.target.value)}
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
                  className={`badge-chip ${st === val ? 'is-active' : ''}`}
                  onClick={() => filterActions.onStatusChange(val)}
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
                  className={`badge-chip ${sel.length === 0 ? 'is-active' : ''}`}
                  onClick={filterActions.onSelectAllContinents}
                >
                  All
                </button>
                {continents.map((c) => (
                  <button
                    key={c}
                    className={`badge-chip ${sel.includes(c) ? 'is-active' : ''}`}
                    onClick={() => filterActions.onToggleContinent(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="badge-page-grid-wrap">
          <div className="badge-page-grid" ref={gridRef}>
            {badges.length === 0 ? (
              <div className="badge-empty">No badges in this category yet — coming soon.</div>
            ) : vis.length > 0 ? (
              <div className="badge-grid">{vis.map((b) => <Badge key={b.key} badge={b} />)}</div>
            ) : (
              <div className="badge-empty">No matches.</div>
            )}
          </div>
          {active && showTop && (
            <button className="icon-btn badge-scrolltop" onClick={scrollToTop} aria-label="Scroll to top">
              <ChevronUp size={20} />
            </button>
          )}
          {/* Rendered on EVERY page (not just the active one) so the bottom fade
              is already present on the incoming page mid-swipe, masking its
              peeking rows instead of popping in once the page becomes active.
              The active page hides it at the end of its scroll (showHint);
              non-active pages always show it (reset to the top, and over a short
              category's empty box it fades surface→surface = invisible). */}
          <div className={`badge-scroll-hint${(active ? showHint : true) ? '' : ' badge-scroll-hint-hidden'}`} aria-hidden="true">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>
    </>
  );
}
