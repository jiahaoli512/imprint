import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession } from '../../api/client';
import { pauseTracking } from '../location/backgroundTracking';

// Owns the "Log out of all devices" action: flush, revoke, clear, redirect —
// same shape as useAccountExport (fetch/build + in-flight state), extracted
// for the same reason. `logoutAllDevices` is injected (default: the real API
// call), matching how ChangePasswordForm injects `changePassword`.
export function useLogoutAllDevices({ logoutAllDevices = api.logoutAllDevices } = {}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    // Flush buffered points (needs the still-valid token) BEFORE revoking
    // every session server-side — logoutAllDevices bumps tokenVersion, which
    // invalidates this device's own token too, so calling it first would make
    // the flush 401 (same ordering LogoutModal.jsx uses, for the same reason).
    await pauseTracking();
    try {
      await logoutAllDevices();
    } finally {
      clearSession();
      navigate('/home');
    }
  }

  return { loading, handleConfirm };
}
