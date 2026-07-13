import { useState } from 'react';
import { api } from '../../api/client';

// Owns the "Export your data" action: trigger the backend to email both CSVs
// (locations + markers) to the account's own address, and the
// in-flight/sent/error state. `exportAccountData` is injected (default: the
// real API call) — named after the api method it defaults to, matching
// useLogoutAllDevices's `logoutAllDevices` and ChangePasswordForm's
// `changePassword` params — so this is testable without mocking the whole
// api/client module.
export function useAccountExport({ exportAccountData = api.exportAccountData } = {}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSent, setExportSent] = useState(false);

  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      await exportAccountData();
      setExportSent(true);
    } catch (err) {
      setExportError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportError, exportSent, handleExport };
}
