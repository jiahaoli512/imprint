import { useState } from 'react';
import { api } from '../../api/client';

// Owns the "Export your data" flow: a confirm step, then a password
// re-entry gate (like ChangePasswordForm's re-auth, not the forgot-password
// email-code flow), before the backend actually emails both CSVs (locations
// + markers) to the account's own address. `exportAccountData` is injected
// (default: the real API call) — named after the api method it defaults to,
// matching useLogoutAllDevices's `logoutAllDevices` and ChangePasswordForm's
// `changePassword` params — so this is testable without mocking the whole
// api/client module.
export function useAccountExport({ exportAccountData = api.exportAccountData } = {}) {
  const [step, setStep] = useState('idle'); // idle | confirm | password | sent
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  function openConfirm() {
    setExportError('');
    setStep('confirm');
  }
  function proceedToPassword() {
    setStep('password');
  }
  function cancel() {
    setStep('idle');
    setExportError('');
  }

  async function submitPassword(password) {
    setExporting(true);
    setExportError('');
    try {
      await exportAccountData(password);
      setStep('sent');
    } catch (err) {
      setExportError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return { step, exporting, exportError, openConfirm, proceedToPassword, cancel, submitPassword };
}
