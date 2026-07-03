import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Map, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { fullName } from '../../utils/fullName';
import { matchesQuery } from '../../utils/matchesQuery';

const PAGE_SIZE = 25;

export default function UsersTable({ users, loading = false, error = '' }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = users.filter((u) => matchesQuery(search, u.email, fullName(u)));

  // Paginate at PAGE_SIZE; clamp the page so removing rows can't strand an empty view.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const start = current * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="admin-section">
      <div className="admin-top" style={{ marginTop: '48px' }}>
        <div>
          <h2 className="admin-title" style={{ fontSize: '28px' }}>Registered Users</h2>
          <p className="admin-sub">{loading ? '—' : `${users.length} account${users.length !== 1 ? 's' : ''} created`}</p>
        </div>
      </div>

      {loading && <p className="admin-state">Loading…</p>}
      {error && <p className="admin-state error">{error}</p>}

      {!loading && !error && (users.length === 0 ? (
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
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
                ) : visible.map((u, i) => (
                  <tr key={u._id}>
                    <td className="muted col-num col-hide-mobile">{start + i + 1}</td>
                    <td>{u.email}</td>
                    <td className="muted col-hide-mobile">
                      {fullName(u, '—')}
                    </td>
                    <td className="muted col-hide-mobile">{u.dateOfBirth ? formatDate(u.dateOfBirth, { utc: true }) : '—'}</td>
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

          {filtered.length > PAGE_SIZE && (
            <div className="admin-pagination">
              <button
                className="icon-btn"
                onClick={() => setPage(current - 1)}
                disabled={current === 0}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="admin-page-label">
                {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <button
                className="icon-btn"
                onClick={() => setPage(current + 1)}
                disabled={current >= pageCount - 1}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ))}
    </div>
  );
}
