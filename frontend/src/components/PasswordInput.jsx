import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// A password field with a built-in show/hide toggle. Owns its own visibility
// state so the auth pages don't each carry showPassword/showConfirm flags and the
// Eye/EyeOff icons. Forwards the field-specific props (value, onChange, etc.);
// `extraClass` adds modifiers like `auth-input-match` onto the base `auth-input`.
export default function PasswordInput({
  value, onChange, placeholder, autoComplete = 'new-password', extraClass = '', disabled = false,
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        type={show ? 'text' : 'password'}
        className={`auth-input${extraClass ? ` ${extraClass}` : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)} disabled={disabled}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
