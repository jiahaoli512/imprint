import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, LayoutDashboard, LogOut } from 'lucide-react';
import LogoutModal from '../components/LogoutModal';
import WaitlistTable from '../features/admin/WaitlistTable';
import UsersTable from '../features/admin/UsersTable';
import { useWaitlist } from '../features/admin/useWaitlist';
import { useUsers } from '../features/admin/useUsers';

export default function Admin() {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { entries, loading, error, approvingId, approve, remove, reorder, exportCSV } = useWaitlist();
  const { users } = useUsers();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="logo">
          <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
            <Fingerprint size={18} strokeWidth={2} color="#0b0e13" />
          </div>
          Imprint
        </div>
        <div className="admin-header-right">
          <span className="admin-badge">Admin</span>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>
            <LayoutDashboard size={15} /> <span className="btn-label">Admin Dashboard</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setConfirmLogout(true)}>
            <LogOut size={15} /> <span className="btn-label">Log out of Admin</span>
          </button>
        </div>
      </div>

      <div className="admin-header-spacer" />
      <div className="admin-body">
        <WaitlistTable
          entries={entries}
          loading={loading}
          error={error}
          approvingId={approvingId}
          onApprove={approve}
          onDelete={remove}
          onReorder={reorder}
          onExport={exportCSV}
        />
        <UsersTable users={users} />
      </div>

      {confirmLogout && <LogoutModal admin onCancel={() => setConfirmLogout(false)} />}
    </div>
  );
}
