require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/auth');
const waitlistRoutes = require('./routes/waitlist');
const locationRoutes = require('./routes/locations');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({ error: 'User already on the waitlist!' });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Imprint API running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('Failed to connect to MongoDB:', err.message); process.exit(1); });
