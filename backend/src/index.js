require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./db');
const { apiLimiter } = require('./middleware/rateLimit');
const sanitizeBody = require('./middleware/sanitize');

const adminRoutes = require('./routes/admin');
const waitlistRoutes = require('./routes/waitlist');
const userRoutes = require('./routes/users');
const markerRoutes = require('./routes/markers');
const locationRoutes = require('./routes/locations');
const contactRoutes = require('./routes/contact');
const friendRoutes = require('./routes/friends');
const activityRoutes = require('./routes/activity');

// Fail fast at startup if a critical secret is missing, rather than discovering
// it at first use (a 500 mid-request). Email vars only warn — the app runs
// without them, just can't send mail.
function validateConfig() {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_PASSWORD'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[config] Missing required env var(s): ${missing.join(', ')}`);
    process.exit(1);
  }
  for (const k of ['BREVO_API_KEY', 'EMAIL_USER']) {
    if (!process.env[k]) console.warn(`[config] ${k} not set — email features will not work.`);
  }
}
validateConfig();

const app = express();
const PORT = process.env.PORT || 4000;

// Behind Render/Vercel proxies — needed for correct client IPs in rate limiting
app.set('trust proxy', 1);

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

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (native apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
}));
// Marker saves carry the whole points array — a busy map can be a couple MB (up
// to the 50k-point validatePoints cap) — so the markers routes get a larger body
// limit. This parser runs first and sets req._body, so the global 100kb parser
// below skips re-parsing those requests. Everything else stays tight at 100kb.
app.use('/api/markers', express.json({ limit: '4mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeBody);
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/admin', adminRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/markers', markerRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/activity', activityRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'User already on the waitlist!' });
  }
  console.error(err.stack);
  // Only surface messages for intentional (status-tagged) errors; never leak
  // internal error details on unexpected 500s.
  const status = err.status || 500;
  const message = err.status ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Imprint API running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('Failed to connect to MongoDB:', err.message); process.exit(1); });
