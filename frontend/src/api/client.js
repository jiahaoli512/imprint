export const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
const BASE = apiBase;

export const getUsername = () => localStorage.getItem('imprint_username');
export const setUsername = (u) => localStorage.setItem('imprint_username', u);
export const getToken = () => localStorage.getItem('imprint_token');
export const setToken = (t) => localStorage.setItem('imprint_token', t);
export const clearSession = () => {
  localStorage.removeItem('imprint_username');
  localStorage.removeItem('imprint_token');
};

export const getAdminToken = () => sessionStorage.getItem('admin_token');
export const setAdminToken = (t) => sessionStorage.setItem('admin_token', t);
export const clearAdminSession = () => {
  sessionStorage.removeItem('admin_auth');
  sessionStorage.removeItem('admin_token');
};

// Builds a request function bound to a token source (user vs. admin). Both
// variants share identical URL/header/error handling — only the token differs.
function makeRequest(getTokenFn) {
  return async function request(path, options = {}) {
    const token = getTokenFn();
    const url = `${BASE}${path}`;
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  };
}

const request = makeRequest(getToken);
const adminRequest = makeRequest(getAdminToken);

export const api = {
  // Users / Auth
  register:       (body)               => request('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  login:          (body)               => request('/api/users/login', { method: 'POST', body: JSON.stringify(body) }),
  checkWaitlist:  (email)              => request(`/api/waitlist/check?email=${encodeURIComponent(email)}`),
  checkUsername:  (username)           => request(`/api/users/check-username?username=${encodeURIComponent(username)}`),
  setupProfile:   (body)               => request('/api/users/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  getUser:        (username)           => request(`/api/users/by-username/${encodeURIComponent(username)}`),
  updateUser:     (username, body)     => request(`/api/users/by-username/${encodeURIComponent(username)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  searchUsers:    (q)                  => request(`/api/users/search?q=${encodeURIComponent(q)}`),

  // Markers
  getMarkers:      (username) => request(`/api/markers/user/${encodeURIComponent(username)}`),
  saveMarkers:     (points)   => request('/api/markers', { method: 'PUT', body: JSON.stringify({ points }) }),
  getAdminMarkers: ()                => adminRequest('/api/markers'),
  adminSaveMarkers: (username, points) => adminRequest(`/api/markers/user/${encodeURIComponent(username)}`, { method: 'PUT', body: JSON.stringify({ points }) }),

  // Waitlist (public)
  joinWaitlist:  (body)  => request('/api/waitlist', { method: 'POST', body: JSON.stringify(body) }),
  waitlistCount: ()      => request('/api/waitlist/count'),

  // Admin
  adminLogin:           (password)       => request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  adminGetUser:         (username)       => adminRequest(`/api/users/by-username/${encodeURIComponent(username)}`),
  adminUpdateUser:      (username, body) => adminRequest(`/api/users/by-username/${encodeURIComponent(username)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  listUsers:            ()               => adminRequest('/api/users'),
  getWaitlist:          ()         => adminRequest('/api/waitlist'),
  deleteWaitlistEntry:  (id)       => adminRequest(`/api/waitlist/${id}`, { method: 'DELETE' }),
  reorderWaitlist:      (ids)      => adminRequest('/api/waitlist/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),
  approveWaitlistEntry: (id)       => adminRequest(`/api/waitlist/${id}/approve`, { method: 'PATCH' }),
};
