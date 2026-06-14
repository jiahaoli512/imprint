import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Fingerprint, ArrowLeft, List } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="logo">
          <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
            <Fingerprint size={18} strokeWidth={2} color="#080c14" />
          </div>
          Imprint
        </div>
        <div className="admin-header-right">
          <span className="admin-badge">Admin</span>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/waitlist')}>
            <List size={15} /> Waitlist
          </button>
          <button className="btn btn-ghost" onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/home'); }}>
            <ArrowLeft size={15} /> Back to site
          </button>
        </div>
      </div>

      <div className="admin-header-spacer" />

      <div className="dashboard-map-wrap">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          minZoom={1}
          maxZoom={18}
          style={{ height: '100%', width: '100%' }}
          worldCopyJump={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </MapContainer>
      </div>
    </div>
  );
}
