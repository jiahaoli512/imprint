import { useSyncedState } from '../../utils/useSyncedState';

// A slider paired with an editable number field (type a percentage directly) and
// a reset-to-0% button. `onChange` clamps, so out-of-range typed values snap in;
// the field snaps to the clamped value on blur.
export default function OpacityControl({ value, onChange, min, max }) {
  const [text, setText] = useSyncedState(String(value));

  const onText = (t) => {
    setText(t);
    const n = parseInt(t, 10);
    if (Number.isFinite(n)) onChange(n);
  };

  return (
    <div className="settings-slider-row">
      <input
        type="range"
        className="settings-slider"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Point opacity"
      />
      <div className="settings-num-wrap">
        <input
          type="number"
          className="settings-num"
          min={min}
          max={max}
          value={text}
          onChange={(e) => onText(e.target.value)}
          onBlur={() => setText(String(value))}
          aria-label="Point opacity percent"
        />
        <span className="settings-num-suffix">%</span>
      </div>
      <button
        type="button"
        className="settings-reset"
        onClick={() => onChange(0)}
        disabled={value === 0}
      >
        Reset
      </button>
    </div>
  );
}
