import { Fingerprint, ArrowLeft } from 'lucide-react';

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
          <div className="logo-icon" style={{ width: '40px', height: '40px' }}>
            <Fingerprint size={22} strokeWidth={2} color="#0b0e13" />
          </div>
          {logoText && 'Imprint'}
        </div>
        {children}
      </div>
    </div>
  );
}
