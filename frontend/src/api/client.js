export const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

export const getUsername = () => localStorage.getItem('imprint_username');
export const setUsername = (u) => localStorage.setItem('imprint_username', u);
export const getToken = () => localStorage.getItem('imprint_token');
export const setToken = (t) => localStorage.setItem('imprint_token', t);
export const clearSession = () => {
  localStorage.removeItem('imprint_username');
  localStorage.removeItem('imprint_token');
};

// Per-device map render-quality preference. Validation against the known tiers
// lives in mapQuality.js (which owns the value set); here we only read/write the
// raw string, keeping all storage access in this module.
export const getStoredMapQuality = () => localStorage.getItem('imprint_map_quality');
export const setStoredMapQuality = (q) => localStorage.setItem('imprint_map_quality', q);

export const getAdminToken = () => sessionStorage.getItem('admin_token');
// Setting the token also marks the admin session active — the two always go
// together, so callers never touch the raw 'admin_auth' flag themselves.
export const setAdminToken = (t) => {
  sessionStorage.setItem('admin_token', t);
  sessionStorage.setItem('admin_auth', '1');
};
export const isAdminAuthed = () => sessionStorage.getItem('admin_auth') === '1';
export const clearAdminSession = () => {
  sessionStorage.removeItem('admin_auth');
  sessionStorage.removeItem('admin_token');
};

// Parses a response body defensively: 204/empty and non-JSON responses (a proxy
// HTML error page, a 502, etc.) return null instead of throwing an opaque
// "Unexpected token <" so the caller sees the real status/message.
async function parseJson(res) {
  if (res.status === 204 || res.status === 205) return null;
  if (!(res.headers.get('content-type') || '').includes('application/json')) return null;
  try { return await res.json(); } catch { return null; }
}

// Builds a request function bound to a token source (user vs. admin). Both
// variants share identical URL/header/error handling — only the token differs.
// Verb helpers (post/patch/put/del) wrap the JSON-body boilerplate.
function makeRequest(getTokenFn, clearSessionFn, onSessionEnded) {
  async function request(path, options = {}) {
    const token = getTokenFn();
    const url = `${apiBase}${path}`;
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    const data = await parseJson(res);
    if (!res.ok) {
      // A 401 on a request we authenticated means the token is missing/expired
      // (wrong-role is 403). Drop the stale session so the app stops believing
      // it's signed in, and bounce to home unless we're already on a public page.
      if (res.status === 401 && token) {
        clearSessionFn();
        if (onSessionEnded) await onSessionEnded(); // e.g. stop native tracking on user-token expiry
        if (!/^\/(home|login)\b/.test(window.location.pathname)) window.location.assign('/home');
      }
      const err = new Error(data?.error || `Request failed (${res.status})`);
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

// On user-token expiry (401), pause native passive tracking so a logged-out
// session can't keep tracking — but keep the saved choice so the same user's
// next login resumes. Dynamic import avoids a circular dependency
// (backgroundTracking imports `api` from this module). The inner flush's own
// request 401s without a token, so its handler is skipped — no loop.
const request = makeRequest(getToken, clearSession, () =>
  import('../features/location/backgroundTracking').then((m) => m.pauseTracking()).catch(() => {})
);
const adminRequest = makeRequest(getAdminToken, clearAdminSession);

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
  saveAdminMarkers: (points)         => adminRequest.put('/api/markers/singleton', { points }),
  adminGetUserMarkers: (username)    => adminRequest(`/api/markers/user/${encodeURIComponent(username)}`),
  adminSaveMarkers: (username, points) => adminRequest.put(`/api/markers/user/${encodeURIComponent(username)}`, { points }),

  // Locations (background tracking — upload only)
  logLocations: (points) => request.post('/api/locations', { points }),

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
    // In admin view there's no user session, so load with the admin token too;
    // otherwise the gated GET 401s and the map would load empty (then a save
    // would wipe the user's real markers).
    load: isAdminView ? () => api.adminGetUserMarkers(username) : () => api.getMarkers(username),
    save: isAdminView ? (points) => api.adminSaveMarkers(username, points) : api.saveMarkers,
  };
}
