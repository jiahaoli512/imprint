import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Fingerprint } from 'lucide-react';
import './index.css';
import Home from './pages/Home';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import UserRouter from './pages/UserRouter';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';

const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

function RequireAuth({ children }) {
  if (!localStorage.getItem('imprint_username')) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function RequireAdminAuth({ children }) {
  if (!sessionStorage.getItem('admin_auth')) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function SmartHome() {
  const username = localStorage.getItem('imprint_username');
  if (username) return <Navigate to={`/${username}/dashboard`} replace />;
  return <Home />;
}

function SmartLogin() {
  const username = localStorage.getItem('imprint_username');
  if (username) return <Navigate to={`/${username}/dashboard`} replace />;
  return <Login />;
}

function SmartLoginProfile() {
  const username = localStorage.getItem('imprint_username');
  if (username) return <Navigate to={`/${username}/dashboard`} replace />;
  return <Profile />;
}

function OwnDashboardOnly({ children }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const me = localStorage.getItem('imprint_username');

  useEffect(() => {
    if (me === username) return;
    fetch(`${apiBase}/api/users/by-username/${encodeURIComponent(username)}`)
      .then(res => {
        if (res.status === 404) navigate('/user-not-found', { replace: true });
        else navigate(`/${username}/profile`, { replace: true });
      })
      .catch(() => navigate('/user-not-found', { replace: true }));
  }, [username]);

  if (me !== username) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="logo-icon" style={{ width: '48px', height: '48px', opacity: 0.5 }}>
        <Fingerprint size={26} strokeWidth={2} color="#080c14" />
      </div>
    </div>
  );
  return children;
}

function CatchAll() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const me = localStorage.getItem('imprint_username');
    if (!me) { navigate('/home', { replace: true }); return; }

    const segment = pathname.split('/').filter(Boolean)[0];
    if (!segment) { navigate(`/${me}/dashboard`, { replace: true }); return; }

    if (me === segment) { navigate(`/${segment}/dashboard`, { replace: true }); return; }

    fetch(`${apiBase}/api/users/by-username/${encodeURIComponent(segment)}`)
      .then(res => {
        if (res.status === 404) navigate('/user-not-found', { replace: true });
        else navigate(`/${segment}/profile`, { replace: true });
      })
      .catch(() => navigate('/user-not-found', { replace: true }));
  }, [pathname]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="logo-icon" style={{ width: '48px', height: '48px', opacity: 0.5 }}>
        <Fingerprint size={26} strokeWidth={2} color="#080c14" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<SmartHome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<SmartLogin />} />
        <Route path="/login/profile" element={<SmartLoginProfile />} />
        <Route path="/user-not-found" element={<RequireAuth><NotFound /></RequireAuth>} />
        <Route path="/admin/dashboard" element={
          <RequireAdminAuth><AdminDashboard /></RequireAdminAuth>
        } />
        <Route path="/admin/waitlist" element={
          <RequireAdminAuth><Admin /></RequireAdminAuth>
        } />
        <Route path="/admin/:username/dashboard" element={
          <RequireAdminAuth><Dashboard /></RequireAdminAuth>
        } />
        <Route path="/admin/:username/profile" element={
          <RequireAdminAuth><UserProfile /></RequireAdminAuth>
        } />
        <Route path="/:username/dashboard" element={<RequireAuth><OwnDashboardOnly><Dashboard /></OwnDashboardOnly></RequireAuth>} />
        <Route path="/:username/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
        <Route path="/:username" element={<RequireAuth><UserRouter /></RequireAuth>} />
        <Route path="/:username/*" element={<RequireAuth><UserRouter /></RequireAuth>} />
        <Route path="*" element={<CatchAll />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
