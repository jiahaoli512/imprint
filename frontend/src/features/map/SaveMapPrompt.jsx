import ConfirmModal from '../../components/ConfirmModal';

// Renders the map save/discard confirmation from useMarkers' `savePrompt` state.
// Spread it in: <SaveMapPrompt {...savePrompt} />. Keeps UI out of the hook.
export default function SaveMapPrompt({ open, saving, error, onConfirm, onDiscard, onCancel }) {
  if (!open) return null;
  return (
    <ConfirmModal
      title="Save changes?"
      message="Do you want to save your changes to the map?"
      error={error}
      busy={saving}
      confirmLabel={saving ? 'Saving…' : 'Save'}
      altLabel="Discard"
      onConfirm={onConfirm}
      onAlt={onDiscard}
      onCancel={onCancel}
    />
  );
}
