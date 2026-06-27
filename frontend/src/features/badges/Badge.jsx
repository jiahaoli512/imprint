import { Lock } from 'lucide-react';

// Inline SVGs ported from the source bundles.
const Sparkle = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z" />
  </svg>
);
const CheckMark = () => (
  <svg width="46" height="46" viewBox="0 0 50 50" fill="none" aria-hidden="true">
    <path d="M13 26 L21 34 L37 16" stroke="var(--text)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// The face of the coin. `coin: 'check'` shows a checkmark; otherwise a big value
// + small unit. Adding a new face (e.g. a flag emoji for country badges) is a
// new branch here — the rest of the medallion is unchanged.
function CoinFace({ badge }) {
  if (badge.coin === 'check') return <CheckMark />;
  if (badge.coin === 'flag') return <span className={`fi fi-${badge.code} badge-flag`} />;
  return (
    <>
      <span className="badge-coin-value">{badge.value}</span>
      <span className="badge-coin-unit">{badge.unit}</span>
    </>
  );
}

// A single medallion. Purely presentational: it renders whatever normalized
// `badge` shape a category produces ({ label, caption, earned, c1, c2, halo,
// spin, delay, ...coin fields }). Earned badges breathe + animate; unearned ones
// are grayed, frozen, and show a lock. Structural styling lives in index.css;
// only the per-badge colors/timing (data) are inline.
export default function Badge({ badge }) {
  const { earned } = badge;
  return (
    <div className="badge-card">
      <div className={`badge-medallion ${earned ? 'badge-earned' : 'badge-locked'}`}>
        {/* Medal ribbon tails — rendered first so the disc paints over their
            tops, making them appear to hang from behind the coin. Equal length
            for every badge (fixed CSS size); colored to match the badge. */}
        <div className="badge-ribbon">
          <span className="badge-tail" style={{ background: badge.c1 }} />
          <span className="badge-tail" style={{ background: badge.c2 }} />
        </div>
        <div className="badge-halo" style={{ background: `radial-gradient(circle, ${badge.halo} 0%, transparent 65%)` }} />
        <div
          className="badge-ring"
          style={{
            background: `conic-gradient(from 0deg, ${badge.c1}, ${badge.c2}, ${badge.c1})`,
            animation: `badgeRingSpin ${badge.spin} linear infinite`,
          }}
        />
        <div className="badge-disc">
          <div className="badge-coin" style={{ background: `linear-gradient(150deg, ${badge.c1}, ${badge.c2})`, boxShadow: `0 7px 18px ${badge.halo}, inset 0 1px 1px rgba(255,255,255,0.28)` }}>
            <CoinFace badge={badge} />
          </div>
        </div>
        <div className="badge-sparkle" style={{ color: badge.c1, animation: `badgeSparkle 2.6s ${badge.delay} ease-in-out infinite` }}>
          <Sparkle />
        </div>
        {!earned && (
          <div className="badge-lock">
            <Lock size={22} color="var(--muted)" />
          </div>
        )}
      </div>
      <div className="badge-text">
        <span className={`badge-label ${earned ? '' : 'is-locked'}`} title={badge.label}>{badge.label}</span>
        <span className="badge-caption">{earned ? badge.caption : 'Not yet earned'}</span>
      </div>
    </div>
  );
}
