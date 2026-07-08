import { useState } from 'react';
import Modal from '../../components/Modal';
import BadgePage from './BadgePage';
import { BADGE_CATEGORIES } from './categories';
import { useVisitedStates } from './useVisitedStates';
import { useVisitedCountries } from './useVisitedCountries';
import { useReduceMotion } from '../settings/reduceMotion';
import { useSlideCarousel } from './useSlideCarousel';

const count = BADGE_CATEGORIES.length;
const wraps = count > 1;

// The strip rendered by the carousel: the real categories, plus — when there's
// more than one, so wrapping applies — a clone of the last category before them
// and a clone of the first one after, for the loop trick (see useSlideCarousel).
// `key` alone (not a separate "is this a clone" flag) is what BadgesModal keys
// each page on below — 'clone-last'/'clone-first' are already distinct from any
// real category's id, so no extra bookkeeping is needed to keep them unique.
const SLOTS = wraps
  ? [
    { key: 'clone-last', real: count - 1 },
    ...BADGE_CATEGORIES.map((cat, i) => ({ key: cat.id, real: i })),
    { key: 'clone-first', real: 0 },
  ]
  : BADGE_CATEGORIES.map((cat, i) => ({ key: cat.id, real: i }));

// Popup that pages through badge categories one at a time via a real horizontal,
// wrap-around carousel (see useSlideCarousel for the paging mechanics). Every
// category is mounted once as a BadgePage — nothing heavy mounts mid-slide,
// which is what keeps paging smooth. This component owns only what's genuinely
// shared across pages: the carousel position and the filter state (reset on
// every navigation, since a category always opens unfiltered); everything about
// rendering a single page — including its own scroll tracking — belongs to
// BadgePage. Generic over the registry — adding a category is a new file + a
// line in ./categories.
export default function BadgesModal({ user, markers, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // selected continents; [] = All
  const [status, setStatus] = useState('all');  // all | unlocked | locked
  const [reduceMotion] = useReduceMotion();

  const { index, viewportRef, trackRef, slotCount, toSlot, goTo, step } =
    useSlideCarousel(count, { reduceMotion });
  const activeSlot = toSlot(index);

  // All categories are mounted, so resolve every visited-geo hook up front (each
  // keeps its resolved Set, so a given atlas loads once). Geo-less categories are
  // no-ops.
  const visitedStates = useVisitedStates(markers, true);
  const visitedCountries = useVisitedCountries(markers, true);
  const ctx = { user, markers, visitedStates, visitedCountries };

  // Navigating (arrows, dots) resets the per-category filters so each opens
  // unfiltered.
  const resetFilters = () => { setQuery(''); setSelected([]); setStatus('all'); };
  const go = (d) => { resetFilters(); step(d); };
  const jumpTo = (i) => { resetFilters(); goTo(i); };

  // Toggle a continent for the active category. Selecting all of them, or
  // clearing the last one, collapses back to "All" (an empty selection).
  const toggleContinent = (c) => {
    const { continents } = BADGE_CATEGORIES[index];
    setSelected((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c];
      return next.length === 0 || next.length === continents.length ? [] : next;
    });
  };

  return (
    <Modal onClose={onClose} icon={false} closable className="modal-badges">
      <div className="badge-carousel" ref={viewportRef}>
        <div className="badge-track" ref={trackRef} style={{ width: `${slotCount * 100}%` }}>
          {SLOTS.map((slot, i) => (
            <div
              className="badge-page"
              key={slot.key}
              style={{ width: `${100 / slotCount}%` }}
              aria-hidden={i !== activeSlot}
            >
              <BadgePage
                category={BADGE_CATEGORIES[slot.real]}
                ctx={ctx}
                active={i === activeSlot}
                showArrows={count > 1}
                onPrev={() => go(-1)}
                onNext={() => go(1)}
                query={query}
                status={status}
                selected={selected}
                onQueryChange={setQuery}
                onStatusChange={setStatus}
                onSelectAllContinents={() => setSelected([])}
                onToggleContinent={toggleContinent}
              />
            </div>
          ))}
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
