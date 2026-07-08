// Which origins the API trusts — split out of index.js so the security-policy
// logic (dynamic Vercel-preview matching, localhost port flexibility) is its
// own focused, independently readable module rather than mixed into app
// bootstrap/wiring.

// Allowed origins: configurable via env, plus sensible defaults for dev + native
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = [
  'capacitor://localhost', // iOS native (Capacitor)
  'ionic://localhost',
];

const originAllowlist = new Set([...defaultOrigins, ...allowedOrigins]);

// Vercel deployments are matched by project slug so previews work without
// allowing every *.vercel.app site. Override via VERCEL_PROJECT_SLUG.
const VERCEL_PROJECT = (process.env.VERCEL_PROJECT_SLUG || 'imprint').toLowerCase();

function isAllowedOrigin(origin) {
  if (originAllowlist.has(origin)) return true;
  let hostname;
  try { hostname = new URL(origin).hostname; } catch { return false; }
  // Any localhost / loopback port (Vite may pick 5173, 5174, 5180, … in dev)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true;
  // Vercel deployments for THIS project only (preview URLs are dynamic), e.g.
  // imprint.vercel.app, imprint-git-<branch>.vercel.app, imprint-<hash>-<scope>.vercel.app.
  // Anchor the project slug to the start of the host so an attacker-owned
  // `evil-imprint.vercel.app` / `imprintxyz.vercel.app` can't pass a loose
  // substring match: the slug must be the whole host label or immediately
  // followed by Vercel's '-' separator. Custom prod domains go in ALLOWED_ORIGINS.
  if (hostname.endsWith('.vercel.app')) {
    const sub = hostname.slice(0, -'.vercel.app'.length);
    if (sub === VERCEL_PROJECT || sub.startsWith(`${VERCEL_PROJECT}-`)) return true;
  }
  return false;
}

module.exports = { isAllowedOrigin };
