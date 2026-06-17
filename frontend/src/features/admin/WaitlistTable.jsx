import { useState } from 'react';
import { Users, Download, Trash2, GripVertical, CheckCircle, Clock } from 'lucide-react';
import { useDragReorder } from './useDragReorder';
import { formatDate } from '../../utils/formatDate';

export default function WaitlistTable({ entries, loading, error, approvingId, onApprove, onDelete, onReorder, onExport }) {
  const [search, setSearch] = useState('');
  const { getRowProps } = useDragReorder(onReorder);

  const approvedCount = entries.filter((e) => e.approved).length;
  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.email.toLowerCase().includes(q) || (e.name || '').toLowerCase().includes(q);
  });

  return (
    <>
      <div className="admin-top">
        <div>
          <h1 className="admin-title">Waitlist</h1>
          <p className="admin-sub">
            {loading ? '—' : `${entries.length} signups · ${approvedCount} approved`}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onExport} disabled={loading || entries.length === 0}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {!loading && entries.length > 0 && (
        <input
          className="admin-search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {loading && <p className="admin-state">Loading…</p>}
      {error && <p className="admin-state error">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <div className="admin-empty">
          <Users size={40} color="var(--muted)" />
          <p>No signups yet.</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-grip" />
                <th className="col-num col-hide-mobile">#</th>
                <th>Email</th>
                <th className="col-hide-mobile">Name</th>
                <th className="col-hide-mobile">Joined</th>
                <th className="col-status">Status</th>
                <th className="col-actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="admin-state" style={{ padding: '24px', textAlign: 'center' }}>No results.</td></tr>
              ) : filtered.map((e, i) => (
                <tr key={e._id} {...getRowProps(i)}>
                  <td className="col-grip">
                    <GripVertical size={14} className="grip-icon" />
                  </td>
                  <td className="muted col-num col-hide-mobile">{i + 1}</td>
                  <td>{e.email}</td>
                  <td className="muted col-hide-mobile">{e.name || '—'}</td>
                  <td className="muted col-hide-mobile">{formatDate(e.createdAt)}</td>
                  <td className="col-status">
                    {e.approved
                      ? <span className="status-badge approved"><CheckCircle size={11} /> Approved</span>
                      : <span className="status-badge pending"><Clock size={11} /> Pending</span>
                    }
                  </td>
                  <td className="col-actions">
                    <div className="actions-wrap">
                      {!e.approved && (
                        <button
                          className="approve-btn"
                          onClick={() => onApprove(e._id)}
                          disabled={approvingId === e._id}
                          title="Approve & email user"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={() => onDelete(e._id)}
                        title="Remove from waitlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
