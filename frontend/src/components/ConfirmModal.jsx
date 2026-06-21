import { createPortal } from 'react-dom';

export default function ConfirmModal({ title, message, error, confirmLabel = 'Confirm', altLabel, danger = false, busy = false, onConfirm, onAlt, onCancel }) {
  return createPortal(
    <div className="modal-overlay" onClick={busy ? undefined : onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {message && <p className="modal-sub">{message}</p>}
        {error && <p className="modal-sub" style={{ color: 'var(--error)' }}>{error}</p>}
        <div className="confirm-modal-actions">
          {altLabel && (
            <button className="btn confirm-modal-btn confirm-modal-danger" onClick={onAlt} disabled={busy}>
              {altLabel}
            </button>
          )}
          <button
            className={`btn confirm-modal-btn${danger ? ' confirm-modal-danger' : ' btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
