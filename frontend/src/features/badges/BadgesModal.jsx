import Modal from '../../components/Modal';
import Badge from './Badge';
import { BADGE_CATEGORIES } from './categories';

// Renders one category's heading + its grid of badges. Pulls its badges from the
// category's own getBadges(ctx), so the modal stays agnostic of how any category
// decides what's earned.
function BadgeCategory({ category, ctx }) {
  const badges = category.getBadges(ctx);
  return (
    <section className="badge-category">
      <h2 className="modal-title">{category.title}</h2>
      <p className="modal-sub">{category.subtitle}</p>
      <div className="badge-grid">
        {badges.map((b) => <Badge key={b.key} badge={b} />)}
      </div>
    </section>
  );
}

// Popup listing every badge category. Generic over categories: adding one is a
// new file + a line in ./categories — this component doesn't change. `ctx` is the
// shared data each category reads from (today just the user).
export default function BadgesModal({ user, onClose }) {
  const ctx = { user };
  return (
    <Modal onClose={onClose} icon={false} closable className="modal-badges">
      {BADGE_CATEGORIES.map((category) => (
        <BadgeCategory key={category.id} category={category} ctx={ctx} />
      ))}
    </Modal>
  );
}
