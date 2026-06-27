import { Lock, X } from 'lucide-react';
import Modal from '../../components/Modal';
import { earnedTiers } from './badges';

// The sparkle star, ported from the source bundle's inline SVG.
const Sparkle = () => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z" />
  </svg>
);

// The checkmark drawn on the "Account created" coin, ported from the source.
const Check = () => (
  <svg width="46" height="46" viewBox="0 0 50 50" fill="none" aria-hidden="true">
    <path d="M13 26 L21 34 L37 16" stroke="#f4efe6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// A single animated medallion. Earned badges breathe (scale up then down) via
// `.badge-earned`; unearned ones are grayed + frozen via `.badge-locked`.
function Medallion({ tier }) {
  const { earned } = tier;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '8px', width: '150px' }}>
      <div className={earned ? 'badge-earned' : 'badge-locked'} style={{ position: 'relative', width: '138px', height: '138px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* halo */}
        <div style={{ position: 'absolute', inset: '-16px', borderRadius: '50%', background: `radial-gradient(circle, ${tier.halo} 0%, transparent 65%)`, animation: 'badgeHaloPulse 3.4s ease-in-out infinite' }} />
        {/* rotating ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', padding: '3px',
          background: `conic-gradient(from 0deg, ${tier.c1}, ${tier.c2}, ${tier.c1})`,
          WebkitMask: 'radial-gradient(#000 0 0) content-box, radial-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor', maskComposite: 'exclude',
          animation: `badgeRingSpin ${tier.spin} linear infinite`,
        }} />
        {/* inner disc */}
        <div style={{ position: 'relative', width: '124px', height: '124px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 30%, #1c2129 0%, #141821 72%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(244,239,230,0.06), inset 0 2px 14px rgba(0,0,0,0.5), 0 14px 38px rgba(0,0,0,0.5)' }}>
          {/* coin — a checkmark for the "Account created" badge, value/unit otherwise */}
          <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: `linear-gradient(150deg, ${tier.c1}, ${tier.c2})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', boxShadow: `0 7px 18px ${tier.halo}, inset 0 1px 1px rgba(255,255,255,0.28)` }}>
            {tier.check ? <Check /> : (
              <>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '34px', lineHeight: 1, color: '#0b0e13' }}>{tier.value}</span>
                <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(11,14,19,0.72)' }}>{tier.unit}</span>
              </>
            )}
          </div>
        </div>
        {/* sparkle */}
        <div style={{ position: 'absolute', top: '4px', right: '10px', width: '11px', height: '11px', color: tier.c1, animation: `badgeSparkle 2.6s ${tier.delay} ease-in-out infinite` }}>
          <Sparkle />
        </div>
        {/* lock overlay for unearned badges */}
        {!earned && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} color="var(--muted)" />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: earned ? '#f4efe6' : 'var(--muted)' }}>{tier.label}</span>
        <span style={{ fontSize: '12px', lineHeight: 1.45, color: 'var(--muted)', maxWidth: '130px' }}>
          {earned ? tier.caption : 'Not yet earned'}
        </span>
      </div>
    </div>
  );
}

// Popup listing every account-age milestone badge, earned ones lit + animated and
// the rest grayed out. Driven purely by the user's createdAt.
export default function BadgesModal({ user, onClose }) {
  const tiers = earnedTiers(user?.createdAt);
  return (
    <Modal onClose={onClose} icon={false} className="modal-badges">
      <button className="modal-close-x" onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>
      <h2 className="modal-title">Account milestone badges</h2>
      <p className="modal-sub">Awarded automatically as the account reaches each age milestone.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '14px' }}>
        {tiers.map((t) => <Medallion key={t.label} tier={t} />)}
      </div>
    </Modal>
  );
}
