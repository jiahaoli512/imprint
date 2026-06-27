import countries from 'flag-icons/country.json';

// Countries badge category ("Passports") — one badge per country, the flag shown
// in the coin. The ring/halo/tails are tinted by continent (the flag carries the
// per-country identity). All badges are locked for now; visited-country detection
// (markers → country) is a later feature that will flip `earned` per country via
// ctx, with no change needed here, in Badge, or in the modal.

// Per-continent medallion colors: c1/c2 are the coin gradient behind the flag,
// halo tints the glow. spin/delay only matter once a badge is earned (animated).
const CONTINENT_COLORS = {
  'Africa':        { c1: '#e2a156', c2: '#c97b3d', halo: 'rgba(226,161,86,0.34)' },
  'Asia':          { c1: '#e0605f', c2: '#b83e3d', halo: 'rgba(224,96,95,0.34)' },
  'Europe':        { c1: '#5aa9e6', c2: '#3577b0', halo: 'rgba(90,169,230,0.32)' },
  'North America': { c1: '#34c9ae', c2: '#1f8c76', halo: 'rgba(52,201,174,0.32)' },
  'South America': { c1: '#9b6dc2', c2: '#6f47a0', halo: 'rgba(155,109,194,0.32)' },
  'Oceania':       { c1: '#d4af62', c2: '#b58a3c', halo: 'rgba(212,175,98,0.38)' },
  'Antarctica':    { c1: '#7fd3e6', c2: '#4a93a8', halo: 'rgba(127,211,230,0.32)' },
};
const FALLBACK_COLORS = { c1: '#93897a', c2: '#6b6356', halo: 'rgba(147,137,122,0.3)' };

// Built once at module load (pure data). Only ISO countries, sorted by name.
const BADGES = countries
  .filter((c) => c.iso)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({
    key: c.code,
    code: c.code,
    coin: 'flag',
    label: c.name,
    caption: c.continent || 'Visited',
    earned: false,
    spin: '10s',
    delay: '0s',
    ...(CONTINENT_COLORS[c.continent] || FALLBACK_COLORS),
  }));

export const countriesCategory = {
  id: 'countries',
  title: 'Passports',
  subtitle: "Stamps for the countries you've visited.",
  getBadges() {
    return BADGES;
  },
};
