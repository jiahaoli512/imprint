// Renders text as individual letters that scale up in sequence, so the size
// "pulse" travels left to right like a wave. `startIndex` offsets the per-letter
// delay so the wave stays continuous when a line is split into multiple
// WaveText groups (greeting vs. name). The first `italicLen` letters render
// italic (the greeting phrase vs. the upright name). Spaces stay as plain text.
export default function WaveText({ text, italicLen = 0, step = 0.1, startIndex = 0 }) {
  return [...text].map((ch, j) => {
    const i = startIndex + j;
    if (ch === ' ') return ' ';
    return (
      <span
        key={i}
        className="wave-char"
        style={{ animationDelay: `${i * step}s`, fontStyle: i < italicLen ? 'italic' : 'normal' }}
      >
        {ch}
      </span>
    );
  });
}
