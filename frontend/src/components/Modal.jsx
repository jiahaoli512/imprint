import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Fingerprint, X } from 'lucide-react';

// Shared modal shell: a click-to-dismiss overlay with a centered card and an
// optional Fingerprint icon. Clicking the card itself never closes it. Callers
// supply the card's contents (title, copy, action buttons) as children.
// `closable` renders a visible top-right X (in addition to overlay-click).
export default function Modal({ onClose, icon = true, closable = false, className = '', children }) {
  // Lock background scroll while the modal is open. `overflow: hidden` alone is
  // unreliable (notably iOS/Capacitor, where the body still rubber-band scrolls),
  // so pin the body with `position: fixed` and offset it by the current scroll
  // position — then restore both on close so the page doesn't jump.
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position, top: body.style.top,
      width: body.style.width, overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    return () => {
      Object.assign(body.style, prev);
      window.scrollTo(0, scrollY);
    };
  }, []);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${className}`.trim()} onClick={e => e.stopPropagation()}>
        {closable && (
          <button className="modal-close-x" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        )}
        {icon && (
          <div className="modal-icon">
            <Fingerprint size={28} strokeWidth={1.5} color="#e2a156" />
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
