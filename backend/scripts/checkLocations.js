// Quick verification of stored location points.
//   npm run locations:check                     → uses MONGODB_URI from .env (local)
//   MONGODB_URI="<atlas uri>" npm run locations:check  → checks Atlas / Render's DB
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Location = require('../src/models/Location');
const User = require('../src/models/User');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to:', uri.replace(/\/\/[^@]*@/, '//<credentials>@'));

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
      const who = u?.username || u?.email || row._id;
      console.log(`  ${who}: ${row.count} points (last ${row.last ? row.last.toISOString() : '—'})`);
    }

    const recent = await Location.find({}, 'lat lng accuracy visitedAt').sort({ visitedAt: -1 }).limit(5);
    console.log('\nMost recent points:');
    recent.forEach((p) => {
      console.log(`  ${p.visitedAt ? p.visitedAt.toISOString() : '—'}  ${p.lat}, ${p.lng}  (±${p.accuracy ?? '?'}m)`);
    });
  } else {
    console.log('\n(no points yet — confirm the app uploaded against this same backend/DB)');
  }

  await mongoose.disconnect();
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
