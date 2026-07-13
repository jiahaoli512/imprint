import { useState } from 'react';
import { api } from '../../api/client';
import { downloadCsv } from '../../utils/csv';

// Owns the "Export your data" action: fetch, build the two CSVs (locations
// and markers have unrelated column shapes — 4 columns with timestamps vs.
// bare coordinate pairs — so they're separate files rather than one with a
// section-header hack), and the in-flight/error state. `exportAccountData` is
// injected (default: the real API call) — named after the api method it
// defaults to, matching useLogoutAllDevices's `logoutAllDevices` and
// ChangePasswordForm's `changePassword` params — so this is testable without
// mocking the whole api/client module.
export function useAccountExport({ exportAccountData = api.exportAccountData } = {}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      const data = await exportAccountData();
      downloadCsv('imprint-locations.csv', [
        ['Latitude', 'Longitude', 'Accuracy (m)', 'Visited At'],
        ...data.locations.map((l) => [l.lat, l.lng, l.accuracy, l.visitedAt]),
      ]);
      downloadCsv('imprint-markers.csv', [
        ['Latitude', 'Longitude'],
        ...data.markers,
      ]);
    } catch (err) {
      setExportError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportError, handleExport };
}
