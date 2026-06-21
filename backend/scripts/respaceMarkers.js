// Re-thins every stored map so markers are at least MARKER_SPACING_M (100m)
// apart, matching the new passive-tracking spacing. Existing maps were built at
// ~30m spacing, producing dense overlapping "tubes" along routes; this collapses
// each cluster down to its first point, in order.
//
//   node scripts/respaceMarkers.js            → dry run (reports before/after, writes nothing)
//   node scripts/respaceMarkers.js --apply    → persists the thinned maps
//   MONGODB_URI="<atlas uri>" node scripts/respaceMarkers.js --apply  → run against Atlas
//
// Always dry-run first and eyeball the numbers before --apply.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const MapMarkers = require('../src/models/MapMarkers');
const User = require('../src/models/User');
const { thinPoints, MARKER_SPACING_M } = require('../src/services/markerService');

const APPLY = process.argv.includes('--apply');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to:', uri.replace(/\/\/[^@]*@/, '//<credentials>@'));
  console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}  •  spacing: ${MARKER_SPACING_M}m\n`);

  const docs = await MapMarkers.find({});
  let totalBefore = 0;
  let totalAfter = 0;

  for (const doc of docs) {
    const before = Array.isArray(doc.points) ? doc.points.length : 0;
    const thinned = thinPoints(doc.points || []);
    const after = thinned.length;
    totalBefore += before;
    totalAfter += after;

    // Resolve a human label (singleton = admin demo map; otherwise the user).
    let who = doc._id.toString();
    if (who !== 'singleton') {
      const u = await User.findById(who, 'username email');
      who = u?.username || u?.email || who;
    }
    console.log(`  ${who}: ${before} → ${after}  (-${before - after})`);

    if (APPLY && after !== before) {
      doc.points = thinned;
      await doc.save();
    }
  }

  console.log(`\nMaps: ${docs.length}  •  markers: ${totalBefore} → ${totalAfter}  (-${totalBefore - totalAfter})`);
  console.log(APPLY ? 'Done — maps updated.' : 'Dry run only — re-run with --apply to persist.');

  await mongoose.disconnect();
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
