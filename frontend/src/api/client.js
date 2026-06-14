const BASE = import.meta.env.VITE_API_URL || window.location.origin;

async function request(path, options = {}) {
  const token = localStorage.getItem('imprint_token');
  const method = options.method || 'GET';
  const url = `${BASE}${path}`;

  let res;
  if (method === 'GET' && !token) {
    res = await fetch(url);
  } else {
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    res = await fetch(url, { ...options, headers });
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/api/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:       ()     => request('/api/auth/me'),

  // Waitlist
  joinWaitlist: (body) => request('/api/waitlist', { method: 'POST', body: JSON.stringify(body) }),
  waitlistCount: ()    => request('/api/waitlist/count'),
  getWaitlist:          ()    => request('/api/waitlist'),
  deleteWaitlistEntry:  (id)  => request(`/api/waitlist/${id}`, { method: 'DELETE' }),
  reorderWaitlist:      (ids) => request('/api/waitlist/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),
  approveWaitlistEntry: (id)  => request(`/api/waitlist/${id}/approve`, { method: 'PATCH' }),

  // Locations
  getLocations: ()     => request('/api/locations'),
  logLocation:  (body) => request('/api/locations', { method: 'POST', body: JSON.stringify(body) }),
  getCoverage:  ()     => request('/api/locations/coverage'),
  deleteLocation: (id) => request(`/api/locations/${id}`, { method: 'DELETE' }),
};
