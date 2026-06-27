import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/Modal';
import Badge from './Badge';
import { BADGE_CATEGORIES } from './categories';

const SWIPE_THRESHOLD = 50; // px of horizontal drag before a swipe registers

// Popup that pages through badge categories one at a time. Left/right arrows (and
// touch swipes) wrap around (last → first, first → last); dots mirror the
// position. Each change slides the content in from the direction of travel.
// Generic over the registry — adding a category is a new file + a line in
// ./categories, and it joins the carousel automatically.
export default function BadgesModal({ user, onClose }) {
  const ctx = { user };
  const count = BADGE_CATEGORIES.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward (slide in from right), -1 = back
  const touchX = useRef(null);

  const goTo = (next, direction) => { setDir(direction); setIndex((next + count) % count); };
  const go = (d) => goTo(index + d, d);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1); // drag left → next
    touchX.current = null;
  };

  const category = BADGE_CATEGORIES[index];
  const badges = category.getBadges(ctx);
  const earnedCount = badges.filter((b) => b.earned).length;
  const earnedPct = badges.length ? Math.round((earnedCount / badges.length) * 100) : 0;

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

      <div className="badge-slide-viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* key=index remounts on change so the slide animation re-runs; the
            direction class picks which side it enters from. */}
        <div key={index} className={`badge-slide ${dir < 0 ? 'badge-slide-prev' : 'badge-slide-next'}`}>
          {badges.length > 0 ? (
            <div className="badge-grid">
              {badges.map((b) => <Badge key={b.key} badge={b} />)}
            </div>
          ) : (
            <div className="badge-empty">No badges in this category yet — coming soon.</div>
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
