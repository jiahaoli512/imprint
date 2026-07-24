import { Capacitor, registerPlugin } from '@capacitor/core';

export const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

const isNative = Capacitor.isNativePlatform();
const TOKEN_KEY = 'imprint_token';

// Bridges to KeychainStoragePlugin.swift (ios/App/App/) — a small local native
// plugin, not a third-party package (no free, SPM-native, Capacitor-7-compatible
// Keychain plugin existed; every option was CocoaPods-only, which this project's
// pure-SPM iOS setup doesn't have). Only ever resolved on native; there is no web
// implementation, since getToken()/setToken() below never call it off-native.
const KeychainStorage = isNative ? registerPlugin('KeychainStorage') : null;

// The session token used to live in plain localStorage on every platform. On the
// native app that's a real exposure: WKWebView's localStorage is an unencrypted
// SQLite file in the app sandbox (not the iOS Keychain), readable via a jailbreak
// or a forensic/backup extraction of the device — either hands over the live
// 7-day session token, a full account takeover with no password needed. On
// native, persist it in the Keychain instead; web keeps the existing plain
// localStorage path unchanged (browser-side session storage is an accepted,
// different threat model this app doesn't otherwise harden against).
//
// The Keychain API is async, but getToken() is read synchronously on every
// request to build its Authorization header. Bridge that with an in-memory
// mirror: hydrateAuth() (called once at boot — see main.jsx) does the one async
// Keychain read and populates it; every read/write after that goes through the
// mirror synchronously, with writes fired through to the Keychain in the
// background. The mirror itself only ever lives in JS memory, never written back
// to localStorage — persisting nothing in the exposed store defeats the point.
let tokenCache = null;
let hydrated = !isNative; // web has no async hydration step to wait on

export async function hydrateAuth() {
  if (!isNative || hydrated) return;
  try {
    const { value } = await KeychainStorage.getItem({ key: TOKEN_KEY });
    tokenCache = value ?? null;
  } catch (err) {
    console.error('[keychain] Failed to read token from Keychain:', err.message);
    tokenCache = null;
  }
  hydrated = true;
}

export const getUsername = () => localStorage.getItem('imprint_username');
export const setUsername = (u) => localStorage.setItem('imprint_username', u);

export const getToken = () => (isNative ? tokenCache : localStorage.getItem(TOKEN_KEY));
export const setToken = (t) => {
  if (!isNative) { localStorage.setItem(TOKEN_KEY, t); return; }
  tokenCache = t;
  KeychainStorage.setItem({ key: TOKEN_KEY, value: t }).catch((err) =>
    console.error('[keychain] Failed to persist token to Keychain:', err.message));
};

export const clearSession = () => {
  localStorage.removeItem('imprint_username');
  if (isNative) {
    tokenCache = null;
    KeychainStorage.removeItem({ key: TOKEN_KEY }).catch(() => {});
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Per-device map render-quality preference. Validation against the known tiers
// lives in mapQuality.js (which owns the value set); here we only read/write the
// raw string, keeping all storage access in this module.
export const getStoredMapQuality = () => localStorage.getItem('imprint_map_quality');
export const setStoredMapQuality = (q) => localStorage.setItem('imprint_map_quality', q);

// Per-device map base-style preference (dark/light/streets). Validation against the
// known styles lives in basemap.js; here we only read/write the raw string.
export const getStoredMapStyle = () => localStorage.getItem('imprint_map_style');
export const setStoredMapStyle = (s) => localStorage.setItem('imprint_map_style', s);

// Per-device marker (point) color, a "#rrggbb" hex. Validation/default live in
// markerColor.js; here we only read/write the raw string.
export const getStoredMarkerColor = () => localStorage.getItem('imprint_marker_color');
export const setStoredMarkerColor = (c) => localStorage.setItem('imprint_marker_color', c);

// Per-device point opacity, an integer -100..100 (0 = default, +100 fully opaque,
// -100 transparent). Clamp/default live in pointOpacity.js; here we only read/write
// the raw string.
export const getStoredPointOpacity = () => localStorage.getItem('imprint_point_opacity');
export const setStoredPointOpacity = (t) => localStorage.setItem('imprint_point_opacity', String(t));

// Per-device marker (point) shape — 'dot' or 'pin'. Validation/default live in
// pointShape.js; here we only read/write the raw string.
export const getStoredPointShape = () => localStorage.getItem('imprint_point_shape');
export const setStoredPointShape = (s) => localStorage.setItem('imprint_point_shape', s);

// Per-device "reduce motion" preference — the single control for disabling
// animations (there is no hard prefers-reduced-motion CSS override; see index.css).
// Stored as '1' (on) / '0' (off); when the user hasn't chosen yet, default to the
// OS "Reduce Motion" setting so accessibility is respected out of the box but stays
// overridable via Display Settings.
export const getStoredReduceMotion = () => {
  const v = localStorage.getItem('imprint_reduce_motion');
  if (v === '1') return true;
  if (v === '0') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
};
export const setStoredReduceMotion = (on) => localStorage.setItem('imprint_reduce_motion', on ? '1' : '0');

// Per-session dashboard greeting (rolled on login). The greeting copy + rotation
// live in utils/greeting.js; storage access stays here per the convention.
export const getStoredGreeting = () => sessionStorage.getItem('imprint_greeting');
export const setStoredGreeting = (g) => sessionStorage.setItem('imprint_greeting', g);

// Signup verification-code resend cooldown, persisted so exiting and re-entering
// the signup flow resumes the countdown instead of letting the UI offer an
// immediate resend (the backend enforces the 60s window regardless; this just
// keeps the client honest). Stored as { email, until } and self-expires by time.
const CODE_CD_KEY = 'imprint_code_cooldown';
export const getCodeCooldown = (email) => {
  try {
    const raw = JSON.parse(localStorage.getItem(CODE_CD_KEY) || 'null');
    if (raw && raw.email === email && raw.until > Date.now())
      return Math.ceil((raw.until - Date.now()) / 1000);
  } catch { /* ignore malformed */ }
  return 0;
};
export const setCodeCooldown = (email, seconds) =>
  localStorage.setItem(CODE_CD_KEY, JSON.stringify({ email, until: Date.now() + seconds * 1000 }));
export const clearCodeCooldown = () => localStorage.removeItem(CODE_CD_KEY);

// Timestamp (ISO) the user last opened the notification panel, so the Activity
// side can mark items newer than this as unseen and drive the bell's badge.
// Stored client-side (activity is derived, not a server-tracked read state).
const ACTIVITY_SEEN_KEY = 'imprint_activity_seen';
export const getActivitySeen = () => localStorage.getItem(ACTIVITY_SEEN_KEY) || '';
export const setActivitySeen = (iso) => localStorage.setItem(ACTIVITY_SEEN_KEY, iso);

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
  requestCode:    (email)              => request.post('/api/users/request-code', { email }),
  verifyCode:     (email, code)        => request.post('/api/users/verify-code', { email, code }),
  // Password reset (forgot-password flow). verifyPasswordReset returns a login
  // token; resetPassword/finishReset then run under that token.
  requestPasswordReset: (email)        => request.post('/api/users/reset/request-code', { email }),
  verifyPasswordReset:  (email, code)  => request.post('/api/users/reset/verify-code', { email, code }),
  resetPassword:        (password)     => request.post('/api/users/reset/password', { password }),
  finishReset:          ()             => request.post('/api/users/reset/finish', {}),
  // Account settings tab: change password while signed in (returns a fresh
  // token like resetPassword, since it also revokes existing sessions);
  // full sign-out of every session including this one; a self-export emailed
  // to the account's own address (POST — it triggers a send, not just a read).
  getEmail:             ()             => request('/api/users/email'),
  changePassword:       (currentPassword, newPassword) =>
    request.post('/api/users/password', { currentPassword, newPassword }),
  logoutAllDevices:     ()             => request.post('/api/users/logout-all', {}),
  exportAccountData:    ()             => request.post('/api/users/export', {}),
  checkWaitlist:  (email)              => request(`/api/waitlist/check?email=${encodeURIComponent(email)}`),
  checkUsername:  (username)           => request(`/api/users/check-username?username=${encodeURIComponent(username)}`),
  setupProfile:   (body)               => request.patch('/api/users/profile', body),
  getUser:        (username)           => request(`/api/users/by-username/${encodeURIComponent(username)}`),
  updateUser:     (username, body)     => request.patch(`/api/users/by-username/${encodeURIComponent(username)}`, body),
  searchUsers:    (q)                  => request(`/api/users/search?q=${encodeURIComponent(q)}`),
  adminSearchUsers: (q)                => adminRequest(`/api/users/search?q=${encodeURIComponent(q)}`),

  // Friends
  sendFriendRequest:    (username)   => request.post('/api/friends/request', { username }),
  getFriendRequests:    ()           => request('/api/friends/requests'),
  getActivity:          ()           => request('/api/activity'),
  respondFriendRequest: (id, action) => request.post(`/api/friends/requests/${encodeURIComponent(id)}/respond`, { action }),
  getFriendsOf:         (username)   => request(`/api/friends/of/${encodeURIComponent(username)}`),
  adminGetFriendsOf:    (username)   => adminRequest(`/api/friends/of/${encodeURIComponent(username)}`),
  removeFriend:         (username)   => request.del(`/api/friends/${encodeURIComponent(username)}`),

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

// Resolve the user-search call for the current view (admin vs. self), keeping the
// isAdminView→endpoint mapping in this module like the other *ApiFor resolvers.
export function searchApiFor(isAdminView) {
  return { searchUsers: isAdminView ? api.adminSearchUsers : api.searchUsers };
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

// Resolve the friend-list call for the current view. Same reasoning as
// markersApiFor: in admin view there's no user session, so the gated GET must
// go out with the admin token or it 401s and the friends modal loads empty.
export function friendsApiFor(isAdminView) {
  return { getFriendsOf: isAdminView ? api.adminGetFriendsOf : api.getFriendsOf };
}
