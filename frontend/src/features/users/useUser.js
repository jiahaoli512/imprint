import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUsername, refreshUsername } from '../../api/client';
import { retry } from '../../utils/retry';

// Loads a user profile by username, centralizing the fetch + optional
// 404-redirect that several pages repeated. `fetcher` lets callers use the admin
// endpoint (e.g. profileApiFor(isAdminView).getUser); defaults to api.getUser.
// Returns setUser too, so callers can reflect an edit without refetching.
export function useUser(username, { fetcher = api.getUser, redirectOnNotFound = false } = {}) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Retry transient failures (e.g. a cold backend) so the profile/greeting
    // doesn't render empty until the user navigates away and back.
    retry(() => fetcher(username))
      .then((d) => { if (active) setUser(d); })
      .catch(async (err) => {
        if (!active || err.status !== 404) return;
        // A 404 fetching what's supposed to be *my own* username most likely
        // means it was renamed on another device/session and this client's
        // cached username (main.jsx's boot-time refreshUsername missed, or
        // hasn't resolved yet) is stale, not that the account is actually
        // gone. Resync and retry once under the corrected username before
        // falling back to a real "not found" — otherwise this leaves the
        // dashboard permanently 404ing (no greeting, no markers) until a
        // manual logout/login.
        if (username === getUsername()) {
          const fresh = await refreshUsername();
          if (active && fresh && fresh !== username) {
            navigate(`/${fresh}/dashboard`, { replace: true });
            return;
          }
        }
        if (active && redirectOnNotFound) {
          navigate('/user-not-found', { replace: true });
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, setUser, loading };
}
