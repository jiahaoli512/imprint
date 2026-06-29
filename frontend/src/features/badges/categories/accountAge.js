// Account-age badge category. Badges are awarded automatically as the account
// ages, so the only input is the account's createdAt — earned state is computed
// entirely client-side (no backend). Designs (colors, captions, animation
// timing) are ported from the account-milestone bundles.

const DAY_MS = 24 * 60 * 60 * 1000;

// Ordered earliest → latest milestone. `thresholdDays` is the account age at
// which the badge is earned. c1/c2 are the coin gradient stops; halo tints the
// glow; spin/delay drive the per-badge ring + sparkle timing. Every badge has a
// unique hue (crimson → teal → blue → purple → orange → gold). `coin: 'check'`
// renders a checkmark instead of a value/unit pair.
const TIERS = [
  { coin: 'check', label: 'Account Created', caption: "You're all set — ready to explore.", thresholdDays: 0, c1: '#e0605f', c2: '#b83e3d', halo: 'rgba(224,96,95,0.34)', spin: '9s', delay: '0.2s' },
  { value: '1', unit: 'Day',    label: 'Day One',     caption: 'Freshly joined — welcome aboard.', thresholdDays: 1,   c1: '#34c9ae', c2: '#1f8c76', halo: 'rgba(52,201,174,0.32)',  spin: '8s',  delay: '0s'   },
  { value: '1', unit: 'Week',   label: 'One Week',    caption: 'Settling in nicely.',              thresholdDays: 7,   c1: '#5aa9e6', c2: '#3577b0', halo: 'rgba(90,169,230,0.32)',  spin: '9s',  delay: '0.4s' },
  { value: '1', unit: 'Month',  label: 'One Month',   caption: 'A regular now.',                   thresholdDays: 30,  c1: '#9b6dc2', c2: '#6f47a0', halo: 'rgba(155,109,194,0.32)', spin: '10s', delay: '0.8s' },
  { value: '6', unit: 'Months', label: 'Half a Year', caption: 'A loyal member.',                  thresholdDays: 182, c1: '#e2a156', c2: '#c97b3d', halo: 'rgba(226,161,86,0.34)',  spin: '11s', delay: '1.2s' },
  { value: '1', unit: 'Year',   label: 'One Year',    caption: 'Veteran status unlocked.',         thresholdDays: 365, c1: '#d4af62', c2: '#b58a3c', halo: 'rgba(212,175,98,0.38)',  spin: '12s', delay: '1.6s' },
];

// A badge category: metadata + a pure `getBadges(ctx)` that maps the relevant
// slice of context to earned/unearned badges. New categories (e.g. countries
// visited) implement this same shape and register themselves in ./index.js.
export const accountAgeCategory = {
  id: 'account-age',
  title: 'Account Milestone badges',
  subtitle: 'Awarded automatically as the account reaches each age milestone.',
  getBadges({ user }) {
    const created = user?.createdAt ? new Date(user.createdAt).getTime() : NaN;
    const ageDays = Number.isNaN(created) ? -1 : (Date.now() - created) / DAY_MS;
    return TIERS.map((t) => ({ ...t, key: t.label, earned: ageDays >= t.thresholdDays }));
  },
};
