import { useLocation } from 'react-router-dom';

// True when the current route is under the admin section (/admin/...). Keeps the
// "what counts as admin view" convention in one place.
export function useAdminView() {
  return useLocation().pathname.startsWith('/admin/');
}
