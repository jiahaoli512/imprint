const { toCsv } = require('../utils/csv');
const { getUserLocations } = require('./locationService');
const { getOwnMarkers } = require('./markerService');
const { sendExportEmail } = require('../utils/email');

// Builds the two export CSVs (unrelated column shapes — locations carry
// accuracy/timestamps, markers are bare coordinate pairs — so they stay
// separate files) and emails them to the account's own address, rather than
// returning them for a browser download: location history + map markers are
// a full GPS trail, so handing it back over the same connection/response the
// client already controls is a smaller trust boundary than mailing it to the
// address on file, which only the account owner can read.
async function emailAccountExport(userId, email) {
  const [locations, markers] = await Promise.all([
    getUserLocations(userId),
    getOwnMarkers(userId),
  ]);

  const locationsCsv = toCsv([
    ['Latitude', 'Longitude', 'Accuracy (m)', 'Visited At'],
    ...locations.map((l) => [l.lat, l.lng, l.accuracy ?? '', l.visitedAt.toISOString()]),
  ]);
  const markersCsv = toCsv([
    ['Latitude', 'Longitude'],
    ...markers,
  ]);

  await sendExportEmail(email, { locationsCsv, markersCsv });
}

module.exports = { emailAccountExport };
