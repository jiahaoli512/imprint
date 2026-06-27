// Account-age milestone badges. Awarded automatically as an account ages — the
// only input is the account's createdAt, so earned state is computed entirely
// client-side (no backend). Tier designs (colors, captions, animation timing)
// are ported from the original account_milestone.html bundle.

const DAY_MS = 24 * 60 * 60 * 1000;

// Ordered youngest → oldest milestone. `thresholdDays` is the account age at
// which the badge is earned. c1/c2 are the coin gradient stops; halo tints the
// pulsing glow; spin/delay drive the per-tier ring + sparkle animation. Every
// tier has a unique hue (crimson → teal → blue → purple → orange → gold). The
// first tier renders a checkmark coin (`check`) instead of a value/unit coin.
export const TIERS = [
  { check: true, label: 'Account Created', caption: "You're all set — ready to explore.", thresholdDays: 0, c1: '#e0605f', c2: '#b83e3d', halo: 'rgba(224,96,95,0.34)', spin: '9s', delay: '0.2s' },
  { value: '1', unit: 'Day',    label: 'Day One',     caption: 'Freshly joined — welcome aboard.', thresholdDays: 1,   c1: '#34c9ae', c2: '#1f8c76', halo: 'rgba(52,201,174,0.32)',  spin: '8s',  delay: '0s'   },
  { value: '1', unit: 'Week',   label: 'One Week',    caption: 'Settling in nicely.',              thresholdDays: 7,   c1: '#5aa9e6', c2: '#3577b0', halo: 'rgba(90,169,230,0.32)',  spin: '9s',  delay: '0.4s' },
  { value: '1', unit: 'Month',  label: 'One Month',   caption: 'A regular now.',                   thresholdDays: 30,  c1: '#9b6dc2', c2: '#6f47a0', halo: 'rgba(155,109,194,0.32)', spin: '10s', delay: '0.8s' },
  { value: '6', unit: 'Months', label: 'Half a Year', caption: 'A loyal member.',                  thresholdDays: 182, c1: '#e2a156', c2: '#c97b3d', halo: 'rgba(226,161,86,0.34)',  spin: '11s', delay: '1.2s' },
  { value: '1', unit: 'Year',   label: 'One Year',    caption: 'Veteran status unlocked.',         thresholdDays: 365, c1: '#d4af62', c2: '#b58a3c', halo: 'rgba(212,175,98,0.38)',  spin: '12s', delay: '1.6s' },
];

// Annotates each tier with `earned` based on how long ago the account was
// created. A missing/invalid createdAt yields all-unearned rather than throwing.
export function earnedTiers(createdAt) {
  const created = createdAt ? new Date(createdAt).getTime() : NaN;
  const ageDays = Number.isNaN(created) ? -1 : (Date.now() - created) / DAY_MS;
  return TIERS.map((t) => ({ ...t, earned: ageDays >= t.thresholdDays }));
}
