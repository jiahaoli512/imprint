import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UserRouter from './pages/UserRouter';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import {
  RequireAuth,
  RequireAdminAuth,
  RequireAuthOrAdmin,
  SmartHome,
  SmartLogin,
  SmartLoginProfile,
  OwnDashboardOnly,
  CatchAll,
} from './auth/guards';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<SmartHome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<SmartLogin />} />
        <Route path="/login/profile" element={<SmartLoginProfile />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/user-not-found" element={<RequireAuthOrAdmin><NotFound /></RequireAuthOrAdmin>} />
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
        <Route path="/:username" element={<RequireAuthOrAdmin><UserRouter /></RequireAuthOrAdmin>} />
        <Route path="/:username/*" element={<RequireAuthOrAdmin><UserRouter /></RequireAuthOrAdmin>} />
        <Route path="*" element={<CatchAll />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
