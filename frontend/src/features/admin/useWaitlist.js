import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAsync } from '../../utils/useAsync';
import { downloadCsv } from '../../utils/csv';

// Owns waitlist data and all its mutations (approve, delete, reorder) plus CSV
// export. The initial load goes through useAsync, matching useUsers's
// pattern, rather than hand-rolling the same fetch/loading/error effect.
// Mutations then apply optimistic updates to `entries` — a local mutable
// copy, since useAsync's own `data` is just whatever the last load resolved
// and isn't meant to be mutated directly — rolling back / refetching on
// failure.
export function useWaitlist() {
  const { data, loading, error: loadError } = useAsync(api.getWaitlist);
  const [entries, setEntries] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const error = loadError ? (loadError.message || 'Failed to load waitlist.') : '';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (data) setEntries(data);
  }, [data]);

  async function approve(id) {
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

  async function remove(id) {
    const prev = entries;
    setEntries((es) => es.filter((e) => e._id !== id));
    try { await api.deleteWaitlistEntry(id); }
    catch { setEntries(prev); }
  }

  async function reorder(from, to) {
    if (from === null || from === to) return;
    const reordered = [...entries];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setEntries(reordered);
    try { await api.reorderWaitlist(reordered.map((e) => e._id)); }
    catch { api.getWaitlist().then(setEntries).catch(() => {}); }
  }

  function exportCSV() {
    const rows = [['#', 'Email', 'Name', 'Joined', 'Approved']];
    entries.forEach((e, i) => {
      rows.push([i + 1, e.email, e.name || '', new Date(e.createdAt).toLocaleString(), e.approved ? 'Yes' : 'No']);
    });
    downloadCsv('imprint-waitlist.csv', rows);
  }

  return { entries, loading, error, approvingId, approve, remove, reorder, exportCSV };
}
