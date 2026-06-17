import { useState, useEffect } from 'react';
import { api } from '../../api/client';

// Owns waitlist data and all its mutations (approve, delete, reorder) plus CSV
// export. Mutations apply optimistic updates and roll back / refetch on failure.
export function useWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    api.getWaitlist()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'imprint-waitlist.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return { entries, loading, error, approvingId, approve, remove, reorder, exportCSV };
}
