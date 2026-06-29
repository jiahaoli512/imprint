import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';

// Floating "scroll to top" button shared by full-page scroll views (home,
// privacy). Appears once the window is scrolled past `threshold`, then smooth-
// scrolls back to the top — the same affordance as the badges modal.
//
// It portals to <body> on purpose: a transformed ancestor (e.g. the home page's
// pageEnter animation leaves a transform on the container) makes position:fixed
// resolve against that ancestor instead of the viewport, which pinned the button
// to the bottom of the page content rather than the screen. Rendering outside
// that subtree keeps it fixed to the viewport.
export default function ScrollToTopButton({ threshold = 400 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll(); // sync with current position on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  if (!show) return null;

  return createPortal(
    <button
      className="icon-btn scrolltop-fab"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>,
    document.body
  );
}
