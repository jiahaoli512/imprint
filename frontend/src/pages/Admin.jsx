import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft, Users, Download, Trash2, GripVertical, CheckCircle, Clock } from 'lucide-react';
export default function Admin() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || window.location.origin;

  function apiFetch(path, options) {
    return fetch(`${apiBase}${path}`, options).then((r) => r.json());
  }

  useEffect(() => {
    fetch(`${apiBase}/api/waitlist`)
      .then((r) => r.json())
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
      await apiFetch(`/api/waitlist/${id}/approve`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
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
      await apiFetch(`/api/waitlist/${id}`, { method: 'DELETE' });
    } catch {
      setEntries(prev);
    }
  }

  async function commitReorder(from, to) {
    if (from === null || from === to) return;
    const reordered = [...entries];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setEntries(reordered);
    try {
      await apiFetch('/api/waitlist/reorder', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: reordered.map((entry) => entry._id) }) });
    } catch {
      fetch(`${apiBase}/api/waitlist`).then((r) => r.json()).then(setEntries).catch(() => {});
    }
  }

  // Mouse / desktop drag
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
    await commitReorder(from, i);
  }

  function onDragEnd() {
    dragIndex.current = null;
    setDragOver(null);
  }

  // Touch / mobile drag
  function onTouchStart(e, i) {
    dragIndex.current = i;
  }

  function onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el?.closest('tr[data-index]');
    const idx = row ? parseInt(row.dataset.index, 10) : null;
    if (idx !== null && idx !== dragOver) setDragOver(idx);
  }

  async function onTouchEnd() {
    const from = dragIndex.current;
    const to = dragOver;
    dragIndex.current = null;
    setDragOver(null);
    await commitReorder(from, to);
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
           <div className="admin-table-scroll">
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
                    data-index={i}
                    draggable
                    onDragStart={(ev) => onDragStart(ev, i)}
                    onDragOver={(ev) => onDragOver(ev, i)}
                    onDrop={(ev) => onDrop(ev, i)}
                    onDragEnd={onDragEnd}
                    onTouchStart={(ev) => onTouchStart(ev, i)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
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
          </div>
        )}
      </div>
    </div>
  );
}
