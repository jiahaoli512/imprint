import { useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useDismiss } from '../../utils/useDismiss';

// A labeled setting row: title + a "?" help icon (the description, shown as a
// tooltip on hover, or tap-to-toggle on touch — there's no hover on native),
// then its control below. Shared by every settings tab body (Display,
// Account, ...) so a layout tweak lands in one place instead of drifting
// across copies.
export default function Setting({ title, description, children }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useDismiss(wrapRef, () => setOpen(false), { active: open, escape: true });

  return (
    <div className="settings-row">
      <div className="settings-row-head">
        <div className="settings-row-label">{title}</div>
        <div className="settings-help" ref={wrapRef}>
          <button
            type="button"
            className="icon-btn settings-help-btn"
            aria-label={`About ${title}`}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <HelpCircle size={12} />
          </button>
          <div className={`settings-help-tip${open ? ' open' : ''}`} role="tooltip">{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
