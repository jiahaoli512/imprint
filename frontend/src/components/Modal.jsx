import { createPortal } from 'react-dom';
import { Fingerprint } from 'lucide-react';

// Shared modal shell: a click-to-dismiss overlay with a centered card and an
// optional Fingerprint icon. Clicking the card itself never closes it. Callers
// supply the card's contents (title, copy, action buttons) as children.
export default function Modal({ onClose, icon = true, className = '', children }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${className}`.trim()} onClick={e => e.stopPropagation()}>
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
