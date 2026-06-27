import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/Modal';
import Badge from './Badge';
import { BADGE_CATEGORIES } from './categories';

// Popup that pages through badge categories one at a time. Left/right arrows wrap
// around (last → first, first → last); dots mirror the position. Generic over the
// registry — adding a category is a new file + a line in ./categories, and it
// joins the carousel automatically.
export default function BadgesModal({ user, onClose }) {
  const ctx = { user };
  const count = BADGE_CATEGORIES.length;
  const [index, setIndex] = useState(0);
  const go = (dir) => setIndex((i) => (i + dir + count) % count);

  const category = BADGE_CATEGORIES[index];
  const badges = category.getBadges(ctx);

  return (
    <Modal onClose={onClose} icon={false} closable className="modal-badges">
      <div className="badge-nav">
        {count > 1 && (
          <button className="badge-nav-arrow" onClick={() => go(-1)} aria-label="Previous category">
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="badge-nav-title">
          <h2 className="modal-title">{category.title}</h2>
          <p className="modal-sub" style={{ marginBottom: 0 }}>{category.subtitle}</p>
        </div>
        {count > 1 && (
          <button className="badge-nav-arrow" onClick={() => go(1)} aria-label="Next category">
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {badges.length > 0 ? (
        <div className="badge-grid">
          {badges.map((b) => <Badge key={b.key} badge={b} />)}
        </div>
      ) : (
        <div className="badge-empty">No badges in this category yet — coming soon.</div>
      )}

      {count > 1 && (
        <div className="badge-dots">
          {BADGE_CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              className={`badge-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Go to ${c.title}`}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
