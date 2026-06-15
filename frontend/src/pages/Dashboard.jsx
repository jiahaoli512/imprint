import { Fingerprint } from 'lucide-react';

export default function Dashboard() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div className="logo-icon" style={{ width: '64px', height: '64px' }}>
        <Fingerprint size={36} strokeWidth={2} color="#080c14" />
      </div>
    </div>
  );
}
