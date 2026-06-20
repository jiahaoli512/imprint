import { Fingerprint } from 'lucide-react';

// The Imprint fingerprint badge. `size` overrides the square wrapper (px);
// omit it to use the .logo-icon CSS default (32px). `icon` is the glyph size,
// and `style` merges extra styles (e.g. margin/opacity). Keeps the badge markup
// in one place instead of repeating it across every header/auth screen.
export default function LogoMark({ size, icon = 18, style }) {
  const sizeStyle = size ? { width: `${size}px`, height: `${size}px` } : null;
  return (
    <div className="logo-icon" style={{ ...sizeStyle, ...style }}>
      <Fingerprint size={icon} strokeWidth={2} color="#0b0e13" />
    </div>
  );
}
