import PasswordAndConfirmFields from './PasswordAndConfirmFields';
import { passwordsMatch } from '../utils/passwordRules';

// Shared "choose + confirm a new password" step, used by Signup and
// ForgotPassword (both previously hand-rolled an identical copy of this
// field/checklist/match-state wiring — now factored into
// PasswordAndConfirmFields, which this also shares with Settings > Account >
// Change Password). The parent owns the actual password/confirmPassword
// state — it needs the value for its own submit call — and supplies
// whatever comes after the fields once they match (a button, extra copy,
// etc.) via `children`, since that part genuinely differs between callers
// (Signup shows terms copy + opens a confirm modal; ForgotPassword submits
// directly).
export default function NewPasswordStep({
  title,
  subtitle,
  passwordPlaceholder,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  error,
  children,
}) {
  const matches = passwordsMatch(password, confirmPassword);

  return (
    <>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-sub">{subtitle}</p>
      <div className="auth-form">
        <PasswordAndConfirmFields
          password={password}
          onPasswordChange={onPasswordChange}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={onConfirmPasswordChange}
          passwordPlaceholder={passwordPlaceholder}
        />

        {error && <p className="auth-error">{error}</p>}

        {matches && children}
      </div>
    </>
  );
}
