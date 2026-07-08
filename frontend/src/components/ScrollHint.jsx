import { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getScrollEdges } from '../utils/scrollEdges';

// Wraps a scrollable element (the child gets `className`, so it owns the
// max-height + overflow) and overlays a bottom fade + a nudging chevron so it's
// obvious there's more content below. The hint fades out once the user reaches
// the end, and stays hidden when the content isn't scrollable at all.
export default function ScrollHint({ className = '', wrapClassName = '', children }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const { canScroll, atEnd } = getScrollEdges(el);
      setShow(canScroll && !atEnd);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);

  return (
    <div className={`scroll-hint-wrap ${wrapClassName}`.trim()}>
      <div ref={ref} className={className}>{children}</div>
      <div className={`scroll-hint${show ? '' : ' scroll-hint-hidden'}`} aria-hidden="true">
        <ChevronDown size={18} />
      </div>
    </div>
  );
}
