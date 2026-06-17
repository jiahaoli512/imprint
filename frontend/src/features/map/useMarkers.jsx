import { useState, useEffect } from 'react';
import ConfirmModal from '../../components/ConfirmModal';

// Owns map-marker state for a dashboard: loading, the read-only display, and
// (when `editable`) an editable draft plus the entire save/discard confirmation
// flow. Persistence is injected via `load`/`save` so both the per-user dashboard
// and the admin singleton dashboard can share the same machine.
//
//   load    — () => Promise<number[][]>   fetch the current markers
//   save    — (points) => Promise<any>    persist edited markers
//   editable— whether edit mode is allowed
//   deps    — effect deps that trigger a reload (e.g. [username])
export function useMarkers({ load, save, editable = false, deps = [] }) {
  const [saved, setSaved] = useState([]);
  const [draft, setDraft] = useState([]);
  const [mode, setMode] = useState('view');
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve(load())
      .then(data => { if (active) setSaved(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setSaved([]); });
    return () => { active = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const editing = editable && mode === 'edit';
  const displayMarkers = editing ? draft : saved;

  function enterEdit() { setDraft([...saved]); setMode('edit'); }
  // Switching back to view while editing asks to save/discard first.
  function enterView() { if (editing) setPromptOpen(true); }
  function addMarker(pos) { setDraft(d => [...d, pos]); }
  function removeMarker(i) { setDraft(d => d.filter((_, idx) => idx !== i)); }
  function clearDraft() { setDraft([]); }

  async function commit() {
    try { await save(draft); } catch { /* silently fail — user keeps stale view */ }
    setSaved(draft);
    setDraft([]);
    setMode('view');
    setPromptOpen(false);
  }

  function discard() {
    setDraft([]);
    setMode('view');
    setPromptOpen(false);
  }

  const savePrompt = promptOpen ? (
    <ConfirmModal
      title="Save changes?"
      message="Do you want to save your changes to the map?"
      confirmLabel="Save"
      altLabel="Discard"
      onConfirm={commit}
      onAlt={discard}
      onCancel={() => setPromptOpen(false)}
    />
  ) : null;

  return {
    displayMarkers, editing,
    enterEdit, enterView,
    addMarker, removeMarker, clearDraft,
    savePrompt,
  };
}
