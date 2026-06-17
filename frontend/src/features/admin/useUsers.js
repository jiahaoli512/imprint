import { useState, useEffect } from 'react';
import { api } from '../../api/client';

// Loads the list of registered users for the admin view.
export function useUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.listUsers().then(setUsers).catch(() => {});
  }, []);

  return { users };
}
