import { useState, useEffect } from 'react';
import { api } from '../../api/client';

// Loads the list of registered users for the admin view, exposing loading/error
// so the table can tell "still loading" / "failed" apart from "no users".
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listUsers()
      .then(setUsers)
      .catch((e) => setError(e.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
}
