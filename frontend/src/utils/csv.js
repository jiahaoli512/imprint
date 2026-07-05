// CSV serialization + download, with spreadsheet formula-injection protection.
// Kept separate from any feature so the injection-safe escaping lives in one
// place and is reusable by any table export.

// Escapes a single cell: doubles quotes, and prefixes a `'` to values that begin
// with a formula trigger so spreadsheets can't execute injected content (e.g. a
// name of `=HYPERLINK(...)`), then wraps in quotes.
function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// Serializes rows (array of arrays; first row typically the header) to a CSV string.
export function toCsv(rows) {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

// Serializes rows and triggers a browser download of the resulting CSV file.
export function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
