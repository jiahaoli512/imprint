import { QUALITY_ORDER, QUALITY_LABEL, DEFAULT_QUALITY, useMapQuality } from '../map/mapQuality';
import { BASEMAP_ORDER, BASEMAPS, DEFAULT_BASEMAP, useBasemap } from '../map/basemap';
import { MARKER_PRESETS, useMarkerColor } from '../map/markerColor';
import { usePointOpacity, MIN_OPACITY, MAX_OPACITY } from '../map/pointOpacity';
import ColorPicker from './ColorPicker';
import OpacityControl from './OpacityControl';
import { useReduceMotion } from './reduceMotion';
import ScrollHint from '../../components/ScrollHint';

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

// The Display Settings tab: per-device map + motion preferences.
export default function DisplaySettings() {
  const [quality, setQuality] = useMapQuality();
  const [basemap, setBasemap] = useBasemap();
  const [markerColor, setMarkerColor] = useMarkerColor();
  const [pointOpacity, setPointOpacity] = usePointOpacity();
  const [reduceMotion, setReduceMotion] = useReduceMotion();

  return (
    <ScrollHint wrapClassName="settings-scroll" className="settings-panel">
      <Setting title="Map quality" description="Higher shows more of your points; lower stays smooth on large maps.">
        <Segmented order={QUALITY_ORDER} labelOf={(q) => QUALITY_LABEL[q]} value={quality} onChange={setQuality} defaultValue={DEFAULT_QUALITY} />
      </Setting>

      <Setting title="Map style" description="The base map tiles behind your markers.">
        <Segmented order={BASEMAP_ORDER} labelOf={(b) => BASEMAPS[b].label} value={basemap} onChange={setBasemap} defaultValue={DEFAULT_BASEMAP} />
      </Setting>

      <Setting title="Point color" description="The color of your markers on the map. Pick a preset or choose a custom color.">
        <ColorPicker presets={MARKER_PRESETS} value={markerColor} onChange={setMarkerColor} />
      </Setting>

      <Setting title="Point opacity" description="How solid your markers look. 0% is the default; +100% is fully opaque, -100% fully transparent.">
        <OpacityControl value={pointOpacity} onChange={setPointOpacity} min={MIN_OPACITY} max={MAX_OPACITY} />
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
    </ScrollHint>
  );
}
