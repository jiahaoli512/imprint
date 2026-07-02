import { useEffect } from 'react';
import { Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { api, getUsername, isAdminAuthed } from '../api/client';
import Spinner from '../components/Spinner';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Profile from '../pages/Profile';

const isNative = Capacitor.isNativePlatform();

export function RequireAuth({ children }) {
  if (!getUsername()) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

export function RequireAdminAuth({ children }) {
  // A user and an admin session are mutually exclusive. If a regular user is
  // logged in, never treat them as admin (even with a stale admin flag from an
  // earlier admin session in this tab) — send them to their own dashboard.
  const username = getUsername();
  if (username) return <Navigate to={`/${username}/dashboard`} replace />;
  if (isNative || !isAdminAuthed()) return <Navigate to="/home" replace />;
  return children;
}

export function RequireAuthOrAdmin({ children }) {
  if (!getUsername() && !isAdminAuthed()) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// Public-only pages (home, login, profile setup): a signed-in user is bounced to
// their dashboard, otherwise the page renders. One redirect rule, so each page is
// a one-liner and a new public page can't drift from the policy.
function redirectIfAuthed() {
  const username = getUsername();
  return username ? <Navigate to={`/${username}/dashboard`} replace /> : null;
}

export const SmartHome = () => redirectIfAuthed() ?? <Home />;
export const SmartLogin = () => redirectIfAuthed() ?? <Login />;
export const SmartLoginProfile = () => redirectIfAuthed() ?? <Profile />;

// Send a viewer to another user's profile if that user exists, else to the
// not-found page. Shared by the guards that land on a `/:username` they don't own.
function resolveUserRoute(name, navigate) {
  api.getUser(name)
    .then(() => navigate(`/${name}/profile`, { replace: true }))
    .catch(() => navigate('/user-not-found', { replace: true }));
}

export function OwnDashboardOnly({ children }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const me = getUsername();

  useEffect(() => {
    if (me === username) return;
    resolveUserRoute(username, navigate);
  }, [username]);

  if (me !== username) return <Spinner />;
  return children;
}

export function CatchAll() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const me = getUsername();
    if (!me) { navigate('/home', { replace: true }); return; }

    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment) { navigate(`/${me}/dashboard`, { replace: true }); return; }

    if (me === segment) { navigate(`/${segment}/dashboard`, { replace: true }); return; }

    resolveUserRoute(segment, navigate);
  }, [pathname]);

  return <Spinner />;
}
