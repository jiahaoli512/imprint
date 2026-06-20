import LogoMark from './LogoMark';

export default function Spinner() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <LogoMark size={48} icon={26} style={{ opacity: 0.5 }} />
    </div>
  );
}
