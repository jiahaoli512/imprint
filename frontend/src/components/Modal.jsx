import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Fingerprint, X } from 'lucide-react';

// Shared modal shell: a click-to-dismiss overlay with a centered card and an
// optional Fingerprint icon. Clicking the card itself never closes it. Callers
// supply the card's contents (title, copy, action buttons) as children.
// `closable` renders a visible top-right X (in addition to overlay-click).
export default function Modal({ onClose, icon = true, closable = false, className = '', containerRef, children }) {
  // Lock background scroll while the modal is open. We deliberately do NOT use
  // the `position: fixed` body trick: on iOS/WKWebView, toggling the body in and
  // out of `position: fixed` un-pins every `position: fixed` element on the page
  // (e.g. the portaled profile toolbar) document-wide until a full relayout — so
  // they scroll away and never return until you navigate/refresh. Instead lock
  // with `overflow: hidden` (which keeps the body in flow, so fixed elements stay
  // pinned) plus a non-passive `touchmove` guard for iOS: WKWebView still
  // rubber-band-scrolls the document on touch under `overflow: hidden`, so we
  // preventDefault any touch drag that isn't inside the modal card. Touches
  // within the modal are allowed so its own scrollable areas keep working (they
  // use `overscroll-behavior` to avoid chaining the scroll to the page).
  useEffect(() => {
    const { body } = document;
    const prev = { overflow: body.style.overflow, overscrollBehavior: body.style.overscrollBehavior };
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    const onTouchMove = (e) => {
      if (!(e.target instanceof Element) || !e.target.closest('.modal')) e.preventDefault();
    };
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscrollBehavior;
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // Escape closes the modal (the overlay already handles click-outside). Kept in
  // a ref so a fresh onClose each render doesn't re-subscribe the listener.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div ref={containerRef} className={`modal ${className}`.trim()} onClick={e => e.stopPropagation()}>
        {closable && (
          <button className="icon-btn modal-close-x" onClick={onClose} aria-label="Close">
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
