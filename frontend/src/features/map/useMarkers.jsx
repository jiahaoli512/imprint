import { useState, useEffect } from 'react';

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
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    setSaveError('');
    try {
      await save(draft);
    } catch (e) {
      // Surface the failure instead of pretending it saved: keep the draft and
      // the prompt open so the user can retry or discard.
      setSaveError(e?.message || 'Could not save your changes. Please try again.');
      return;
    } finally {
      setSaving(false);
    }
    setSaved(draft);
    setDraft([]);
    setMode('view');
    setPromptOpen(false);
  }

  function discard() {
    setDraft([]);
    setMode('view');
    setPromptOpen(false);
    setSaveError('');
  }

  // Confirmation-flow state + handlers (rendered by the page via <SaveMapPrompt>).
  // The hook owns the logic; the UI lives in a component — not returned as JSX.
  const savePrompt = {
    open: promptOpen,
    saving,
    error: saveError,
    onConfirm: commit,
    onDiscard: discard,
    onCancel: () => { setPromptOpen(false); setSaveError(''); },
  };

  return {
    displayMarkers, editing,
    enterEdit, enterView,
    addMarker, removeMarker, clearDraft,
    savePrompt,
  };
}
