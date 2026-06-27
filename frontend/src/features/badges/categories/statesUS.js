// "Passports (United States)" — one badge per U.S. state/territory, using the
// SVG flags in src/assets/state-flags (provided in /flags). Same layout as the
// Passports category but with a uniform red/white/blue medallion theme and no
// region filter. All locked for now (visited detection is a later feature).

// Vite resolves each SVG to a bundled URL at build time, keyed by file path.
const flagUrls = import.meta.glob('../../../assets/state-flags/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

// Uniform stars-and-stripes theme for the ring/halo/tails/sparkle (the state
// flag is the coin). ring is a red→white→blue conic; tails are red (c1) + blue
// (c2); halo is a soft white glow.
const US_THEME = {
  c1: '#b22234',
  c2: '#3c3b6e',
  halo: 'rgba(255,255,255,0.35)',
  ring: 'conic-gradient(from 0deg, #b22234, #ffffff, #3c3b6e, #ffffff, #b22234)',
  spin: '10s',
  delay: '0s',
};

// "…/Flag_of_the_Northern_Mariana_Islands.svg" → "Northern Mariana Islands".
function nameFromPath(path) {
  return path
    .split('/').pop()
    .replace(/\.svg$/, '')
    .replace(/^Flag_of_/, '')
    .replace(/^the_/, '')
    .replace(/_/g, ' ')
    .replace(/ designed by.*$/i, '') // Colorado's long filename
    .trim();
}

const BADGES = Object.entries(flagUrls)
  .map(([path, url]) => ({
    key: path,
    coin: 'img',
    img: url,
    label: nameFromPath(path),
    caption: 'United States',
    earned: false,
    ...US_THEME,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const statesUSCategory = {
  id: 'states-us',
  title: 'Passports (United States)',
  subtitle: "Stamps for the U.S. states you've visited.",
  getBadges() {
    return BADGES;
  },
};
