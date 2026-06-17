import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import ConfirmModal from '../../components/ConfirmModal';

// Owns all map-marker state for a user's dashboard: loading, the read-only
// display, and (in admin view) the editable draft plus the entire save/discard
// confirmation flow. The save prompt is fully encapsulated — callers render the
// returned `savePrompt` element without knowing it exists as state.
export function useMarkers(username, isAdminView) {
  const [saved, setSaved] = useState([]);
  const [draft, setDraft] = useState([]);
  const [mode, setMode] = useState('view');
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api.getMarkers(username)
      .then(data => { if (active) setSaved(data); })
      .catch(() => { if (active) setSaved([]); });
    return () => { active = false; };
  }, [username]);

  const editing = isAdminView && mode === 'edit';
  const displayMarkers = editing ? draft : saved;

  function enterEdit() { setDraft([...saved]); setMode('edit'); }
  // Switching back to view while editing asks to save/discard first.
  function enterView() { if (editing) setPromptOpen(true); }
  function addMarker(pos) { setDraft(d => [...d, pos]); }
  function removeMarker(i) { setDraft(d => d.filter((_, idx) => idx !== i)); }
  function clearDraft() { setDraft([]); }

  async function save() {
    try { await api.saveMarkers(draft); } catch { /* silently fail — user keeps stale view */ }
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
      onConfirm={save}
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
