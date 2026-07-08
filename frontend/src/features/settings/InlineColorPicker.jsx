import { useEffect, useRef, useState } from 'react';
import { hexToHsv, hsvToHex, hsvToRgb, rgbToHsv } from '../../utils/color';
import { clamp } from '../../utils/number';
import { useSyncedState } from '../../utils/useSyncedState';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// An always-expanded HSV color picker themed for the app: a saturation/value
// panel, a hue slider with a live preview, and editable R/G/B + hex fields (so a
// color can be entered by dragging, by RGB, or by hex). `value` is "#rrggbb".
//
// HSV is kept as local state (not derived from the hex each render) so hue stays
// stable through grayscale — dragging value to black doesn't lose the hue.
export default function InlineColorPicker({ value, onChange, shape }) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexText, setHexText] = useSyncedState(value);
  const svRef = useRef(null);
  const hueRef = useRef(null);

  // Reflect an external change (e.g. a preset swatch click) into the local HSV,
  // unless it already renders to the same color (our own edits, mid-drag). The
  // hex field re-syncs on its own via useSyncedState.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hsvToHex(hsv) !== value) setHsv(hexToHsv(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Apply an HSV change: update local state + push the hex upstream.
  const commit = (next) => {
    setHsv(next);
    const hex = hsvToHex(next);
    setHexText(hex);
    onChange(hex);
  };

  // Saturation (x) / value (y) panel — drag to set both.
  const svFrom = (e) => {
    const r = svRef.current.getBoundingClientRect();
    return {
      ...hsv,
      s: clamp((e.clientX - r.left) / r.width, 0, 1),
      v: 1 - clamp((e.clientY - r.top) / r.height, 0, 1),
    };
  };
  const onSvDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); commit(svFrom(e)); };
  const onSvMove = (e) => { if (e.buttons === 1) commit(svFrom(e)); };

  // Hue slider — drag to set hue.
  const hueFrom = (e) => {
    const r = hueRef.current.getBoundingClientRect();
    return { ...hsv, h: clamp((e.clientX - r.left) / r.width, 0, 1) * 360 };
  };
  const onHueDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); commit(hueFrom(e)); };
  const onHueMove = (e) => { if (e.buttons === 1) commit(hueFrom(e)); };

  // R/G/B fields — edit a channel and recompute HSV from the resulting rgb.
  const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const setChannel = (key, raw) => {
    const n = clamp(parseInt(raw, 10) || 0, 0, 255);
    const next = { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b), [key]: n };
    commit(rgbToHsv(next.r, next.g, next.b));
  };

  // Hex field — commit only a complete, valid hex (partial typing stays local).
  const onHexInput = (t) => {
    setHexText(t);
    if (HEX_RE.test(t)) { const h = t.toLowerCase(); setHsv(hexToHsv(h)); onChange(h); }
  };

  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const previewHex = hsvToHex(hsv);

  return (
    <div className="ipick">
      <div
        ref={svRef}
        className="ipick-sv"
        style={{ '--ipick-hue': hueColor }}
        onPointerDown={onSvDown}
        onPointerMove={onSvMove}
      >
        <div className="ipick-thumb" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }} />
      </div>

      <div className="ipick-row">
        <span className={`ipick-preview${shape === 'pin' ? ' pin-shape' : ''}`} style={{ background: previewHex, boxShadow: `0 0 10px 1px ${previewHex}b3` }} />
        <div ref={hueRef} className="ipick-hue" onPointerDown={onHueDown} onPointerMove={onHueMove}>
          <div className="ipick-thumb ipick-hue-thumb" style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }} />
        </div>
      </div>

      <div className="ipick-fields">
        {['r', 'g', 'b'].map((k) => (
          <div key={k} className="ipick-field">
            <input
              type="number" min="0" max="255"
              className="ipick-num"
              value={Math.round(rgb[k])}
              onChange={(e) => setChannel(k, e.target.value)}
              aria-label={k.toUpperCase()}
            />
            <span className="ipick-field-label">{k.toUpperCase()}</span>
          </div>
        ))}
        <div className="ipick-field ipick-field-hex">
          <input
            type="text"
            className="ipick-num ipick-hex"
            value={hexText}
            onChange={(e) => onHexInput(e.target.value)}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={7}
            aria-label="Hex"
          />
          <span className="ipick-field-label">HEX</span>
        </div>
      </div>
    </div>
  );
}
