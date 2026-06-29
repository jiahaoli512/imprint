import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Modal from '../../components/Modal';
import Badge from './Badge';
import { BADGE_CATEGORIES } from './categories';
import { useVisitedStates } from './useVisitedStates';
import { useVisitedCountries } from './useVisitedCountries';

const SWIPE_THRESHOLD = 50; // px of horizontal drag before a swipe registers
const FILTERABLE_MIN = 12;  // show search + continent filter past this many badges
const isNative = Capacitor.isNativePlatform();

// Popup that pages through badge categories one at a time. Left/right arrows (and
// touch swipes) wrap around (last → first, first → last); dots mirror the
// position. Each change slides the content in from the direction of travel. Large
// categories (e.g. Passports) get a name search + continent filter. Generic over
// the registry — adding a category is a new file + a line in ./categories.
export default function BadgesModal({ user, markers, onClose }) {
  const count = BADGE_CATEGORIES.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward (slide in from right), -1 = back
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // selected continents; [] = All
  const [status, setStatus] = useState('all');  // all | unlocked | locked
  const [showTop, setShowTop] = useState(false); // scroll-to-top affordance
  const touchX = useRef(null);
  const scrollRef = useRef(null);

  const category = BADGE_CATEGORIES[index];
  // Defer the (lazy, heavier) visited-state computation until the US-states
  // category is open; the hook keeps the resolved set after you navigate away.
  const visitedStates = useVisitedStates(markers, category.id === 'states-us');
  // Same lazy pattern for countries — the world-atlas chunk loads only when the
  // Passports category is open; the hook keeps the resolved set afterward.
  const visitedCountries = useVisitedCountries(markers, category.id === 'countries');
  const ctx = { user, markers, visitedStates, visitedCountries };

  // Toggle the scroll-to-top button once the modal is scrolled past the header.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setShowTop(el.scrollTop > 240);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  // Reset filters whenever the category changes so each opens unfiltered.
  const goTo = (next, direction) => {
    setDir(direction);
    setIndex((next + count) % count);
    setQuery('');
    setSelected([]);
    setStatus('all');
  };
  const go = (d) => goTo(index + d, d);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1); // drag left → next
    touchX.current = null;
  };

  const badges = category.getBadges(ctx);
  const earnedCount = badges.filter((b) => b.earned).length;
  const earnedPct = badges.length ? Math.round((earnedCount / badges.length) * 100) : 0;

  const filterable = badges.length > FILTERABLE_MIN;
  // Continent options derived from the badges that carry a continent.
  const continents = filterable
    ? [...new Set(badges.map((b) => b.continent).filter(Boolean))].sort()
    : [];
  const q = query.trim().toLowerCase();
  const statusOk = (b) => status === 'all' || (status === 'unlocked' ? b.earned : !b.earned);
  // Status applies to every category; search + continent only when filterable
  // (their state stays default — empty — for small categories, so it's a no-op).
  const visible = badges.filter((b) =>
    statusOk(b) &&
    (selected.length === 0 || selected.includes(b.continent)) &&
    (!q || b.label.toLowerCase().includes(q)));

  // Toggle a continent. Selecting all of them, or clearing the last one,
  // collapses back to "All" (an empty selection).
  const toggleContinent = (c) => {
    setSelected((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c];
      return next.length === 0 || next.length === continents.length ? [] : next;
    });
  };

  return (
    <Modal onClose={onClose} icon={false} closable className="modal-badges" containerRef={scrollRef}>
      <div className="badge-top-anchor">
        {showTop && (
          <button className="icon-btn badge-scrolltop" onClick={scrollToTop} aria-label="Scroll to top">
            <ChevronUp size={20} />
          </button>
        )}
      </div>
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

      <div className="badge-slide-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* key=index remounts on change so the slide animation re-runs; the
            direction class picks which side it enters from. */}
        <div key={index} className={`badge-slide ${dir < 0 ? 'badge-slide-prev' : 'badge-slide-next'}`}>
          {badges.length === 0 ? (
            <div className="badge-empty">No badges in this category yet — coming soon.</div>
          ) : visible.length > 0 ? (
            <div className="badge-grid">
              {visible.map((b) => <Badge key={b.key} badge={b} />)}
            </div>
          ) : (
            <div className="badge-empty">No matches.</div>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="badge-dots">
          {BADGE_CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              className={`badge-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => goTo(i, i >= index ? 1 : -1)}
              aria-label={`Go to ${c.title}`}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
