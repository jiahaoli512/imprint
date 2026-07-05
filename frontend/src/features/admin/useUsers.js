import { api } from '../../api/client';
import { useAsync } from '../../utils/useAsync';

// Loads the list of registered users for the admin view, exposing loading/error
// so the table can tell "still loading" / "failed" apart from "no users". Thin
// adapter over useAsync: default the list to [] and surface the error message.
export function useUsers() {
  const { data, loading, error } = useAsync(api.listUsers);
  return { users: data || [], loading, error: error ? (error.message || 'Failed to load users.') : '' };
}
