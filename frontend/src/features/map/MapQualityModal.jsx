import Modal from '../../components/Modal';
import { QUALITY_ORDER, QUALITY_LABEL, DEFAULT_QUALITY, useMapQuality } from './mapQuality';

// Mobile picker for the per-device map render quality. Selecting a tier applies
// instantly (the map re-renders via the shared store); the modal stays open so
// the user can compare tiers, and closes on Done / tap-outside.
export default function MapQualityModal({ onClose }) {
  const [quality, setQuality] = useMapQuality();

  return (
    <Modal onClose={onClose} icon={false}>
      <h2 className="modal-title">Map Quality</h2>
      <p className="modal-sub">
        Higher quality shows more of your points; lower quality stays smooth on large maps.
      </p>

      <div className="quality-seg">
        {QUALITY_ORDER.map((q) => (
          <button
            key={q}
            type="button"
            className={`quality-seg-btn${q === quality ? ' active' : ''}`}
            onClick={() => setQuality(q)}
          >
            <span className="quality-seg-label">{QUALITY_LABEL[q]}</span>
            {q === DEFAULT_QUALITY && <span className="quality-seg-tag">Recommended</span>}
          </button>
        ))}
      </div>

      <button className="btn btn-primary modal-submit" onClick={onClose}>Done</button>
    </Modal>
  );
}
