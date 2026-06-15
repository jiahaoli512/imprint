import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/profile" element={<Profile />} />
        <Route path="/user-not-found" element={<RequireAuth><NotFound /></RequireAuth>} />
        <Route path="/admin/dashboard" element={
          <RequireAdminAuth><AdminDashboard /></RequireAdminAuth>
        } />
        <Route path="/admin/waitlist" element={
          <RequireAdminAuth><Admin /></RequireAdminAuth>
        } />
        <Route path="/:username/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/:username/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
        <Route path="/:username" element={<RequireAuth><UserRouter /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
