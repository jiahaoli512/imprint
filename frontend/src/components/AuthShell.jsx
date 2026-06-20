import { ArrowLeft } from 'lucide-react';
import LogoMark from './LogoMark';

// Shared chrome for the centered auth-style pages (login, signup, profile setup,
// contact): the full-height backdrop, an optional back button, the card, and the
// Imprint logo. Pages render only their own content as children.
export default function AuthShell({ onBack, logoText = true, children }) {
  return (
    <div className="auth-page">
      {onBack && (
        <button className="auth-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
      )}
      <div className="auth-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <LogoMark size={40} icon={22} />
          {logoText && 'Imprint'}
        </div>
        {children}
      </div>
    </div>
  );
}
