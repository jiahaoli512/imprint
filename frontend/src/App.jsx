import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Home from './pages/Home';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import Signup from './pages/Signup';

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
        <Route path="/admin/dashboard" element={
          <RequireAdminAuth>
            <AdminDashboard />
          </RequireAdminAuth>
        } />
        <Route path="/admin/waitlist" element={
          <RequireAdminAuth>
            <Admin />
          </RequireAdminAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}
