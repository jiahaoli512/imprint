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
// Verb helpers (post/patch/put/del) wrap the JSON-body boilerplate.
function makeRequest(getTokenFn) {
  async function request(path, options = {}) {
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
  }
  request.post  = (path, body) => request(path, { method: 'POST',  body: JSON.stringify(body) });
  request.patch = (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
  request.put   = (path, body) => request(path, { method: 'PUT',   body: JSON.stringify(body) });
  request.del   = (path)       => request(path, { method: 'DELETE' });
  return request;
}

const request = makeRequest(getToken);
const adminRequest = makeRequest(getAdminToken);

export const api = {
  // Users / Auth
  register:       (body)               => request.post('/api/users', body),
  login:          (body)               => request.post('/api/users/login', body),
  checkWaitlist:  (email)              => request(`/api/waitlist/check?email=${encodeURIComponent(email)}`),
  checkUsername:  (username)           => request(`/api/users/check-username?username=${encodeURIComponent(username)}`),
  setupProfile:   (body)               => request.patch('/api/users/profile', body),
  getUser:        (username)           => request(`/api/users/by-username/${encodeURIComponent(username)}`),
  updateUser:     (username, body)     => request.patch(`/api/users/by-username/${encodeURIComponent(username)}`, body),
  searchUsers:    (q)                  => request(`/api/users/search?q=${encodeURIComponent(q)}`),

  // Markers
  getMarkers:      (username) => request(`/api/markers/user/${encodeURIComponent(username)}`),
  saveMarkers:     (points)   => request.put('/api/markers', { points }),
  getAdminMarkers: ()                => adminRequest('/api/markers'),
  adminSaveMarkers: (username, points) => adminRequest.put(`/api/markers/user/${encodeURIComponent(username)}`, { points }),

  // Locations (background tracking)
  logLocations: (points) => request.post('/api/locations', { points }),
  getLocations: ()       => request('/api/locations'),
  getCoverage:  ()       => request('/api/locations/coverage'),

  // Waitlist (public)
  joinWaitlist:  (body)  => request.post('/api/waitlist', body),
  waitlistCount: ()      => request('/api/waitlist/count'),

  // Contact (public)
  sendContact:   (body)  => request.post('/api/contact', body),

  // Admin
  adminLogin:           (password)       => request.post('/api/admin/login', { password }),
  adminGetUser:         (username)       => adminRequest(`/api/users/by-username/${encodeURIComponent(username)}`),
  adminUpdateUser:      (username, body) => adminRequest.patch(`/api/users/by-username/${encodeURIComponent(username)}`, body),
  listUsers:            ()               => adminRequest('/api/users'),
  getWaitlist:          ()         => adminRequest('/api/waitlist'),
  deleteWaitlistEntry:  (id)       => adminRequest.del(`/api/waitlist/${id}`),
  reorderWaitlist:      (ids)      => adminRequest.patch('/api/waitlist/reorder', { ids }),
  approveWaitlistEntry: (id)       => adminRequest.patch(`/api/waitlist/${id}/approve`),
};

// Resolve the right profile API calls for the current view (admin vs. self),
// so pages don't repeat `isAdminView ? api.adminX : api.X` ternaries.
export function profileApiFor(isAdminView) {
  return isAdminView
    ? { getUser: api.adminGetUser, updateUser: api.adminUpdateUser }
    : { getUser: api.getUser, updateUser: api.updateUser };
}

// Resolve marker load/save bound to a username for the current view. Loading is
// the same for both; only the save endpoint differs.
export function markersApiFor(isAdminView, username) {
  return {
    load: () => api.getMarkers(username),
    save: isAdminView ? (points) => api.adminSaveMarkers(username, points) : api.saveMarkers,
  };
}
