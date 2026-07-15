import { useRef, useState } from 'react';
import { Gauge, Footprints, Trophy, Users, HelpCircle } from 'lucide-react';
import { useDismiss } from '../utils/useDismiss';

// Narrowed to the four most representative features of the app: the live
// discovery gauge, native passive tracking, the milestone badge gallery, and
// exploring other travelers' profiles. Milestones carries a `video` — its "?"
// plays a short clip on hover; the other three cards' "?" icons are inert
// placeholders for now (see FeatureHelp's `placeholder` branch below).
const features = [
  { icon: Gauge,      cls: 'icon-green',  title: 'Discovery Gauge',   desc: "A live gauge fills in as you move, showing the exact percentage you've uncovered." },
  { icon: Footprints, cls: 'icon-blue',   title: 'Passive Tracking',  desc: 'On the mobile app, Imprint quietly logs your trail in the background. Just live your life — your map builds itself and marks your every journey; no check-ins needed.' },
  { icon: Trophy,     cls: 'icon-yellow', title: 'Milestones',        desc: 'Flex to your friends with growing badge gallery, scroll through the endless categories Imprint offers.', video: '/milestones-preview.mp4' },
  { icon: Users,      cls: 'icon-purple', title: 'Explore Travelers', desc: 'Search for other explorers and visit their profiles and maps to see just how far they’ve roamed.' },
];

// The Milestones "?" icon plays a short clip on hover(desktop)/tap(touch),
// mirroring Setting.jsx's hover/tap pattern — it starts as soon as the
// tooltip opens and is paused + rewound the instant it closes, so it only
// ever runs while actually hovered/open, never idling in the background.
// Cards without a `video` render the same icon as an inert placeholder
// (no tooltip, no listeners) until they have real help content.
function FeatureHelp({ title, video }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
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
  function toggleTap() {
    setOpen((o) => {
      const next = !o;
      if (next) playClip(); else stopClip();
      return next;
    });
  }

  return (
    <div
      className="feature-help"
      ref={wrapRef}
      onMouseEnter={() => { setOpen(true); playClip(); }}
      onMouseLeave={close}
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
      <div className={`feature-help-tip has-video${open ? ' open' : ''}`} role="tooltip">
        <video ref={videoRef} src={video} muted loop playsInline preload="metadata" />
      </div>
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
