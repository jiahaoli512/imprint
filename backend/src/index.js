require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./db');
const { apiLimiter } = require('./middleware/rateLimit');

const adminRoutes = require('./routes/admin');
const waitlistRoutes = require('./routes/waitlist');
const userRoutes = require('./routes/users');
const markerRoutes = require('./routes/markers');

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
  'http://localhost:5173',
  'http://localhost:4173',
  'capacitor://localhost', // iOS native (Capacitor)
  'ionic://localhost',
];

const originAllowlist = new Set([...defaultOrigins, ...allowedOrigins]);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (native apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (originAllowlist.has(origin) || /\.vercel\.app$/.test(new URL(origin).hostname)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/admin', adminRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/markers', markerRoutes);

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'User already on the waitlist!' });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Imprint API running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('Failed to connect to MongoDB:', err.message); process.exit(1); });
