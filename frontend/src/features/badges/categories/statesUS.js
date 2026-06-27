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

// The 50 states only — excludes D.C. and territories (American Samoa, Guam,
// Northern Mariana Islands, Puerto Rico, U.S. Virgin Islands) present in /flags.
const US_STATES = new Set([
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
]);

// "…/Flag_of_the_Northern_Mariana_Islands.svg" → "Northern Mariana Islands";
// "…/Flag_of_Georgia_(U.S._state).svg" → "Georgia".
function nameFromPath(path) {
  return path
    .split('/').pop()
    .replace(/\.svg$/, '')
    .replace(/^Flag_of_/, '')
    .replace(/^the_/, '')
    .replace(/_/g, ' ')
    .replace(/ designed by.*$/i, '')   // Colorado's long filename
    .replace(/ \(U\.S\. state\)$/i, '') // Georgia
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
  .filter((b) => US_STATES.has(b.label))
  .sort((a, b) => a.label.localeCompare(b.label));

export const statesUSCategory = {
  id: 'states-us',
  title: 'Passports (United States)',
  subtitle: "Stamps for the U.S. states you've visited.",
  getBadges() {
    return BADGES;
  },
};
