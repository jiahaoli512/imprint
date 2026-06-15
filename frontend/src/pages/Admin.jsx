import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, ArrowLeft, Users, Download, Trash2, GripVertical, CheckCircle, Clock, UserCheck, LayoutDashboard, LogOut, Map, UserCircle } from 'lucide-react';
export default function Admin() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  function apiFetch(path, options) {
    return fetch(`${apiBase}${path}`, options).then((r) => r.json());
  }

  useEffect(() => {
    fetch(`${apiBase}/api/waitlist`)
      .then((r) => r.json())
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    fetch(`${apiBase}/api/users`)
      .then((r) => r.json())
      .then(setRegisteredUsers)
      .catch(() => {});
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

  const filteredEntries = entries.filter((e) => {
    const q = waitlistSearch.toLowerCase();
    return !q || e.email.toLowerCase().includes(q) || (e.name || '').toLowerCase().includes(q);
  });

  const filteredUsers = registeredUsers.filter((u) => {
    const q = usersSearch.toLowerCase();
    return !q || u.email.toLowerCase().includes(q);
  });

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

        {!loading && entries.length > 0 && (
          <input
            className="admin-search"
            placeholder="Search by name or email…"
            value={waitlistSearch}
            onChange={(e) => setWaitlistSearch(e.target.value)}
          />
        )}

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
                  <th className="col-num col-hide-mobile">#</th>
                  <th>Email</th>
                  <th className="col-hide-mobile">Name</th>
                  <th className="col-hide-mobile">Joined</th>
                  <th className="col-status">Status</th>
                  <th className="col-actions" />
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr><td colSpan={7} className="admin-state" style={{ padding: '24px', textAlign: 'center' }}>No results.</td></tr>
                ) : filteredEntries.map((e, i) => (
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
                    <td className="muted col-num col-hide-mobile">{i + 1}</td>
                    <td>{e.email}</td>
                    <td className="muted col-hide-mobile">{e.name || '—'}</td>
                    <td className="muted col-hide-mobile">
                      {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* ── Registered Users ── */}
        <div className="admin-section">
          <div className="admin-top" style={{ marginTop: '48px' }}>
            <div>
              <h2 className="admin-title" style={{ fontSize: '28px' }}>Registered Users</h2>
              <p className="admin-sub">{registeredUsers.length} account{registeredUsers.length !== 1 ? 's' : ''} created</p>
            </div>
          </div>

          {registeredUsers.length === 0 ? (
            <div className="admin-empty">
              <UserCheck size={40} color="var(--muted)" />
              <p>No accounts yet.</p>
            </div>
          ) : (
            <>
              <input
                className="admin-search"
                placeholder="Search by email…"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
              />
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="col-num col-hide-mobile">#</th>
                      <th>Email</th>
                      <th className="col-hide-mobile">Joined</th>
                      <th className="col-actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={4} className="admin-state" style={{ padding: '24px', textAlign: 'center' }}>No results.</td></tr>
                    ) : filteredUsers.map((u, i) => (
                      <tr key={u._id}>
                        <td className="muted col-num col-hide-mobile">{i + 1}</td>
                        <td>{u.email}</td>
                        <td className="muted col-hide-mobile">
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="col-actions">
                          {u.username ? (
                            <div className="actions-wrap">
                              <button
                                className="approve-btn"
                                title="Edit dashboard"
                                onClick={() => navigate(`/admin/${u.username}/dashboard`)}
                              >
                                <Map size={14} />
                              </button>
                              <button
                                className="approve-btn"
                                title="Edit profile"
                                onClick={() => navigate(`/admin/${u.username}/profile`)}
                              >
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
      </div>

      {confirmLogout && (
        <div className="modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <Fingerprint size={28} strokeWidth={1.5} color="#4fffb0" />
            </div>
            <h2 className="modal-title">Log out of Admin?</h2>
            <p className="modal-sub" style={{ marginTop: '16px', color: '#ff6b6b' }}>
              You will be returned to the home page and your admin session will end.
            </p>
            <button
              className="btn btn-primary modal-submit"
              onClick={() => { sessionStorage.removeItem('admin_auth'); navigate('/home'); }}
            >
              Log out
            </button>
            <button className="modal-cancel" onClick={() => setConfirmLogout(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
