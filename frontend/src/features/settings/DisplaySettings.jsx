import { useState, useEffect } from 'react';
import { QUALITY_ORDER, QUALITY_LABEL, DEFAULT_QUALITY, useMapQuality } from '../map/mapQuality';
import { BASEMAP_ORDER, BASEMAPS, DEFAULT_BASEMAP, useBasemap } from '../map/basemap';
import { MARKER_PRESETS, useMarkerColor } from '../map/markerColor';
import { useReduceMotion } from './reduceMotion';

// A labeled setting row: title + one-line description, then its control below.
function Setting({ title, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-label">{title}</div>
      <p className="settings-row-desc">{description}</p>
      {children}
    </div>
  );
}

// A segmented picker (reuses the map-quality control styling): one button per
// option, the current one highlighted, with an optional "Recommended" tag.
function Segmented({ order, labelOf, value, onChange, defaultValue }) {
  return (
    <div className="quality-seg">
      {order.map((key) => (
        <button
          key={key}
          type="button"
          className={`quality-seg-btn${key === value ? ' active' : ''}`}
          onClick={() => onChange(key)}
        >
          <span className="quality-seg-label">{labelOf(key)}</span>
          {key === defaultValue && <span className="quality-seg-tag">Recommended</span>}
        </button>
      ))}
    </div>
  );
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Preset color swatches (centered, wrapping) above a custom-color row: a color
// wheel plus a hex text field you can type into directly — no click needed to
// enter an RGB/hex value. `value` is a lowercase "#rrggbb".
function ColorPicker({ presets, value, onChange }) {
  // Local text state so a partially-typed hex (e.g. "#3") doesn't get coerced to
  // the default mid-edit; only a complete, valid hex is committed upstream.
  const [hexText, setHexText] = useState(value);
  // Reflect swatch/wheel changes back into the text field (the field is otherwise
  // the source of truth while typing).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHexText(value), [value]);

  const onHexInput = (t) => {
    setHexText(t);
    if (HEX_RE.test(t)) onChange(t.toLowerCase());
  };

  return (
    <div className="color-picker">
      <div className="color-swatches">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            className={`color-swatch${c === value ? ' active' : ''}`}
            style={{ background: c }}
            aria-label={`Point color ${c}`}
            aria-pressed={c === value}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div className="color-custom">
        <label className="color-swatch color-wheel" title="Open color picker">
          <input
            type="color"
            value={value}
            onChange={(e) => onHexInput(e.target.value)}
            aria-label="Custom point color"
          />
        </label>
        <input
          type="text"
          className="color-hex-input"
          value={hexText}
          onChange={(e) => onHexInput(e.target.value)}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={7}
          placeholder="#rrggbb"
          aria-label="Custom color hex code"
        />
      </div>
    </div>
  );
}

// The Display Settings tab: per-device map + motion preferences.
export default function DisplaySettings() {
  const [quality, setQuality] = useMapQuality();
  const [basemap, setBasemap] = useBasemap();
  const [markerColor, setMarkerColor] = useMarkerColor();
  const [reduceMotion, setReduceMotion] = useReduceMotion();

  return (
    <div className="settings-panel">
      <Setting title="Map quality" description="Higher shows more of your points; lower stays smooth on large maps.">
        <Segmented order={QUALITY_ORDER} labelOf={(q) => QUALITY_LABEL[q]} value={quality} onChange={setQuality} defaultValue={DEFAULT_QUALITY} />
      </Setting>

      <Setting title="Map style" description="The base map tiles behind your markers.">
        <Segmented order={BASEMAP_ORDER} labelOf={(b) => BASEMAPS[b].label} value={basemap} onChange={setBasemap} defaultValue={DEFAULT_BASEMAP} />
      </Setting>

      <Setting title="Point color" description="The color of your markers on the map. Pick a preset or choose a custom color.">
        <ColorPicker presets={MARKER_PRESETS} value={markerColor} onChange={setMarkerColor} />
      </Setting>

      <Setting title="Reduce motion" description="Minimize animations and transitions across the app.">
        <button
          type="button"
          role="switch"
          aria-checked={reduceMotion}
          className={`settings-toggle${reduceMotion ? ' on' : ''}`}
          onClick={() => setReduceMotion(!reduceMotion)}
        >
          <span className="settings-toggle-knob" />
        </button>
      </Setting>
    </div>
  );
}
