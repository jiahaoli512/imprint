import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Map, UserCircle } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

export default function UsersTable({ users }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase();
    return !q || u.email.toLowerCase().includes(q) || fullName.includes(q);
  });

  return (
    <div className="admin-section">
      <div className="admin-top" style={{ marginTop: '48px' }}>
        <div>
          <h2 className="admin-title" style={{ fontSize: '28px' }}>Registered Users</h2>
          <p className="admin-sub">{users.length} account{users.length !== 1 ? 's' : ''} created</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="admin-empty">
          <UserCheck size={40} color="var(--muted)" />
          <p>No accounts yet.</p>
        </div>
      ) : (
        <>
          <input
            className="admin-search"
            placeholder="Search by email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-num col-hide-mobile">#</th>
                  <th>Email</th>
                  <th className="col-hide-mobile">Name</th>
                  <th className="col-hide-mobile">Date of Birth</th>
                  <th className="col-hide-mobile">Joined</th>
                  <th className="col-actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="admin-state" style={{ padding: '24px', textAlign: 'center' }}>No results.</td></tr>
                ) : filtered.map((u, i) => (
                  <tr key={u._id}>
                    <td className="muted col-num col-hide-mobile">{i + 1}</td>
                    <td>{u.email}</td>
                    <td className="muted col-hide-mobile">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="muted col-hide-mobile">{u.dateOfBirth ? formatDate(u.dateOfBirth) : '—'}</td>
                    <td className="muted col-hide-mobile">{formatDate(u.createdAt)}</td>
                    <td className="col-actions">
                      {u.username ? (
                        <div className="actions-wrap">
                          <button className="approve-btn" title="Edit dashboard" onClick={() => navigate(`/admin/${u.username}/dashboard`)}>
                            <Map size={14} />
                          </button>
                          <button className="approve-btn" title="Edit profile" onClick={() => navigate(`/admin/${u.username}/profile`)}>
                            <UserCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>No profile</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
