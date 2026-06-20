const NBSP = ' ';

// Renders text as individual letters that scale up in sequence, so the size
// "pulse" travels left to right like a wave (each letter's animation is delayed
// by its position). The first `italicLen` characters render italic — used to
// keep the greeting phrase italic while the name stays upright. The gradient is
// inherited from the parent (background-clip: text).
export default function WaveText({ text, italicLen = 0, step = 0.1 }) {
  return [...text].map((ch, i) => (
    <span
      key={i}
      className="wave-char"
      style={{ animationDelay: `${i * step}s`, fontStyle: i < italicLen ? 'italic' : 'normal' }}
    >
      {ch === ' ' ? NBSP : ch}
    </span>
  ));
}
