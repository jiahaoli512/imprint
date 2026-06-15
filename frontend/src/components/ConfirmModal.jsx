export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {message && <p className="modal-sub">{message}</p>}
        <div className="confirm-modal-actions">
          <button className="btn btn-ghost confirm-modal-btn" onClick={onCancel}>Cancel</button>
          <button
            className={`btn confirm-modal-btn${danger ? ' confirm-modal-danger' : ' btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
