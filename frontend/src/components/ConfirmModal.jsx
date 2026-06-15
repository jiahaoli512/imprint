import { createPortal } from 'react-dom';

export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', altLabel, danger = false, onConfirm, onAlt, onCancel }) {
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {message && <p className="modal-sub">{message}</p>}
        <div className="confirm-modal-actions">
          {altLabel && (
            <button className="btn confirm-modal-btn confirm-modal-danger" onClick={onAlt}>
              {altLabel}
            </button>
          )}
          <button
            className={`btn confirm-modal-btn${danger ? ' confirm-modal-danger' : ' btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
