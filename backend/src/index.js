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

function isAllowedOrigin(origin) {
  if (originAllowlist.has(origin)) return true;
  let hostname;
  try { hostname = new URL(origin).hostname; } catch { return false; }
  // Any localhost / loopback port (Vite may pick 5173, 5174, 5180, … in dev)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true;
  // Vercel preview + production deployments
  if (/\.vercel\.app$/.test(hostname)) return true;
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
