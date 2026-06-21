// Quick verification of stored location points.
//   npm run locations:check                     → uses MONGODB_URI from .env (local)
//   MONGODB_URI="<atlas uri>" npm run locations:check  → checks Atlas / Render's DB
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Location = require('../src/models/Location');
const User = require('../src/models/User');

// Personal data (emails, usernames, coordinates) is redacted unless --show-pii
// is passed, so casual runs against a real DB don't dump private data.
const SHOW_PII = process.argv.includes('--show-pii');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to:', uri.replace(/\/\/[^@]*@/, '//<credentials>@'));
  if (!SHOW_PII) console.log('(emails / coordinates redacted — pass --show-pii to reveal)');

  const total = await Location.countDocuments();
  console.log(`\nTotal location points: ${total}`);

  if (total > 0) {
    const byUser = await Location.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 }, last: { $max: '$visitedAt' } } },
      { $sort: { count: -1 } },
    ]);
    console.log('\nPer user:');
    for (const row of byUser) {
      const u = await User.findById(row._id, 'email username');
      const who = SHOW_PII ? (u?.username || u?.email || row._id) : `user …${String(row._id).slice(-6)}`;
      console.log(`  ${who}: ${row.count} points (last ${row.last ? row.last.toISOString() : '—'})`);
    }

    const recent = await Location.find({}, 'lat lng accuracy visitedAt').sort({ visitedAt: -1 }).limit(5);
    console.log('\nMost recent points:');
    recent.forEach((p) => {
      const coords = SHOW_PII ? `${p.lat}, ${p.lng}` : '[redacted]';
      console.log(`  ${p.visitedAt ? p.visitedAt.toISOString() : '—'}  ${coords}  (±${p.accuracy ?? '?'}m)`);
    });
  } else {
    console.log('\n(no points yet — confirm the app uploaded against this same backend/DB)');
  }

  await mongoose.disconnect();
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
