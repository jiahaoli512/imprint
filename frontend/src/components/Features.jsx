import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gauge, Footprints, Trophy, Users, HelpCircle } from 'lucide-react';
import { useDismiss } from '../utils/useDismiss';

// Narrowed to the four most representative features of the app: the live
// discovery gauge, native passive tracking, the milestone badge gallery, and
// exploring other travelers' profiles. Milestones carries a `video` — its "?"
// plays a short clip on hover; the other three cards' "?" icons are inert
// placeholders for now (see FeatureHelp's `if (!video)` branch below).
const features = [
  { icon: Gauge,      cls: 'icon-green',  title: 'Discovery Gauge',   desc: "A live gauge fills in as you move, showing the exact percentage you've uncovered." },
  { icon: Footprints, cls: 'icon-blue',   title: 'Passive Tracking',  desc: 'On the mobile app, Imprint quietly logs your trail in the background. Just live your life — your map builds itself and marks your every journey; no check-ins needed.' },
  { icon: Trophy,     cls: 'icon-yellow', title: 'Milestones',        desc: 'Flex to your friends with growing badge gallery, scroll through the endless categories Imprint offers.', video: '/milestones-preview.mp4' },
  { icon: Users,      cls: 'icon-purple', title: 'Explore Travelers', desc: 'Search for other explorers and visit their profiles and maps to see just how far they’ve roamed.' },
];

// Cursor offset (px) and viewport edge padding for positionAt below.
const CURSOR_OFFSET = 16;
const EDGE_PAD = 8;

// The Milestones "?" icon plays a short clip near the cursor on hover
// (desktop) / tap (touch). It starts the moment it opens and is paused +
// rewound the instant it closes, so it only ever runs while actually
// hovered/open. Cards without a `video` render the same icon as an inert
// placeholder (no tooltip, no listeners) until they have real help content.
function FeatureHelp({ title, video }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const tipRef = useRef(null);
  useDismiss(wrapRef, () => close(), { active: open, escape: true });

  if (!video) {
    return (
      <div className="feature-help">
        <button type="button" className="icon-btn feature-help-btn" aria-label={`About ${title}`} disabled>
          <HelpCircle size={13} />
        </button>
      </div>
    );
  }

  function playClip() {
    videoRef.current?.play().catch(() => {});
  }
  function stopClip() {
    const v = videoRef.current;
    if (v) { v.pause(); v.currentTime = 0; }
  }
  function close() {
    setOpen(false);
    stopClip();
  }

  // Places the tooltip just to the lower-right of (clientX, clientY),
  // clamped so it never runs off the viewport edge. The tooltip is portaled
  // to <body> (see below) specifically so this `position: fixed` placement
  // is reliable: .feature-card:hover applies a CSS transform for its lift
  // effect, and a transformed ancestor becomes the containing block for any
  // fixed descendant — without the portal, "fixed" would anchor to the
  // (moving) card instead of the viewport, putting the tooltip in the wrong
  // spot.
  function positionAt(clientX, clientY) {
    const w = tipRef.current?.offsetWidth ?? 220;
    const h = tipRef.current?.offsetHeight ?? 204;
    let left = clientX + CURSOR_OFFSET;
    let top = clientY + CURSOR_OFFSET;
    if (left + w > window.innerWidth - EDGE_PAD) left = clientX - w - CURSOR_OFFSET;
    if (top + h > window.innerHeight - EDGE_PAD) top = clientY - h - CURSOR_OFFSET;
    setPos({ left, top });
  }
  // Shared open path for both hover and tap, so the two triggers can't drift
  // out of sync with each other.
  function openAt(clientX, clientY) {
    setOpen(true);
    playClip();
    positionAt(clientX, clientY);
  }

  function handleMouseEnter(e) {
    openAt(e.clientX, e.clientY);
  }
  function handleMouseMove(e) {
    if (open) positionAt(e.clientX, e.clientY);
  }
  function handleMouseLeave() {
    close();
  }
  // Not a functional setState updater — deliberately reads `open` directly.
  // The earlier version put playClip()/positionAt() inside a `setOpen(o =>
  // ...)` updater; React (StrictMode in particular) can invoke updaters more
  // than once per commit, so side effects there would double-fire.
  // `e.detail === 0` distinguishes a real pointer/tap (detail >= 1) from a
  // keyboard Enter/Space activation of the button, where clientX/clientY are
  // both 0 — without this, keyboard activation would plant the tooltip in
  // the viewport's top-left corner instead of near the button.
  function toggleTap(e) {
    if (open) { close(); return; }
    if (e.detail !== 0) {
      openAt(e.clientX, e.clientY);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      openAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  return (
    <div
      className="feature-help"
      ref={wrapRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="icon-btn feature-help-btn"
        aria-label={`About ${title}`}
        aria-expanded={open}
        onClick={toggleTap}
      >
        <HelpCircle size={13} />
      </button>
      {createPortal(
        <div
          ref={tipRef}
          className={`feature-help-tip has-video${open ? ' open' : ''}`}
          style={{ left: pos.left, top: pos.top }}
          role="tooltip"
        >
          <video ref={videoRef} src={video} muted loop playsInline preload="metadata" />
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="section-tag">Features</div>
      <h2 className="section-title">More than a travel tracker.</h2>
      <p className="section-sub">
        Imprint goes beyond pinning locations — it gives you a living, breathing map of your {"life's"} journey.
      </p>
      <div className="features-grid">
        {features.map((f) => (
          <div className="feature-card" key={f.title}>
            <div className={`feature-icon ${f.cls}`}><f.icon size={22} strokeWidth={2} /></div>
            <div className="feature-card-head">
              <h3>{f.title}</h3>
              <FeatureHelp title={f.title} video={f.video} />
            </div>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
