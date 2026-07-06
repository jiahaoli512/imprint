import InlineColorPicker from './InlineColorPicker';

// Centered, wrapping preset swatches above an always-expanded custom color picker
// (drag / RGB / hex). Each swatch renders like a map point: a dark rim over a
// color-tinted glow. `value` is a lowercase "#rrggbb".
export default function ColorPicker({ presets, value, onChange }) {
  return (
    <div className="color-picker">
      <div className="color-swatches">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            className={`color-swatch${c === value ? ' active' : ''}`}
            // Glow tinted by the swatch color, mirroring the map pin's colored halo.
            style={{ background: c, boxShadow: `0 0 9px 1px ${c}b3` }}
            aria-label={`Point color ${c}`}
            aria-pressed={c === value}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <InlineColorPicker value={value} onChange={onChange} />
    </div>
  );
}
