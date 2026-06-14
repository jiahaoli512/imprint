import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft, Users, Download, Trash2, GripVertical, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api/client';

export default function Admin() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    api.getWaitlist()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    const rows = [['#', 'Email', 'Name', 'Joined', 'Approved']];
    entries.forEach((e, i) => {
      rows.push([i + 1, e.email, e.name || '', new Date(e.createdAt).toLocaleString(), e.approved ? 'Yes' : 'No']);
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imprint-waitlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleApprove(id) {
    setApprovingId(id);
    try {
      await api.approveWaitlistEntry(id);
      setEntries((es) => es.map((e) => e._id === id ? { ...e, approved: true } : e));
    } catch (err) {
      alert(`Failed to approve: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDelete(id) {
    const prev = entries;
    setEntries((es) => es.filter((e) => e._id !== id));
    try {
      await api.deleteWaitlistEntry(id);
    } catch {
      setEntries(prev);
    }
  }

  function onDragStart(e, i) {
    dragIndex.current = i;
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, i) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOver !== i) setDragOver(i);
  }

  async function onDrop(e, i) {
    e.preventDefault();
    const from = dragIndex.current;
    setDragOver(null);
    dragIndex.current = null;
    if (from === null || from === i) return;

    const reordered = [...entries];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(i, 0, moved);
    setEntries(reordered);

    try {
      await api.reorderWaitlist(reordered.map((entry) => entry._id));
    } catch {
      api.getWaitlist().then(setEntries).catch(() => {});
    }
  }

  function onDragEnd() {
    dragIndex.current = null;
    setDragOver(null);
  }

  const approvedCount = entries.filter((e) => e.approved).length;

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
          <button className="btn btn-ghost" onClick={() => navigate('/home')}>
            <ArrowLeft size={15} /> Back to site
          </button>
        </div>
      </div>

      <div className="admin-body">
        <div className="admin-top">
          <div>
            <h1 className="admin-title">Waitlist</h1>
            <p className="admin-sub">
              {loading ? '—' : `${entries.length} signups · ${approvedCount} approved`}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={exportCSV} disabled={loading || entries.length === 0}>
            <Download size={15} /> Export CSV
          </button>
        </div>

        {loading && <p className="admin-state">Loading…</p>}
        {error   && <p className="admin-state error">{error}</p>}

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
                  <th className="col-num">#</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="col-actions" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr
                    key={e._id}
                    draggable
                    onDragStart={(ev) => onDragStart(ev, i)}
                    onDragOver={(ev) => onDragOver(ev, i)}
                    onDrop={(ev) => onDrop(ev, i)}
                    onDragEnd={onDragEnd}
                    className={[
                      dragIndex.current === i ? 'row-dragging' : '',
                      dragOver === i && dragIndex.current !== i ? 'row-drag-over' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td className="col-grip">
                      <GripVertical size={14} className="grip-icon" />
                    </td>
                    <td className="muted col-num">{i + 1}</td>
                    <td>{e.email}</td>
                    <td className="muted">{e.name || '—'}</td>
                    <td className="muted">
                      {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      {e.approved
                        ? <span className="status-badge approved"><CheckCircle size={11} /> Approved</span>
                        : <span className="status-badge pending"><Clock size={11} /> Pending</span>
                      }
                    </td>
                    <td className="col-actions">
                      {!e.approved && (
                        <button
                          className="approve-btn"
                          onClick={() => handleApprove(e._id)}
                          disabled={approvingId === e._id}
                          title="Approve & email user"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(e._id)}
                        title="Remove from waitlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
