import { useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import LogoutButton from '../components/LogoutButton';
import WaitlistTable from '../features/admin/WaitlistTable';
import UsersTable from '../features/admin/UsersTable';
import { useWaitlist } from '../features/admin/useWaitlist';
import { useUsers } from '../features/admin/useUsers';

export default function Admin() {
  const navigate = useNavigate();
  const { entries, loading, error, approvingId, approve, remove, reorder, exportCSV } = useWaitlist();
  const { users, loading: usersLoading, error: usersError } = useUsers();

  return (
    <div className="admin-page">
      <AppHeader
        right={
          <>
            <span className="admin-badge">Admin</span>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>
              <LayoutDashboard size={15} /> <span className="btn-label">Admin Dashboard</span>
            </button>
            <LogoutButton admin />
          </>
        }
      />
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
        <UsersTable users={users} loading={usersLoading} error={usersError} />
      </div>
    </div>
  );
}
