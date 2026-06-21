import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

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
    fetcher(username)
      .then((d) => { if (active) setUser(d); })
      .catch((err) => {
        if (active && redirectOnNotFound && err.status === 404) {
          navigate('/user-not-found', { replace: true });
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, setUser, loading };
}
