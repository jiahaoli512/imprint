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
  if (isNative || !isAdminAuthed()) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

export function RequireAuthOrAdmin({ children }) {
  if (!getUsername() && !isAdminAuthed()) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

export function SmartHome() {
  const username = getUsername();
  if (username) return <Navigate to={`/${username}/dashboard`} replace />;
  return <Home />;
}

export function SmartLogin() {
  const username = getUsername();
  if (username) return <Navigate to={`/${username}/dashboard`} replace />;
  return <Login />;
}

export function SmartLoginProfile() {
  const username = getUsername();
  if (username) return <Navigate to={`/${username}/dashboard`} replace />;
  return <Profile />;
}

export function OwnDashboardOnly({ children }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const me = getUsername();

  useEffect(() => {
    if (me === username) return;
    api.getUser(username)
      .then(() => navigate(`/${username}/profile`, { replace: true }))
      .catch(err => {
        if (err.status === 404) navigate('/user-not-found', { replace: true });
        else navigate('/user-not-found', { replace: true });
      });
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

    api.getUser(segment)
      .then(() => navigate(`/${segment}/profile`, { replace: true }))
      .catch(err => {
        if (err.status === 404) navigate('/user-not-found', { replace: true });
        else navigate('/user-not-found', { replace: true });
      });
  }, [pathname]);

  return <Spinner />;
}
