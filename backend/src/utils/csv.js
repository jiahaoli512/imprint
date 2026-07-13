// Server-side mirror of frontend/src/utils/csv.js's `toCsv` — same
// formula-injection-safe escaping, needed here now that export CSVs are
// built server-side (for emailing) instead of in the browser.
function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

module.exports = { toCsv };
